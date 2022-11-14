// eslint-disable-next-line no-unused-vars
const { Client, ModalSubmitInteraction, ModalSubmitFields, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require("discord.js");
const { emojis } = require("../configs/config.json");
const { new_profile_2 } = require("../configs/modals.js");
const { Op } = require("sequelize");
let submitted = false;

module.exports = {
  name: "new_profile_1",
  /**
   * @param {Client} client
   * @param {ModalSubmitInteraction} interactions
   * @param {ModalSubmitFields} fields
   */
  run: async (client, interaction, fields) => {
    const r1 = new RegExp("^(Pred(ator)? Switch|(Apex )?Pred(ator)?)|(Switch)|(Prey( Switch)?)$", "i");
    // eslint-disable-next-line no-useless-escape
    const r2 = new RegExp("^[0-9]{0,10}(?:\.[0-9]{1,3})?$");
    const filter = (i) => i.user.id === interaction.user.id;
    const message = await interaction.reply({ content: "Click the button to continue (Note: If the modal fails, pleases re-run the command)", components: [new ActionRowBuilder().setComponents(new ButtonBuilder({ custom_id: "continue", label: "Continue", style: ButtonStyle.Success }))], ephemeral: true, fetchReply: true });
    const confirm = await message
      .createMessageComponentCollector({ filter, componentType: ComponentType.Button, time: 30_000 });

    confirm.on("collect", async (i) => {
      await i.showModal(new_profile_2);
      const m2 = await i.awaitModalSubmit({ filter, time: 180_000, errors: ["time"] })
        .catch(() => { return null; });

      if(!m2) return;
      submitted = true;
      await m2.deferReply({ ephemeral: false });
      m2.deleteReply();
      await interaction.editReply({ content: ":gear: Processing, please wait", components: [] });

      // VALIDATION //
      if(!r1.test(fields.getTextInputValue("role"))) return interaction.editReply({ content: "Please enter a valid vore role. Pred can be substituted for Predator. (`Apex Pred`, `Pred`, `Pred Switch`, `Switch`, `Prey Switch`, or `Prey`)" });
      if(!r2.test(m2.fields.getTextInputValue("height")) || !r2.test(m2.fields.getTextInputValue("weight"))) return interaction.editReply({ content: "Your weight and height must be a number up to ten digits with a maximum of three decimal places (Ex. `12.34`, `.123`, `1234567890.123`)" });
      if((await process.Character.findOne({ where: { discordId: interaction.user.id, name: fields.getTextInputValue("name") } }))) return interaction.editReply({ content: "You already have a character with that name!" });
      // Check for existing characters with similar names
      const similarChar = await process.Character.findOne({ where: { discordId: interaction.user.id, name: { [Op.substring]: fields.getTextInputValue("name") } } });
      if(similarChar) {
        await interaction.editReply({ content: `${emojis.warning} | You have a character that has a name (${similarChar.name}) like the one you entered. Please make sure you enter the **full** name when using commands` });
        await require("node:util").promisify(setTimeout)(5000);
      }

      let char;
      try {
        char = await process.Character.create({
          discordId: interaction.user.id,
          name: fields.getTextInputValue("name"),
          role: r1.exec(fields.getTextInputValue("role").toLowerCase())[0], // skipcq: JS-D007
          description: m2.fields.getTextInputValue("description"),
          gender: fields.getTextInputValue("gender").toLowerCase(),
          species: fields.getTextInputValue("species").toLowerCase(),
          weight: r2.exec(m2.fields.getTextInputValue("weight"))[0], // skipcq: JS-D007
          height: r2.exec(m2.fields.getTextInputValue("height"))[0] // skipcq: JS-D007
        });
        process.Stats.create({ character: char.cId });
        process.Image.create({ character: char.cId });
      } catch(e) {
        return interaction.editReply({ content: `${emojis.failure} | The database didn't give me the food I wanted. Please report this to a developer (Snack code: \`NPF-001\`)` });
      }
      interaction.editReply({ content: `Success! Your character, \`${fields.getTextInputValue("name")}\`, has been created! Use \`/profile switch\` to switch to them` });
    });

    confirm.on("end", () => {
      if(!submitted) interaction.editReply({ content: "Please fill out the form if it was shown to you. If it was not, please re-run the command again!", components: [] });
    });
  }
};