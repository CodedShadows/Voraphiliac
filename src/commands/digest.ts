// eslint-disable-next-line no-unused-vars
import {
  ActionRowBuilder,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  StringSelectMenuOptionBuilder
} from 'discord.js';
import { default as config } from '../configs/config.json' assert { type: 'json' };
import { default as responses } from '../configs/responses.json' assert { type: 'json' };
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
    return option.setName('selective').setDescription('Select prey you want to digest?').addChoices(
      {
        name: 'Yes',
        value: 'Yes'
      },
      {
        name: 'No',
        value: 'No'
      }
    );
  })
  .setNSFW(true);
export async function execute({ client, interaction, options }: CmdFileArgs): Promise<void> {
  if (!interaction.replied) await interaction.deferReply(); // In case of overload
  const active = await client.models.characters.findOne({
    where: { discordId: interaction.user.id, active: true }
  });
  if (!active) {
    interaction.editReply({ content: `${emojis.failure} | You don't have an active character!` });
    return;
  }
  const type = DigestionType[options.getString('type') as keyof typeof DigestionType] || DigestionType.Massage;

  let dbPrey = await client.models.digestions.findAll({
    where: { predator: active.characterId, status: ['Vored', 'Digesting'] }
  });
  let preyCharacters;
  if (options.getString('selective') === 'Yes') {
    if (!dbPrey.length) {
      interaction.editReply({ content: `${emojis.failure} | You don't have any prey to digest!` });
      return;
    }
    const promises = dbPrey.map((p) => client.models.characters.findOne({ where: { characterId: p.prey } }));
    preyCharacters = await Promise.all(promises);

    const options: StringSelectMenuOptionBuilder[] = [];
    preyCharacters.forEach((p) =>
      options.push(new StringSelectMenuOptionBuilder({ label: p.name, value: String(p.characterId) }))
    );
    options.push(
      new StringSelectMenuOptionBuilder({
        label: 'All',
        value: 'all',
        description: `Digest all ${dbPrey.length} of your prey`
      })
    );
    const stringSelect = new StringSelectMenuBuilder({
      min_values: 1,
      max_values: dbPrey.length,
      placeholder: 'Select the prey you wish to digest'
    }).setOptions(options);

    const preyRow: ActionRowBuilder<StringSelectMenuBuilder> = new ActionRowBuilder({
      components: [stringSelect]
    });

    const preyInteraction: StringSelectMenuInteraction | null = await interaction
      .editReply({
        content: 'Select the prey you wish to digest',
        components: [preyRow]
      })
      .then((m) => m.awaitMessageComponent({ time: 30_000, filter: (i) => i.user.id === interaction.user.id }))
      .catch((e) => null);

    if (!preyInteraction) {
      interaction.editReply({ content: `${emojis.failure} | You took too long to respond!` });
      return;
    }

    if (!preyInteraction.values.includes('all'))
      dbPrey = preyCharacters.filter((p) => preyInteraction.values.includes(String(p.characterId)));
  } else {
    const promises = dbPrey.map((p) => client.models.characters.findOne({ where: { characterId: p.prey } }));
    preyCharacters = await Promise.all(promises);
  }
  const predStats = await active.getStats();
  // Check exhaustion
  if (predStats.data.pExhaustion <= Math.floor(preyCharacters.length / 2) + type) {
    // Dynamic message based on amount tried
    interaction.editReply({
      content: `${emojis.failure} | You're too exhausted to digest ${
        predStats.data.pExhaustion === 0 ? 'your' : 'that much'
      } prey!`
    });
    return;
  }
  // Store all results in Array
  const results: { prey: characters; stats: stats; result: boolean }[] = [];
  for (const prey of preyCharacters as characters[]) {
    // Generate value determining success
    let random = Math.ceil(Math.random() * 20) - type;
    const preyStats = await prey.getStats();
    const differences = [active.data.height - prey.data.height, active.data.weight - prey.data.weight];
    // If prey is smaller, add more to random
    if (differences[0] > 0) random += Math.floor(differences[0] / 5);
    if (differences[1] > 0) random += Math.floor(differences[1] / 5);

    /**
     * Digestion relies on several factors.
     * - Stomach power (+)
     * - Stomach acids (+)
     * - Stomach health (+)
     * - Prey euphoria (+)
     * - Prey defiance (-)
     */
    if (
      random <
      predStats.data.sPower +
        predStats.data.acids +
        predStats.data.sHealth -
        preyStats.data.defiance +
        preyStats.data.euphoria
    )
      results.push({ prey, stats: preyStats, result: true });
    else results.push({ prey, stats: preyStats, result: false });
  }
  // Increase acids by 2/10 chance
  if (Math.ceil(Math.random() * 10) > 8 && predStats.data.acids === 10) predStats.data.acids += 1;
  // Decrease energy by the amount of prey digested (rounded down) times the type
  predStats.data.pExhaustion -= Math.floor(preyCharacters.length / 2) + type;
  // Handle success
  const promises: Promise<any>[] = [];
  promises.push(predStats.save());
  results
    .filter((v) => v.result)
    .forEach((v) => {
      let hpDecrease = Math.ceil(Math.random() * 16);
      // Euphoria slows digestion
      hpDecrease -= Math.floor(v.stats.data.euphoria % 3);
      // Type speeds up digestion
      hpDecrease += type * 2;
      if (type === 2) hpDecrease += 25;
      if (hpDecrease < 0) hpDecrease = 0;
      v.stats.data.health -= hpDecrease;
      promises.push(v.stats.save());
      promises.push(client.functions.get('utils_updateDigestions').execute(client, v.prey.characterId));
    });
  // Await promises
  await Promise.all(promises);

  // Heal stomach
  if (type === DigestionType.Massage) predStats.data.sHealth += 5;
  // Generate result text
  const parsedResults = results.map(async (v) => {
    const random = actions.digested[Math.floor(Math.random() * actions.digested.length)];
    if (v.stats.data.health <= 0) {
      return client.functions
        .get('replaceVars')
        .execute(client, random, ['prey', 'pred'], [v.prey.data.name, active.data.name]);
    } else
      return `While inside **${active.data.name}**, **${v.prey.data.name}** feels a bit softer than before. Their time is running out and they take some damage!`;
  });
  const content = await Promise.all(parsedResults);
  interaction.editReply({ content: `You work your way with your prey and...\n> ${content.join('\n')}` });
  return;
}
