import { ActionRowBuilder, ButtonBuilder, ButtonStyle, GuildMember, SlashCommandBuilder } from 'discord.js';
import { default as config } from '../configs/config.json' with { type: 'json' };
import { toConsole } from '../functions.js';
import { CmdFileArgs } from '../typings/Extensions.js';
import { Op } from 'sequelize';
const { emojis } = config;

export const name = 'nom';
export const data = new SlashCommandBuilder()
  .setName('nom')
  .setDescription('Eats a person, using the specified type')
  .addUserOption((option) => {
    return option.setName('target').setDescription('Person you want to nom').setRequired(true);
  })
  .addStringOption((option) => {
    return option.setName('type').setDescription('Type of vore to use when nomming (Defaults to oral)').addChoices(
      {
        name: 'Oral Vore',
        value: 'Oral Vore'
      },
      {
        name: 'Anal Vore',
        value: 'Anal Vore'
      },
      {
        name: 'Breast Vore',
        value: 'Breast Vore'
      },
      {
        name: 'Cock Vore',
        value: 'Cock Vore'
      },
      {
        name: 'Tail Vore',
        value: 'Tail Vore'
      },
      {
        name: 'Unbirth',
        value: 'Unbirth'
      }
    );
  })
  .setNSFW(true);
export async function execute({ client, interaction, options }: CmdFileArgs): Promise<void> {
  await interaction.deferReply();

  const raw_type = options.getString('type') || 'Oral Vore';
  const type = raw_type.split(' ')[0].toLowerCase();
  const targetMember = options.getMember('target') as undefined | GuildMember;
  if (!targetMember) {
    interaction.editReply({ content: `${emojis.failure} | Your target doesn't exist in this server` });
    return;
  }

  const charQuery = await client.models.characters.findAll({
    where: { discordId: [interaction.user.id, targetMember.id], active: true }
  });
  const execChar = charQuery.find((c) => c.discordId === interaction.user.id);
  const victimChar = charQuery.find((c) => c.discordId === targetMember.id);
  if (!execChar) {
    interaction.editReply({ content: `${emojis.failure} | You need an active character to use this command` });
    return;
  }
  if (!victimChar) {
    interaction.editReply({ content: `${emojis.failure} | Your target doesn't have an active character` });
    return;
  }
  const digestions = await client.models.digestions.findAll({
    where: {
      status: ['Voring', 'Vored', 'Digesting'],
      // Welcome to sequelize. where we need Op.or. otherwise it introduces funny
      // SQL that doesn't actually return what we want
      [Op.or]: {
        prey: [execChar.characterId, victimChar.characterId],
        predator: [execChar.characterId, victimChar.characterId]
      }
    }
  });
  const execPrey = digestions.filter((d) => d.predator === execChar.characterId);
  const execPreds = digestions.filter((d) => d.prey === execChar.characterId);
  const victimPrey = digestions.filter((d) => d.predator === victimChar.characterId);
  const victimPreds = digestions.filter((d) => d.prey === victimChar.characterId);
  // Check whitelist and blacklist
  const charWL = execChar.pref.whitelist.includes('all') ? true : execChar.pref.whitelist.includes(type);
  if (execChar.pref.blacklist.includes(type) && !charWL) {
    interaction.editReply({
      content: `${emojis.failure} | ${
        execChar.pref.blacklist.includes(type)
          ? "Your character's blacklist contains the vore you are trying to do"
          : "Your character's whitelist does not have the type of vore you are trying to do"
      }`
    });
    return;
  }
  const victWL = victimChar.pref.whitelist.includes('all') ? true : victimChar.pref.whitelist.includes(type);
  if (victimChar.pref.blacklist.includes(type) && !victWL) {
    interaction.editReply({
      content: `${emojis.failure} | ${
        victimChar.pref.blacklist.includes(type)
          ? "Your victim's blacklist contains the vore you are trying to do"
          : "Your victim's whitelist does not have the type of vore you are trying to do"
      }`
    });
    return;
  }
  // Check if either is busy
  if (execPrey.some((d) => /(Voring|Digesting)/.test(d.status))) {
    interaction.editReply({
      content:
        "*You feel something moving in you. Seems like you're a little bit preoccupied with your current prey. Try finishing with them before you vore someone new.*"
    });
    return;
  }
  if (victimPrey.some((d) => /(Voring|Digesting)/.test(d.status))) {
    interaction.editReply({
      content:
        '*You take a look at your target. They seem busy with dealing with their current predicament. Maybe try later?'
    });
    return;
  }
  // Check if you're voring yourself
  if (execChar.characterId === victimChar.characterId) {
    interaction.editReply({
      content:
        "*You look at yourself and seem confused. Did you just think about voring yourself? That's silly, nobody would do that.*"
    });
    return;
  }
  // Make sure both are not actively inside someone else
  // TODO: Do a deeper check to make sure there's no circular links. 3 people could form a chain in theory
  const victimCurrPred = victimPreds.filter((d) => d.status === 'Vored');
  const execCurrPred = execPreds.filter((d) => d.status === 'Vored');
  if (victimCurrPred.length > 1 || execCurrPred.length > 1) {
    throw new Error('More than one active predator found for victim/executor');
  }
  if (execCurrPred[0]) {
    const currDigestion = execCurrPred[0];
    if (currDigestion.predator === victimChar.characterId) {
      interaction.editReply({
        content:
          "*You look at your current predicament and realise something. You're vored by the person you're trying to vore. Escaping is probably a good idea.*"
      });
    } else {
      interaction.editReply({
        content: "*Inside your predator, you look around. For some reason, you can't find your prey anywhere in sight!*"
      });
    }
    return;
  }
  if (victimCurrPred[0]) {
    const currDigestion = victimCurrPred[0];
    if (currDigestion.predator === execChar.characterId) {
      interaction.editReply({
        content:
          "*You look at yourself and feel something moving inside of you. They're already inside of you! Try someone different.*"
      });
    } else {
      interaction.editReply({
        content: '*You look at your target and see that they are already vored by someone else! Try someone different.*'
      });
    }
    return;
  }

  try {
    await client.models.digestions.create({
      type: type,
      voreUpdate: new Date(),
      predator: execChar.characterId,
      prey: victimChar.characterId
    });
    await interaction.editReply({
      content: `${
        emojis.success
      } | *The thought of voring ${victimChar.data.name.trim()} suddenly engulfs ${execChar.data.name.trim()} and they start to vore them!*`
    });
    const row: ActionRowBuilder<ButtonBuilder> = new ActionRowBuilder({
      components: [
        new ButtonBuilder({
          custom_id: `${type}_yes`,
          label: '',
          style: ButtonStyle.Success,
          emoji: emojis.success.match(/\d+/g)[0]
        }),
        new ButtonBuilder({
          custom_id: `${type}_no`,
          label: '',
          style: ButtonStyle.Danger,
          emoji: emojis.failure.match(/\d+/g)[0]
        })
      ]
    });
    interaction.followUp({
      content: `*Psst!* ${victimChar.data.name.trim()} (<@${
        victimChar.discordId
      }>), you're being vored by ${execChar.data.name.trim()} (<@${execChar.discordId}>)`,
      components: [row]
    });
  } catch (e) {
    toConsole(String(e), new Error().stack, client);
    interaction.editReply({
      content: `${emojis.failure} | An error occurred while nomming ${victimChar.data.name}`
    });
  }
  return;
}
