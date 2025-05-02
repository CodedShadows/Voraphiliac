import { ModalSubmitFields, ModalSubmitInteraction } from 'discord.js';
import { default as config } from '../../configs/config.json' with { type: 'json' };
import { interactionEmbed, toConsole } from '../../functions.js';
import { CustomClient } from '../../typings/Extensions.js';
const { emojis } = config;

export const name = 'edit_profile';
export async function execute(
  client: CustomClient,
  interaction: ModalSubmitInteraction,
  fields: ModalSubmitFields
): Promise<void> {
  if (!interaction.replied) await interaction.deferUpdate(); // In case of overload
  const char = await client.models.characters.findOne({
    where: { discordId: interaction.user.id, active: true }
  });
  const data = fields.fields.first();
  const r1 = /^[0-9]{0,10}(?:\.[0-9]{1,3})?$/;
  let content = data.value;

  if (!char) {
    interaction.editReply({
      content: `${emojis.failure} | You do not have an active character`,
      components: []
    });
    return;
  }
  try {
    switch (data.customId) {
      case 'role': {
        if (!/^(Pred(ator)? Switch|(Apex )?Pred(ator)?)|(Switch)|(Prey( Switch)?)$/i.test(data.value))
          return interactionEmbed(
            3,
            'Please enter a valid vore role. Pred can be substituted for Predator. (`Apex Pred`, `Pred`, `Pred Switch`, `Switch`, `Prey Switch`, or `Prey`)',
            interaction
          );
        content = /^(Pred(ator)? Switch|(Apex )?Pred(ator)?)|(Switch)|(Prey( Switch)?)$/i
          .exec(data.value)[0]
          .toLowerCase(); // skipcq: JS-D007
        break;
      }
      case 'height': {
        if (!r1.test(data.value)) {
          interaction.editReply({
            content: `${emojis.failure} | Your height must be a number up to ten digits with a maximum of three decimal places (Ex. \`12.34\`, \`.123\`, \`1234567890.123\`)`,
            components: []
          });
          return;
        }
        break;
      }
      case 'weight': {
        if (!r1.test(data.value)) {
          interaction.editReply({
            content: `${emojis.failure} | Your weight must be a number up to ten digits with a maximum of three decimal places (Ex. \`12.34\`, \`.123\`, \`1234567890.123\`)`,
            components: []
          });
          return;
        }
        break;
      }
    }
  } catch (err) {
    toConsole(err, err || new Error().stack, client);
    interaction.editReply({
      content: `${emojis.failure} | Something happened and I lost my food while updating the ${data.value}! Report this to a developer (Snack code: \`EPF-001\`)`,
      components: []
    });
    return;
  }
  // Update database
  try {
    client.models.characters.update({ [data.customId]: content }, { where: { characterId: char.characterId } });
    interaction.editReply({
      content: `${emojis.success} | Successfully updated ${data.customId}:\n\`${content}\``,
      components: []
    });
    return;
  } catch (err) {
    toConsole(err, err.stack || new Error().stack, client);
    interaction.editReply({
      content: `${emojis.failure} | Something happened and I lost my food while updating the ${data.value}! Report this to a developer (Snack code: \`EPF-002\`)`,
      components: []
    });
    return;
  }
}
