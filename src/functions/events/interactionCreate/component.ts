import { ComponentType, MessageComponentInteraction } from 'discord.js';
import { CustomClient } from '../../../typings/Extensions.js';
import { default as responses } from '../../../configs/responses.json' with { type: 'json' };
const { vore } = responses;

export const name = 'component';
export async function execute(client: CustomClient<true>, interaction: MessageComponentInteraction) {
  // Check if we can handle this
  if (interaction.componentType != ComponentType.Button) return;
  if (!/_(yes|no)/.test(interaction.customId)) return;
  // Begin logic. Defer as needed
  await interaction.deferUpdate();
  const [type, answer] = interaction.customId.split('_');
  // Extract the data using a regex
  const regex =
    /\*Psst!\* ((?<preyName>.+) \(<@(?<preyDiscord>[0-9]{18,})>\)), .+ by ((?<predName>.+) \(<@(?<predDiscord>[0-9]{18,})>\))/;
  const { predName, predDiscord, preyName, preyDiscord } = regex.exec(interaction.message.content).groups; // skipcq: JS-D007
  if (!predName || !predDiscord || !preyName || !preyDiscord) return; // Invalid component we thought we could handle
  // Fetch the prey and reject if the user is not the prey
  const prey = await client.models.characters.findOne({ where: { ['data.name']: preyName } });
  if (interaction.user.id === predDiscord && answer === 'no') {
    await client.models.digestions.destroy({ where: { status: 'Voring', prey: prey.characterId } });

    return interaction.editReply({
      content: `*On second thought, ${predName} decided not to eat ${preyName} after all.*`,
      components: []
    });
  }
  if (interaction.user.id != preyDiscord)
    return interaction.followUp({ content: 'This is not your choice to make!', ephemeral: true });
  // Try to find the pred in the server.
  const predMember = await interaction.guild.members.fetch(predDiscord).catch(() => null);
  if (predMember === null) {
    if (prey.discordId !== preyDiscord) return; // User deleted character, and model is deleted
    await client.models.digestions.destroy({ where: { status: 'Voring', prey: prey.characterId } });
    return interaction.editReply({
      content: "*For some reason, you notice that your predator is gone. They must've left the server.*",
      components: []
    });
  }
  // Handle answers
  switch (answer) {
    case 'yes': {
      const res = vore[type];
      const random = Math.floor(Math.random() * res.length);
      await client.models.digestions.update(
        { status: 'Vored' },
        { where: { status: 'Voring', prey: prey.characterId } }
      );
      // Update stats
      await prey
        .getStats()
        .then((stats) => {
          stats.data = {
            ...stats.data,
            euphoria: stats.data.euphoria + 5,
            resistance: stats.data.resistance - 1
          };
          return stats.save();
        })
        .catch(() => null);

      const content = (await client.functions
        .get('utils_replaceVars')
        .execute(client, res[random], ['prey', 'pred'], [preyName, predName])) as string;

      interaction.editReply({
        content,
        components: []
      });
      break;
    }
    default: {
      // No consent!
      await client.models.digestions.destroy({ where: { status: 'Voring', prey: prey.characterId } });
      interaction.editReply({
        content: `*Unfortunately, ${preyName} didn't consent and as such, they escaped from ${predName}. Maybe try a more willing prey?*`,
        components: []
      });
      break;
    }
  }
}
