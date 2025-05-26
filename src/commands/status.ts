import { SlashCommandBuilder } from 'discord.js';
import { Op } from 'sequelize';
import { default as config } from '../configs/config.json' with { type: 'json' };
import { CmdFileArgs } from '../typings/Extensions.js';
const { emojis } = config;

export const name = 'status';
export const data = new SlashCommandBuilder()
  .setName(name)
  .setDescription("Shows a character's status")
  .addStringOption((option) => {
    return option.setName('character').setDescription('The character you want to see the status of');
  })
  .setNSFW(true);
export async function execute({ client, interaction, options }: CmdFileArgs): Promise<void> {
  await interaction.deferReply();

  let status: string;
  let active = await client.models.characters.findOne({
    where: { discordId: interaction.user.id, active: true }
  });
  if (options.getString('character')) {
    active = await client.models.characters.findOne({
      where: { ['data.name']: { [Op.substring]: options.getString('character') }, discordId: interaction.user.id }
    });
  }
  if (!active) {
    interaction.editReply({
      content: `${emojis.failure} | ${
        options.getString('character')
          ? `I couldn't find \`${options.getString('character')}\` on your account`
          : "You don't have an active character! Use `/profile switch` to switch to it"
      }!`
    });
    return;
  }

  const stats = await active.getStats();
  const image = await active.getImages();
  const predDigestions = await active.getDigestions();
  const preyDigestion = await client.models.digestions.findOne({
    where: { prey: active.characterId, status: { [Op.not]: ['Escaped', 'Reformed'] } }
  });
  if (preyDigestion) {
    const pred = await client.models.characters.findOne({ where: { characterId: preyDigestion.predator } });
    switch (preyDigestion.status) {
      case 'Voring': {
        status = `is being vored by \`${pred.data.name}\``;
        break;
      }
      case 'Vored': {
        status = `is spending their time inside \`${pred.data.name}\``;
        break;
      }
      case 'Digesting': {
        status = `is digesting inside \`${pred.data.name}\`~`;
        break;
      }
      case 'Digested': {
        status = `was digested by \`${pred.data.name}\``;
        break;
      }
      default: {
        interaction.editReply({
          content:
            ':x: | I tried biting more than I could chew and something went wrong. Please tell the developers about this! (`ST-001`)'
        });
        return;
      }
    }
  }

  interaction.editReply({
    embeds: [
      {
        title: `${active.data.name}'s Status`,
        thumbnail: { url: image.profile },
        description: `Currently, \`${active.data.name}\` ${
          typeof status !== 'undefined' ? status : 'is enjoying their time outside in the world!'
        }\n\n> **HP:** ${stats.data.health}\n> **Prey**: ${predDigestions.length || 0}`,
        color:
          stats.data.health >= 115
            ? 0x00ff00
            : stats.data.health >= 85
              ? 0xffff00
              : stats.data.health >= 35
                ? 0xffa500
                : 0xff0000
      }
    ]
  });
  return;
}
