import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  EmbedBuilder,
  Interaction,
  ModalBuilder,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextInputBuilder
} from 'discord.js';
import fetch, { Response } from 'node-fetch';
import { Op } from 'sequelize';
import { default as config } from '../configs/config.json' with { type: 'json' };
import { edit_image, new_profile_1, profileModals } from '../configs/modals.js';
import { toConsole } from '../functions.js';
import { characters } from '../models/init-models.js';
import { CmdFileArgs } from '../typings/Extensions.js';
const { emojis } = config;

function shortenText(text: string): string {
  if (text.length > 1024) return text.slice(0, 1021) + '...';
  return text;
}

function uppercaseFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export const name = 'profile';
export const data = new SlashCommandBuilder()
  .setName(name)
  .setDescription('Manages your profile')
  .addSubcommand((command) => {
    return command.setName('new').setDescription('Creates a new character');
  })
  .addSubcommand((command) => {
    return command.setName('edit').setDescription('Edits your character profile');
  })
  .addSubcommand((command) => {
    return command
      .setName('switch')
      .setDescription('Switches the active character')
      .addStringOption((option) => {
        return option
          .setName('character')
          .setDescription('The name of the character you want to switch to')
          .setRequired(true);
      });
  })
  .addSubcommand((command) => {
    return command
      .setName('list')
      .setDescription('Lists all characters registered to you or a user')
      .addUserOption((option) => {
        return option.setName('user').setDescription('The user to list characters for');
      })
      .addStringOption((option) => {
        return option.setName('search').setDescription('The name to search for');
      });
  })
  .addSubcommand((command) => {
    return command.setName('view').setDescription('Shows the currently active character');
  })
  .addSubcommand((command) => {
    return command
      .setName('delete')
      .setDescription('Deletes a character')
      .addStringOption((option) => {
        return option
          .setName('character')
          .setDescription('The character you want to delete (Default: Active character)')
          .setRequired(false);
      });
  })
  .setNSFW(false);
export async function execute({ client, interaction, options }: CmdFileArgs): Promise<void> {
  const row: ActionRowBuilder<StringSelectMenuBuilder | ButtonBuilder> = new ActionRowBuilder();
  let subcommand = options.getSubcommand(true);
  let character = await client.models.characters.findOne({ where: { discordId: interaction.user.id, active: true } });
  if (subcommand !== 'new' && !interaction.deferred && !interaction.replied)
    await interaction.deferReply({ ephemeral: !/(view|list)/.test(subcommand) });
  const filter = (i: Interaction) => i.user.id === interaction.user.id;

  // Find details on specific character
  if (subcommand === 'list' && options.getString('search')) {
    subcommand = 'view';
    const characters = await client.models.characters.findAll({
      where: {
        ['data.name']: { [Op.substring]: options.getString('search') },
        discordId: options.getUser('user') ? options.getUser('user').id : interaction.user.id
      }
    });
    if (characters.length === 0) subcommand = 'list';
    else {
      const active = await client.models.characters.findOne({
        where: { discordId: characters[0].discordId, ['data.name']: characters[0].data.name }
      });
      if (!active) subcommand = 'list';
      else character = active;
    }
  }

  switch (subcommand) {
    case 'new': {
      return interaction.showModal(new_profile_1);
    }
    case 'edit': {
      if (!character) {
        interaction.editReply({
          content: `${emojis.failure} | You need an active character to use this command`
        });
        return;
      }
      row.setComponents(
        new StringSelectMenuBuilder({ min_values: 1, max_values: 1, custom_id: 'options' }).setOptions(
          new StringSelectMenuOptionBuilder({
            value: 'images',
            label: 'Images',
            description: "Change your character's images"
          }),
          new StringSelectMenuOptionBuilder({
            value: 'name',
            label: 'Name',
            description: 'Changes the name of your character'
          }),
          new StringSelectMenuOptionBuilder({
            value: 'role',
            label: 'Role',
            description: 'Sets the vore role of your character'
          }),
          new StringSelectMenuOptionBuilder({
            value: 'description',
            label: 'Description',
            description: 'Set the description of your character'
          }),
          new StringSelectMenuOptionBuilder({
            value: 'gender',
            label: 'Gender',
            description: 'Sets the gender of your character'
          }),
          new StringSelectMenuOptionBuilder({
            value: 'species',
            label: 'Species',
            description: 'Sets the species of your character'
          }),
          new StringSelectMenuOptionBuilder({
            value: 'height',
            label: 'Height',
            description: 'Set the height of your character'
          }),
          new StringSelectMenuOptionBuilder({
            value: 'weight',
            label: 'Weight',
            description: 'Set the weight of your character'
          }),
          new StringSelectMenuOptionBuilder({
            value: 'whitelist',
            label: 'Whitelist',
            description: 'Set the only types of vore your character will do'
          }),
          new StringSelectMenuOptionBuilder({
            value: 'blacklist',
            label: 'Blacklist',
            description: 'Set the types of vore your character will not do'
          }),
          new StringSelectMenuOptionBuilder({
            value: 'autodigest',
            label: 'Automatic Digestion',
            description: 'Change your automatic digestion setting'
          })
        )
      );
      let message = await interaction.editReply({
        content: 'Please select what you want to edit',
        components: [row]
      });
      const option = await message
        .awaitMessageComponent({ filter, componentType: ComponentType.StringSelect, time: 15_000 })
        .catch(() => {
          return false;
        });

      if (typeof option === 'boolean') {
        interaction.editReply({ content: 'You took too long to respond', components: [] });
        return;
      }
      if (/(whitelist|blacklist|images)/.test(option.values[0])) await option.deferUpdate();
      switch (option.values[0]) {
        case 'whitelist': {
          row.setComponents(
            new StringSelectMenuBuilder({ min_values: 1, max_values: 5, custom_id: 'menu' }).addOptions(
              new StringSelectMenuOptionBuilder({ value: 'anal', label: 'Anal', description: 'Anal vore' }),
              new StringSelectMenuOptionBuilder({
                value: 'breast',
                label: 'Breast',
                description: 'Breast/Nipple vore'
              }),
              new StringSelectMenuOptionBuilder({ value: 'cock', label: 'Cock', description: 'Cock vore' }),
              new StringSelectMenuOptionBuilder({ value: 'oral', label: 'Oral', description: 'Oral vore' }),
              new StringSelectMenuOptionBuilder({ value: 'tail', label: 'Tail', description: 'Tail vore' }),
              new StringSelectMenuOptionBuilder({
                value: 'unbirth',
                label: 'Unbirth',
                description: 'Unbirth/Pussy Vore'
              }),
              new StringSelectMenuOptionBuilder({
                value: 'none',
                label: 'None',
                description: 'No vore types are allowed'
              }),
              new StringSelectMenuOptionBuilder({
                value: 'all',
                label: 'All',
                description: 'All vore types are allowed'
              })
            )
          );
          message = await interaction.editReply({
            content: 'What would you like to set your whitelist to?',
            components: [row]
          });
          const whitelist = await message
            .awaitMessageComponent({ filter, componentType: ComponentType.StringSelect, time: 25_000 })
            .catch(() => {
              return false;
            });

          if (typeof whitelist === 'boolean') {
            interaction.editReply({
              content: `${emojis.failure} | You took too long to respond!`,
              components: []
            });
            return;
          }
          if (whitelist.values.includes('all')) whitelist.values = ['all'];
          if (whitelist.values.includes('none')) whitelist.values = ['none'];
          try {
            character.pref = {
              ...character.pref,
              whitelist: whitelist.values,
              blacklist: []
            };
            await character.save();
            interaction.editReply({
              content: `${emojis.success} | Successfully updated your whitelist!`,
              components: []
            });
            return;
          } catch (e) {
            toConsole(String(e), new Error().stack, client);
            interaction.editReply({
              content: `${emojis.failure} | I couldn't write the changes to your whitelist. Report this to a developer (Snack code: \`PRF-001\`)`,
              components: []
            });
            return;
          }
        }
        case 'blacklist': {
          row.setComponents(
            new StringSelectMenuBuilder({ min_values: 1, max_values: 5, custom_id: 'menu' }).addOptions(
              new StringSelectMenuOptionBuilder({ value: 'anal', label: 'Anal', description: 'Anal vore' }),
              new StringSelectMenuOptionBuilder({
                value: 'breast',
                label: 'Breast',
                description: 'Breast/Nipple vore'
              }),
              new StringSelectMenuOptionBuilder({ value: 'cock', label: 'Cock', description: 'Cock vore' }),
              new StringSelectMenuOptionBuilder({ value: 'oral', label: 'Oral', description: 'Oral vore' }),
              new StringSelectMenuOptionBuilder({ value: 'tail', label: 'Tail', description: 'Tail vore' }),
              new StringSelectMenuOptionBuilder({
                value: 'unbirth',
                label: 'Unbirth',
                description: 'Unbirth/Pussy Vore'
              }),
              new StringSelectMenuOptionBuilder({
                value: 'none',
                label: 'None',
                description: 'No vore types are allowed'
              }),
              new StringSelectMenuOptionBuilder({
                value: 'all',
                label: 'All',
                description: 'All vore types are allowed'
              })
            )
          );
          message = await interaction.editReply({
            content: 'What would you like to set your blacklist to?',
            components: [row]
          });
          const blacklist = await message
            .awaitMessageComponent({ filter, componentType: ComponentType.StringSelect, time: 25_000 })
            .catch(() => {
              return false;
            });

          if (typeof blacklist === 'boolean') {
            interaction.editReply({
              content: `${emojis.failure} | You took too long to respond!`,
              components: []
            });
            return;
          }
          if (blacklist.values.includes('all')) blacklist.values = ['all'];
          if (blacklist.values.includes('none')) blacklist.values = ['none'];
          try {
            character.pref = {
              ...character.pref,
              whitelist: [],
              blacklist: blacklist.values
            };
            await character.save();
            interaction.editReply({
              content: `${emojis.success} | Successfully updated your blacklist!`,
              components: []
            });
            return;
          } catch (e) {
            toConsole(String(e), new Error().stack, client);
            interaction.editReply({
              content: `${emojis.failure} | I couldn't apply the changes to your blacklist. Please report this to a developer (Snack code: \`PRF-002\`)`,
              components: []
            });
            return;
          }
        }
        case 'images': {
          row.setComponents(
            new StringSelectMenuBuilder({ min_values: 1, max_values: 1, custom_id: 'edit_image' }).setOptions(
              new StringSelectMenuOptionBuilder({
                value: 'profile',
                label: 'Profile',
                description: 'Profile picture'
              }),
              new StringSelectMenuOptionBuilder({
                value: 'analPred',
                label: 'Anal Pred',
                description: 'Image of your prey when they are anal vored by you'
              }),
              new StringSelectMenuOptionBuilder({
                value: 'analPrey',
                label: 'Anal Prey',
                description: 'Image of your character when they are anal vored'
              }),
              new StringSelectMenuOptionBuilder({
                value: 'breastPred',
                label: 'Breast Pred',
                description: 'Image of your prey when they are breast vored by you'
              }),
              new StringSelectMenuOptionBuilder({
                value: 'breastPrey',
                label: 'Breast Prey',
                description: 'Image of your character when they are breast vored'
              }),
              new StringSelectMenuOptionBuilder({
                value: 'cockPred',
                label: 'Cock Pred',
                description: 'Image of your prey when they are cock vored by you'
              }),
              new StringSelectMenuOptionBuilder({
                value: 'cockPrey',
                label: 'Cock Prey',
                description: 'Image of your character when they are cock vored'
              }),
              new StringSelectMenuOptionBuilder({
                value: 'oralPred',
                label: 'Oral Pred',
                description: 'Image of your prey when they are oral vored by you'
              }),
              new StringSelectMenuOptionBuilder({
                value: 'oralPrey',
                label: 'Oral Prey',
                description: 'Image of your character when they are oral vored'
              }),
              new StringSelectMenuOptionBuilder({
                value: 'tailPred',
                label: 'Tail Pred',
                description: 'Image of your prey when they are tail vored by you'
              }),
              new StringSelectMenuOptionBuilder({
                value: 'tailPrey',
                label: 'Tail Prey',
                description: 'Image of your character when they are tail vored'
              }),
              new StringSelectMenuOptionBuilder({
                value: 'unbirthPred',
                label: 'Unbirth Pred',
                description: 'Image of your prey when they are unbirthed by you'
              }),
              new StringSelectMenuOptionBuilder({
                value: 'unbirthPrey',
                label: 'Unbirth Prey',
                description: 'Image of your character when they are unbirth'
              })
            )
          );
          const imageMessage = await interaction.editReply({
            content: 'What image would you like to update?',
            components: [row]
          });
          const imageOption = await imageMessage
            .awaitMessageComponent({ filter, componentType: ComponentType.StringSelect, time: 15_000 })
            .catch(() => {
              return false;
            });

          if (typeof imageOption === 'boolean') {
            interaction.editReply({
              content: `${emojis.failure} | You took too long to respond!`,
              components: []
            });
            return;
          }
          const modal = edit_image;
          modal.components[0].components[0].setCustomId(imageOption.values[0]);
          imageOption.showModal(modal);
          const url = await imageOption.awaitModalSubmit({ filter, time: 30_000 }).catch(() => {
            return false;
          });

          if (typeof url === 'boolean') {
            interaction.editReply({
              content: `${emojis.failure} | You took too long to respond!`,
              components: []
            });
            return;
          }
          await url.reply({
            content: `${emojis.failure} | Please close this message and pay attention to the above one!`,
            ephemeral: true
          });
          await interaction.editReply({ content: `${emojis.warning} | Processing...`, components: [] });
          const image = url.fields.fields.first();
          const regex = /^https:\/\/.+\.[a-zA-Z0-9]+(\/.+)+[a-zA-Z0-9]\.(png|jpg)$/i;
          if (!regex.test(image.value)) {
            interaction.editReply({
              content: `${emojis.failure} | You must enter a URL that starts with https and ends with .png or .jpg`
            });
            return;
          }

          const test = await fetch(image.value)
            .then((res: Response) => res.ok)
            .catch(() => false);

          if (!test) {
            interaction.editReply({ content: `${emojis.failure} | Please enter a valid URL that exists` });
            return;
          }
          try {
            await client.models.images.update(
              { [image.customId]: image.value },
              { where: { characterId: character.characterId } }
            );
            interaction.editReply({ content: `${emojis.success} | Successfully updated your image` });
            return;
          } catch (e) {
            toConsole(String(e), new Error().stack, client);
            interaction.editReply({
              content: `${emojis.failure} | An error occurred while updating your image`
            });
            return;
          }
        }
        default: {
          const modal = new ModalBuilder();
          const mRow: ActionRowBuilder<TextInputBuilder> = new ActionRowBuilder();
          modal.setTitle('Edit Character');
          modal.setCustomId('edit_profile');
          mRow.setComponents(profileModals[option.values[0]]);
          modal.addComponents(mRow);
          option.showModal(modal);
          break;
        }
      }
      break;
    }
    case 'switch': {
      const name = options.getString('character');
      let char = await client.models.characters.findOne({
        where: { discordId: interaction.user.id, ['data.name']: name }
      });
      if (!char)
        char = await client.models.characters.findOne({
          where: { discordId: interaction.user.id, ['data.name']: { [Op.substring]: name } }
        });
      if (!char) {
        interaction.editReply({ content: `${emojis.failure} | You don't have a character with that name!` });
        return;
      }
      if (character && char.characterId === character.characterId) {
        interaction.editReply({
          content: `${emojis.failure} | That character is already active. Try using their full name if you think this is a mistake`
        });
        return;
      }
      char.active = !char.active;
      await char.save();
      if (character !== null) {
        character.active = !!char.active;
        await character.save();
      }
      interaction.editReply({ content: `${emojis.success} | Successfully switched to ${char.data.name}!` });
      return;
    }
    case 'delete': {
      if (!character || character.data.name !== options.getString('character')) {
        if (!options.getString('character')) {
          interaction.editReply({
            content: `${emojis.failure} | You need an active character to use this command`
          });
          return;
        } else {
          character = await client.models.characters.findOne({
            where: {
              ['data.name']: { [Op.substring]: options.getString('character') },
              discordId: interaction.user.id
            }
          });
          if (!character) {
            interaction.editReply({ content: `${emojis.failure} | No character found with that name` });
            return;
          }
        }
      }
      const row: ActionRowBuilder<ButtonBuilder> = new ActionRowBuilder({
        components: [
          new ButtonBuilder({
            custom_id: 'no',
            label: "No, I don't want to delete that character",
            style: ButtonStyle.Success
          }),
          new ButtonBuilder({
            custom_id: 'yes',
            label: 'Yes, I want to delete that character',
            style: ButtonStyle.Danger
          })
        ]
      });
      const confirmation = await interaction
        .editReply({
          content: `Are you sure you want to delete your character, \`${character.data.name}\`? This action cannot be undone!`,
          components: [row]
        })
        .then((m) => m.awaitMessageComponent({ filter, time: 15_000 }))
        .catch(() => null);

      if (!confirmation) return; // error

      await confirmation.update({ components: [] });
      if (confirmation.customId === 'yes') {
        try {
          client.models.characters.destroy({ where: { characterId: character.characterId } });
          interaction.editReply({
            content: `${emojis.success} | Successfully deleted your active character, \`${character.data.name}\``,
            components: []
          });
          return;
        } catch (e) {
          toConsole(String(e), new Error().stack, client);
          interaction.editReply({
            content: `${emojis.failure} | An error occurred while deleting your character. Please try again later`,
            components: []
          });
          return;
        }
      } else {
        interaction.editReply({ content: `${emojis.success} | Successfully cancelled character deletion` });
        return;
      }
    }
    case 'view': {
      if (!character) {
        interaction.editReply({
          content: `${emojis.failure} | You need an active character to use this command`
        });
        return;
      }
      const images = await character.getImages();
      const stats = await character.getStats();
      const mementos = await character.getMementos();
      const items = await character.getItems();
      await client.functions.get('utils_updateDigestions').execute(client, character.characterId);
      const digestions = await client.models.digestions.findAll({
        where: { [Op.or]: { prey: character.characterId, predator: character.characterId } }
      });
      const currentPrey: Promise<characters>[] = [],
        statuses = [];
      for (const prey of digestions.filter(
        (d) => /(Voring|Vored|Digesting)/.test(d.status) && d.prey !== character.characterId
      )) {
        let status: string;
        ({ status } = prey);
        switch (status) {
          case 'Vored':
            status = `who was ${prey.type} vored`;
            break;
          case 'Voring':
            status = `who is being ${prey.type} vored`;
            break;
          case 'Digesting':
            status = `who was ${prey.type} vored but is digesting`;
            break;
        }
        statuses.push(status);
        const preyCharacter = client.models.characters.findOne({ where: { characterId: prey.prey } });
        currentPrey.push(preyCharacter);
      }
      const resolvedPrey: { name?: string; status?: string }[] = await Promise.all(currentPrey)
        .then((prey) => prey.map((p, index) => ({ name: p.data.name, status: statuses[index] })))
        .catch(() => null);
      const currentPred = digestions.filter(
        (d) => /(Voring|Vored|Digesting|Digested)/.test(d.status) && d.predator !== character.characterId
      )[0];
      let pred: characters | string;
      if (currentPred) pred = await client.models.characters.findOne({ where: { characterId: currentPred.predator } });
      else pred = 'Nobody yet!';
      const embeds: EmbedBuilder[] = [
        new EmbedBuilder({
          title: character.data.name,
          thumbnail: { url: images.profile },
          description: character.data.description,
          color: Math.floor(Math.random() * 16777215)
        }),
        new EmbedBuilder({
          title: `${character.data.name} | Information`,
          thumbnail: { url: images.profile },
          color: Math.floor(Math.random() * 16777215),
          fields: [
            {
              name: 'Vore Role',
              value: `${character.data.role
                .split(' ')
                .map((v) => uppercaseFirst(v))
                .join(' ')}`,
              inline: true
            },
            {
              name: 'Gender',
              value: String(uppercaseFirst(character.data.gender)),
              inline: true
            },
            {
              name: 'Species',
              value: String(uppercaseFirst(character.data.species)),
              inline: true
            },
            {
              name: 'Weight',
              value: `${character.data.weight} kg`,
              inline: true
            },
            {
              name: 'Height',
              value: `${character.data.height} cm`,
              inline: true
            },
            {
              name: 'Auto Digest',
              value: `${character.pref.autodigest ? 'Yes' : 'No'}`,
              inline: true
            },
            {
              name: 'Whitelist',
              value: character.pref.whitelist.map((v) => uppercaseFirst(v)).join(', '),
              inline: true
            },
            {
              name: 'Blacklist',
              value: character.pref.blacklist.map((v) => uppercaseFirst(v)).join(', '),
              inline: true
            }
          ],
          footer: {
            text: `Owned by ${character.discordId}`
          }
        }),
        new EmbedBuilder(),
        new EmbedBuilder({
          title: `${character.data.name} | Stats`,
          thumbnail: { url: images.profile },
          color: Math.floor(Math.random() * 16777215),
          fields: [
            {
              name: 'Spending some time inside of...',
              value: `${
                typeof pred !== 'string'
                  ? `${pred.data.name} since <t:${Math.floor(currentPred.createdAt.getTime() / 1000)}>`
                  : pred
              }`,
              inline: true
            },
            {
              name: 'Enjoying the taste of some prey...',
              value: `...which includes: ${
                resolvedPrey.length > 0
                  ? resolvedPrey.map((obj) => `${obj.name} ${obj.status}`).join(', ')
                  : 'Nobody yet!'
              }`
            },
            {
              name: 'Health',
              value: String(stats.data.health),
              inline: true
            },
            {
              name: 'Arousal',
              value: String(stats.data.arousal),
              inline: true
            },
            {
              name: 'Euphoria',
              value: String(stats.data.euphoria),
              inline: true
            },
            {
              name: 'Defiance Strength',
              value: String(stats.data.defiance),
              inline: true
            },
            {
              name: 'Mental Resistance',
              value: String(stats.data.resistance),
              inline: true
            }
          ],
          footer: {
            text: `Owned by ${character.discordId}`
          }
        }),
        new EmbedBuilder({
          title: `${character.data.name} | Images`,
          thumbnail: { url: images.profile },
          color: Math.floor(Math.random() * 16777215),
          fields: [
            {
              name: 'Anal Pred',
              value: images.vorePics.analPred === ' ' ? 'No image' : images.vorePics.analPred,
              inline: false
            },
            {
              name: 'Anal Prey',
              value: images.vorePics.analPrey === ' ' ? 'No image' : images.vorePics.analPrey,
              inline: false
            },
            {
              name: 'Breast Pred',
              value: images.vorePics.breastPred === ' ' ? 'No image' : images.vorePics.breastPred,
              inline: false
            },
            {
              name: 'Breast Prey',
              value: images.vorePics.breastPrey === ' ' ? 'No image' : images.vorePics.breastPrey,
              inline: false
            },
            {
              name: 'Cock Pred',
              value: images.vorePics.cockPred === ' ' ? 'No image' : images.vorePics.cockPred,
              inline: false
            },
            {
              name: 'Cock Prey',
              value: images.vorePics.cockPrey === ' ' ? 'No image' : images.vorePics.cockPrey,
              inline: false
            },
            {
              name: 'Oral Pred',
              value: images.vorePics.oralPred === ' ' ? 'No image' : images.vorePics.oralPred,
              inline: false
            },
            {
              name: 'Oral Prey',
              value: images.vorePics.oralPrey === ' ' ? 'No image' : images.vorePics.oralPrey,
              inline: false
            },
            {
              name: 'Tail Pred',
              value: images.vorePics.tailPred === ' ' ? 'No image' : images.vorePics.tailPred,
              inline: false
            },
            {
              name: 'Tail Prey',
              value: images.vorePics.tailPrey === ' ' ? 'No image' : images.vorePics.tailPrey,
              inline: false
            },
            {
              name: 'Unbirth Pred',
              value: images.vorePics.unbirthPred === ' ' ? 'No image' : images.vorePics.unbirthPred,
              inline: false
            },
            {
              name: 'Unbirth Prey',
              value: images.vorePics.unbirthPrey === ' ' ? 'No image' : images.vorePics.unbirthPrey,
              inline: false
            }
          ],
          footer: {
            text: `Owned by ${character.discordId}`
          }
        }),
        new EmbedBuilder({
          title: `${character.data.name} | Mementos`,
          thumbnail: { url: images.profile },
          color: Math.floor(Math.random() * 16777215),
          fields: mementos.map((memento) => {
            return {
              name: memento.data.title,
              value: memento.data.description,
              inline: true
            };
          }),
          footer: {
            text: `Owned by ${character.discordId}`
          }
        }),
        new EmbedBuilder({
          title: `${character.data.name} | Items`,
          thumbnail: { url: images.profile },
          color: Math.floor(Math.random() * 16777215),
          fields: items.map((item) => {
            return {
              name: item.data.name,
              value: item.data.description,
              inline: true
            };
          }),
          footer: {
            text: `Owned by ${character.discordId}`
          }
        })
      ];
      if (typeof pred !== 'string') {
        const predStats = await pred.getStats();
        embeds.splice(
          2,
          1,
          new EmbedBuilder({
            title: `${character.data.name} | Digestion`,
            description:
              "*Where 'Stomach' is used, it represents where you are being held in your predator. This does not mean your own!*",
            thumbnail: { url: images.profile },
            color: Math.floor(Math.random() * 16777215),
            fields: [
              {
                name: 'Status',
                value: `${uppercaseFirst(currentPred.status)} via ${uppercaseFirst(currentPred.type)}${
                  uppercaseFirst(currentPred.type) !== 'Unbirth' ? ' Vore' : ''
                }`,
                inline: true
              },
              {
                name: 'Prey Exhaustion',
                value: `${stats.data.pExhaustion > 7 ? 'High' : stats.data.pExhaustion > 3 ? 'Medium' : 'Low'} (${
                  stats.data.pExhaustion
                })`,
                inline: true
              },
              {
                name: 'Stomach Health',
                value: String(predStats.data.sHealth),
                inline: true
              },
              {
                name: 'Stomach Power',
                value: String(predStats.data.sPower),
                inline: true
              },
              {
                name: 'Stomach Resistance',
                value: String(predStats.data.sResistance),
                inline: true
              },
              {
                name: 'Stomach Acids',
                value: String(predStats.data.acids),
                inline: true
              }
            ],
            footer: {
              text: `Owned by ${character.discordId}`
            }
          })
        );
      } else embeds.splice(2, 1);
      let page = 0;
      const paginationRow: ActionRowBuilder<ButtonBuilder> = new ActionRowBuilder({
        components: [
          new ButtonBuilder({ customId: 'previous', label: '◀️', style: ButtonStyle.Primary }),
          new ButtonBuilder({ customId: 'cancel', label: '🟥', style: ButtonStyle.Danger }),
          new ButtonBuilder({ customId: 'next', label: '▶️', style: ButtonStyle.Primary })
        ]
      });
      interaction.editReply({ embeds: [embeds[page]], components: [paginationRow] });
      const coll = await interaction
        .fetchReply()
        .then((r) => r.createMessageComponentCollector({ filter, componentType: ComponentType.Button, time: 120_000 }))
        .catch(() => null);

      if (!coll) return;

      coll.on('collect', (i) => {
        if (i.customId === 'next') {
          page = page + 1;
          if (page > embeds.length - 1) page = 0;
          i.update({ embeds: [embeds[page]], components: [paginationRow] });
        } else if (i.customId === 'previous') {
          page = page - 1;
          if (page < 0) page = embeds.length - 1;
          i.update({ embeds: [embeds[page]], components: [paginationRow] });
        } else {
          coll.stop();
        }
      });

      coll.once('end', () => {
        const cmdName = interaction.commandName;
        interaction.editReply({
          content: `This command has expired. Run </${cmdName} ${options.getSubcommand(true)}:${
            interaction.commandId
          }>`,
          embeds: [embeds[page]],
          components: []
        });
      });

      return;
    }
    case 'list': {
      const user = options.getUser('user') || interaction.user;
      const characters = await client.models.characters.findAll({ where: { discordId: user.id } });
      if (character) await client.functions.get('utils_updateDigestions').execute(client, character.characterId);
      const fields = characters.map((char) => {
        return {
          name: char.data.name,
          value: shortenText(char.data.description),
          inline: true
        };
      });
      interaction.editReply({
        content: '',
        embeds: [
          new EmbedBuilder({
            title: `${user.username}'s Characters`,
            color: Math.floor(Math.random() * 16777215),
            fields:
              fields.length > 0
                ? fields
                : [{ name: 'No characters', value: 'This user has no characters', inline: true }],
            footer: {
              text: options.getString('search')
                ? `No characters found for "${options.getString('search')}" - Returning existing characters`
                : ''
            }
          })
        ]
      });
      return;
    }
    default: {
      interaction.editReply({
        content: `${emojis.failure} | Something went wrong and you shouldn't be seeing this. Report this to a developer with this code: \`PF-EL001\``
      });
    }
  }
}
