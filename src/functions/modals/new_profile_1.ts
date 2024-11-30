// eslint-disable-next-line no-unused-vars
import {
  ActionRowBuilder,
  BaseInteraction,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ComponentType,
  ModalSubmitFields,
  ModalSubmitInteraction
} from 'discord.js';
import { Op } from 'sequelize';
import { default as config } from '../../configs/config.json' assert { type: 'json' };
import { new_profile_2 } from '../../configs/modals.js';
import { toConsole } from '../../functions.js';
import { charactersData } from '../../models/characters.js';
import { characters } from '../../models/init-models.js';
import { CustomClient } from '../../typings/Extensions.js';
const { emojis } = config;
let submitted = false;

export const name = 'new_profile_1';
export async function execute(
  client: CustomClient,
  interaction: ModalSubmitInteraction,
  fields: ModalSubmitFields
): Promise<void> {
  const r1 = new RegExp('^(Pred(ator)? Switch|(Apex )?Pred(ator)?)|(Switch)|(Prey( Switch)?)$', 'i');
  // eslint-disable-next-line no-useless-escape
  const r2 = new RegExp('^[0-9]{0,10}(?:.[0-9]{1,3})?$');
  const filter = (i: BaseInteraction) => i.user.id === interaction.user.id;
  const row: ActionRowBuilder<ButtonBuilder> = new ActionRowBuilder();
  row.addComponents(new ButtonBuilder({ custom_id: 'confirm', label: 'Confirm', style: ButtonStyle.Success }));
  const message = await interaction.reply({
    content: 'Click the button to continue (Note: If the modal fails, pleases re-run the command)',
    components: [row],
    ephemeral: true,
    fetchReply: true
  });
  const confirm = message.createMessageComponentCollector({
    filter,
    componentType: ComponentType.Button,
    time: 30_000
  });

  confirm.on('collect', async (i: ButtonInteraction) => {
    await i.showModal(new_profile_2);
    const m2 = await i.awaitModalSubmit({ filter, time: 180_000 }).catch(() => {
      return null;
    });

    if (!m2) return null as any;
    submitted = true;
    await m2.deferReply({ ephemeral: false });
    m2.deleteReply();
    await interaction.editReply({ content: ':gear: Processing, please wait', components: [] });

    // VALIDATION //
    if (!r1.test(fields.getTextInputValue('role')))
      return interaction.editReply({
        content:
          'Please enter a valid vore role. Pred can be substituted for Predator. (`Apex Pred`, `Pred`, `Pred Switch`, `Switch`, `Prey Switch`, or `Prey`)'
      });
    if (!r2.test(m2.fields.getTextInputValue('height')) || !r2.test(m2.fields.getTextInputValue('weight')))
      return interaction.editReply({
        content:
          'Your weight and height must be a number up to ten digits with a maximum of three decimal places (Ex. `12.34`, `.123`, `1234567890.123`)'
      });
    if (
      await client.models.characters.findOne({
        where: { discordId: interaction.user.id, data: { name: fields.getTextInputValue('name') } }
      })
    )
      return interaction.editReply({ content: 'You already have a character with that name!' });
    // Check for existing characters with similar names
    const similarChar: characters = await client.models.characters.findOne({
      where: {
        discordId: interaction.user.id,
        data: {
          name: { [Op.substring]: fields.getTextInputValue('name') }
        }
      }
    });
    if (similarChar) {
      await interaction.editReply({
        content: `${emojis.warning} | You have a character that has a name (${similarChar.data.name}) like the one you entered. Please make sure you enter the **full** name when using commands`
      });
      await require('node:util').promisify(setTimeout)(5000);
    }

    try {
      const rawWeight = r2.exec(m2.fields.getTextInputValue('weight')); // skipcq: JS-D007
      const rawHeight = r2.exec(m2.fields.getTextInputValue('height')); // skipcq: JS-D007
      const characterData: charactersData = {
        name: fields.getTextInputValue('name'),
        role: r1.exec(fields.getTextInputValue('role').toLowerCase())[0], // skipcq: JS-D007
        description: m2.fields.getTextInputValue('description'),
        gender: fields.getTextInputValue('gender').toLowerCase(),
        species: fields.getTextInputValue('species').toLowerCase(),
        weight: Number(rawWeight),
        height: Number(rawHeight)
      };
      const char: characters = await client.models.characters.create({
        discordId: interaction.user.id,
        data: characterData
      });
      char.createStats();
      char.createImages();
    } catch (e) {
      toConsole(String(e), new Error().stack, client);
      return interaction.editReply({
        content: `${emojis.failure} | The database didn't give me the food I wanted. Please report this to a developer (Snack code: \`NPF-001\`)`
      });
    }
    interaction.editReply({
      content: `Success! Your character, \`${fields.getTextInputValue(
        'name'
      )}\`, has been created! Use \`/profile switch\` to switch to them`
    });
  });

  confirm.on('end', () => {
    if (!submitted)
      interaction.editReply({
        content: 'Please fill out the form if it was shown to you. If it was not, please re-run the command again!',
        components: []
      });
  });
}
