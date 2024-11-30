// eslint-disable-next-line no-unused-vars
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, GuildMember, SlashCommandBuilder } from 'discord.js';
import { default as config } from '../configs/config.json' assert { type: 'json' };
import { toConsole } from '../functions.js';
import { CmdFileArgs } from '../typings/Extensions.js';
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
  if (!interaction.replied) await interaction.deferReply(); // In case of overload
  let type = options.getString('type') || 'oral';
  type = type.split(' ')[0].toLowerCase();
  const target = options.getMember('target') as undefined | GuildMember;
  if (!target) {
    interaction.editReply({ content: `${emojis.failure} | Your target doesn't exist on this server` });
    return;
  }

  const character = await client.models.characters.findOne({
    where: { discordId: interaction.user.id, active: true }
  });
  const victim = await client.models.characters.findOne({ where: { discordId: target.id, active: true } });
  if (!character) {
    interaction.editReply({ content: `${emojis.failure} | You need an active character to use this command` });
    return;
  }
  if (!victim) {
    interaction.editReply({ content: `${emojis.failure} | Your target doesn't have an active character` });
    return;
  }
  const digestions = await client.models.digestions.findAll({
    where: {
      status: ['Voring', 'Vored', 'Digesting'],
      prey: [character.characterId, victim.characterId],
      predator: [character.characterId, victim.characterId]
    }
  });
  const cDigestions_pred = digestions.filter((d) => d.predator === character.characterId);
  const cDigestions_prey = digestions.filter((d) => d.prey === character.characterId);
  const vDigestions_pred = digestions.filter((d) => d.predator === victim.characterId);
  const vDigestions_prey = digestions.filter((d) => d.prey === victim.characterId);
  // Check whitelist and blacklist
  const charWL = character.pref.whitelist.includes('all') ? true : character.pref.whitelist.includes(type);
  if (character.pref.blacklist.includes(type) && !charWL) {
    interaction.editReply({
      content: `${emojis.failure} | ${
        character.pref.blacklist.includes(type)
          ? "Your character's blacklist contains the vore you are trying to do"
          : "Your character's whitelist does not have the type of vore you are trying to do"
      }`
    });
    return;
  }
  const victWL = victim.pref.whitelist.includes('all') ? true : character.pref.whitelist.includes(type);
  if (victim.pref.blacklist.includes(type) && !victWL) {
    interaction.editReply({
      content: `${emojis.failure} | ${
        victim.pref.blacklist.includes(type)
          ? "Your victim's blacklist contains the vore you are trying to do"
          : "Your victim's whitelist does not have the type of vore you are trying to do"
      }`
    });
    return;
  }
  // Check if either is busy
  if (cDigestions_pred.some((d) => /(Voring|Digesting)/.test(d.status))) {
    interaction.editReply({
      content:
        "*You feel something moving in you. Seems like you're a little bit preoccupied with your current prey. Try finishing with them before you vore someone new.*"
    });
    return;
  }
  if (vDigestions_pred.some((d) => /(Voring|Digesting)/.test(d.status))) {
    interaction.editReply({
      content:
        '*You take a look at your target. They seem busy with dealing with their current predicament. Maybe try later?'
    });
    return;
  }
  // Check if you're voring yourself
  if (character.characterId === victim.characterId) {
    interaction.editReply({
      content:
        "*You look at yourself and seem confused. Did you just think about voring yourself? That's silly, nobody would do that.*"
    });
    return;
  }
  // If the victim is vored
  for (let index in vDigestions_prey.filter((d) => d.status === 'Vored')) {
    const digestion = vDigestions_prey.filter((d) => d.status === 'Vored')[index];
    // If the victim is vored by the character
    if (character.characterId === digestion.predator) {
      interaction.editReply({
        content:
          "*You look at yourself and feel something moving inside of you. They're already inside of you! Try someone different.*"
      });
      return;
    }
    // If the victim is vored by someone else
    else if (character.characterId !== digestion.predator) {
      interaction.editReply({
        content: '*You look at your target and see that they are already vored by someone else! Try someone different.*'
      });
    }
  }
  // Check if character is vored
  for (let index in cDigestions_prey.filter((d) => d.status === 'Vored')) {
    const digestion = cDigestions_prey.filter((d) => d.status === 'Vored')[index];

    // If the character is vored by the victim
    if (digestion.predator === victim.characterId) {
      interaction.editReply({
        content:
          "*You look at your current predicament and realise something. You're vored by the person you're trying to vore. Escaping is probably a good idea.*"
      });
      return;
    }
    // If the victim hasn't been vored by the character's predator
    else if (digestion.predator !== vDigestions_prey.filter((d) => d.status === 'Vored')[0].predator) {
      interaction.editReply({
        content: "*Inside your predator, you look around. For some reason, you can't find your prey anywhere in sight!*"
      });
      return;
    }
  }

  try {
    await client.models.digestions.create({
      type: type,
      voreUpdate: new Date(),
      predator: character.characterId,
      prey: victim.characterId
    });
    await interaction.editReply({
      content: `${
        emojis.success
} | *The thought of voring ${victim.data.name.trim()} suddenly engulfs ${character.data.name.trim()} and they start to vore them!*`
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
      content: `*Psst!* ${victim.data.name.trim()} (<@${
        victim.discordId
      }>), you're being vored by ${character.data.name.trim()} (<@${character.discordId}>)`,
      components: [row]
    });
  } catch (e) {
    toConsole(String(e), new Error().stack, client);
    interaction.editReply({
      content: `${emojis.failure} | An error occurred while nomming ${victim.data.name}`
    });
  }
  return;
}
