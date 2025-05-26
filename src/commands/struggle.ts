import { SlashCommandBuilder } from 'discord.js';
import { Op } from 'sequelize';
import { default as config } from '../configs/config.json' with { type: 'json' };
import { statsData } from '../models/stats.js';
import { CmdFileArgs } from '../typings/Extensions.js';
const { emojis } = config;

function applyPatch(object, patch) {
  for (const key in patch) {
    object[key] = object[key] + patch[key];
  }
  return object;
}

export const name = 'struggle';
export const data = new SlashCommandBuilder()
  .setName(name)
  .setDescription('Give your predator a hard time')
  .addStringOption((option) => {
    return option.setName('type').setDescription('The type of the escape attempt').setChoices(
      {
        name: 'Massage',
        value: 'Massage'
      },
      {
        name: 'Struggle',
        value: 'Struggle'
      },
      {
        name: 'Move Around',
        value: 'Move Around'
      },
      {
        name: 'Pleasure',
        value: 'Pleasure'
      }
    );
  })
  .setNSFW(true);
export async function execute({ client, interaction, options }: CmdFileArgs): Promise<void> {
  await interaction.deferReply();

  const type = options.getString('type') ?? 'Struggle';
  const character = await client.models.characters.findOne({
    where: { discordId: interaction.user.id, active: true }
  });
  if (!character) {
    interaction.editReply({ content: `${emojis.failure} | You don't have an active character!` });
    return;
  }
  await client.functions.get('utils_updateDigestions').execute(client, character.characterId);
  const digestion = await client.models.digestions.findOne({
    where: { prey: character.characterId, status: { [Op.or]: ['Vored', 'Digesting'] } }
  });
  if (!digestion) {
    interaction.editReply({
      content: `${emojis.failure} | Oops, you're not inside a predator! Maybe try again later when you've found your way inside one`
    });
    return;
  }
  const stats = await client.models.stats.findAll({
    where: { characterId: { [Op.or]: [digestion.prey, digestion.predator] } }
  });

  const insertNames = (content: string[]) =>
    client.functions.get('utils_replaceVars').execute(
      client,
      // Used for all responses. Simplifies the copy/paste process
      content[Math.floor(Math.random() * content.length)],
      ['pred', 'prey'],
      [pred.data.name, prey.data.name]
    ) as unknown as string; // Non-async function

  const predStats = stats.filter((s) => s.characterId === digestion.predator)[0];
  const preyStats = stats.filter((s) => s.characterId === digestion.prey)[0];
  const pred = await predStats.getCharacter();
  const prey = await preyStats.getCharacter();
  // Used to handle Sequelize's quirk with JSON fields
  const preyStatsToUpdate: Partial<Record<keyof statsData, number>> = {};
  const predStatsToUpdate: Partial<Record<keyof statsData, number>> = {};
  try {
    const func = client.functions.get('struggling_' + type.toLowerCase().replace(' ', ''));
    if (!func) {
      interaction.editReply({
        content: `${emojis.failure} | Don't scare me like that! I don't know how to let you ${type} yet`
      });
      return;
    }
    await func.execute(
      client,
      interaction,
      [prey, pred],
      [preyStats, predStats],
      [preyStatsToUpdate, predStatsToUpdate],
      insertNames
    );
  } catch (e) {
    const msg = String(e).includes('Too exhausted')
      ? `*You try to take an action but your body fails you. Your muscles won't move, you're too tired!*`
      : String(e);
    interaction.editReply({ content: `${emojis.failure} | ${msg}` });
  }

  await Promise.all([
    preyStats.update({
      data: applyPatch(preyStats.data, preyStatsToUpdate)
    }),
    predStats.update({
      data: applyPatch(predStats.data, predStatsToUpdate)
    })
  ]);
  return;
}
