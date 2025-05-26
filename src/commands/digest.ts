import { SlashCommandBuilder } from 'discord.js';
import { default as config } from '../configs/config.json' with { type: 'json' };
import { default as responses } from '../configs/responses.json' with { type: 'json' };
import { characters, stats } from '../models/init-models.js';
import { CmdFileArgs } from '../typings/Extensions.js';
const { emojis } = config;
const { actions } = responses;

enum DigestionType {
  Massage = 0,
  Squeeze = 1,
  Crush = 2
}

export const name = 'digest';
export const data = new SlashCommandBuilder()
  .setName(name)
  .setDescription('Digests specific or all prey inside you')
  .addStringOption((option) => {
    return option.setName('type').setDescription('How you want to digest your prey').setChoices(
      {
        name: 'Ease some pain your prey might be causing you',
        value: 'Massage'
      },
      {
        name: 'Become a bit more aggressive with those inside',
        value: 'Squeeze'
      },
      {
        name: 'Use a lot of energy to speed up the digestion process',
        value: 'Crush'
      }
    );
  })
  .addStringOption((option) => {
    return option.setName('prey').setDescription('The prey you want to digest (Separated by spaces if multiple)');
  })
  .setNSFW(true);
export async function execute({ client, interaction, options }: CmdFileArgs): Promise<void> {
  await interaction.deferReply();

  const type = DigestionType[options.getString('type') as keyof typeof DigestionType] || DigestionType.Massage;
  const preySelection = options.getString('prey') || '*';

  const active = await client.models.characters.findOne({
    where: { discordId: interaction.user.id, active: true },
    include: { model: stats, as: 'stats' }
  });
  if (!active) {
    interaction.editReply({ content: `${emojis.failure} | You don't have an active character!` });
    return;
  }
  const activeStats = active.stats; // Eagerly loaded
  const digestionsPrey = await client.models.digestions.findAll({
    where: { predator: active.characterId, status: ['Vored', 'Digesting'] }
  });
  if (digestionsPrey.length === 0) {
    interaction.editReply({ content: `${emojis.failure} | *You feel around your insides and find that you're empty*` });
    return;
  }
  const dbPrey = await client.models.characters.findAll({
    where: { characterId: digestionsPrey.map((d) => d.prey) },
    include: { model: stats, as: 'stats' }
  });
  if (dbPrey.length === 0) {
    throw new Error('No prey were found in database, despite being in the digestion table');
  }

  const selectedPrey = (await client.functions
    .get('helpers_selectCharacters')
    .execute(client, dbPrey, preySelection)) as characters[];
  if (selectedPrey.length === 0) {
    interaction.editReply({
      content: `${emojis.failure} | *Being so picky, you couldn't find any prey that matched your selection*`
    });
    return;
  }

  // Saved for later so we can set the pred's exhaustion
  const exhaustion = activeStats.data.pExhaustion - Math.floor(selectedPrey.length / 2) - type;
  if (exhaustion < 0) {
    interaction.editReply({ content: `${emojis.failure} | *You feel too exhausted to digest your prey right now*` });
    return;
  }

  // Calculate whether prey take damage from digestion
  const calculations = [];
  for (const preyChar of selectedPrey) {
    calculations.push(client.functions.get('digest_calcSuccess').execute(client, preyChar, active, type));
  }
  const results: { prey: string; success: boolean }[] = await Promise.all(calculations);

  const statUpdates = [];
  const voreUpdates = [];
  // Run some functions on the prey
  for (const calcData of results) {
    const prey = selectedPrey.find((p) => p.characterId === calcData.prey);
    if (!prey) continue;
    const stats = prey.stats; // Eagerly loaded

    // Calculate HP decrease
    let hpDecrease = Math.ceil(Math.random() * 16);
    hpDecrease += type * 2;
    hpDecrease -= Math.floor(stats.data.euphoria / 3);
    if (type === 2) hpDecrease += 25; //? Legacy code, could revise later
    if (hpDecrease < 0) continue;

    // Add promises
    statUpdates.push(
      stats.update({
        data: {
          ...stats.data,
          health: stats.data.health - hpDecrease
        }
      })
    );
    voreUpdates.push(client.functions.get('utils_updateDigestions').execute(client, prey.characterId));
  }
  // Check if we need to update the predator's stats
  const increaseAcids = Math.ceil(Math.random() * 10) > 8 && active.stats.data.acids !== 4;
  const increaseStomachHp = type === DigestionType.Massage;
  if (increaseAcids || increaseStomachHp) {
    statUpdates.push(
      activeStats.update({
        data: {
          ...activeStats.data,
          acids: increaseAcids ? activeStats.data.acids + 1 : activeStats.data.acids,
          sHealth: increaseStomachHp ? activeStats.data.sHealth + 10 : activeStats.data.sHealth,
          pExhaustion: exhaustion
        }
      })
    );
  }

  // statUpdates must go first, to ensure updateDigestions will have the most up to date information
  await Promise.all(statUpdates);
  await Promise.all(voreUpdates);

  // Once everything is settled, we can now check for deaths and insert strings
  const strings = [];
  const replaceVars = client.functions.get('utils_replaceVars').execute as unknown as (
    client: CmdFileArgs['client'],
    message: string,
    selectors: string[],
    replacements: string[]
  ) => string;

  for (const prey of selectedPrey) {
    // Things might've changed since we got the stats
    const stats = await prey.stats.reload();
    const result = results.find((r) => r.prey === prey.characterId);
    if (!result) continue; // Just in case
    if (stats.data.health <= 0) {
      // Prey digested
      const msg = actions.digested[Math.floor(Math.random() * actions.digested.length)];
      strings.push(replaceVars(client, msg, ['prey', 'pred'], [prey.data.name, active.data.name]));
      continue;
    }

    if (result.success) {
      strings.push(
        `*While inside **${active.data.name}**, **${prey.data.name}** feels a bit softer than before. Their time is running out and they take some damage!*`
      );
    } else {
      strings.push(
        `*Fortunately, **${prey.data.name}** is able to resist the effects of **${active.data.name}**'s digestion for now.*`
      );
    }
  }

  interaction.editReply({
    content: `You work your way with your prey and...\n>>> ${strings.join('\n')}`
  });
  return;
}
