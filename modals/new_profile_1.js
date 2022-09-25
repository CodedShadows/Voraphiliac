// eslint-disable-next-line no-unused-vars
const { Client, ModalSubmitInteraction, ModalSubmitFields, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require("discord.js");
const { emojis } = require("../configs/config.json");
const { new_profile_2 } = require("../configs/modals.js");
const { Op } = require("sequelize");

module.exports = {
  name: "new_profile_1",
  /**
   * @param {Client} client
   * @param {ModalSubmitInteraction} interactions
   * @param {ModalSubmitFields} fields
   */
  run: async (client, interaction, fields) => {
    const filter = (i) => i.user.id === interaction.user.id;
    const message = await interaction.reply({ content: "Click the button to continue (Note: If the modal fails, pleases re-run the command)", components: [new ActionRowBuilder().setComponents(new ButtonBuilder({ custom_id: "continue", label: "Continue", style: ButtonStyle.Success }))], ephemeral: true, fetchReply: true });
    const confirm = await message
      .createMessageComponentCollector({ filter, componentType: ComponentType.Button, time: 30_000 });

    confirm.on("collect", async (i) => {
      await i.showModal(new_profile_2);
      const m2 = await i.awaitModalSubmit({ filter, time: 180_000, errors: ["time"] })
        .catch(() => { return null; });
    
      if(!m2) return;
      await m2.deferReply({ ephemeral: true });
      await interaction.editReply({ content: ":gear: Processing, please wait", components: [] });
      m2.editReply({ content: `${emojis.failure} | Please close this message and pay attention to the above one!` });

      // VALIDATION //
      if(!/^(Pred(ator)? Switch|(Apex )?Pred(ator)?)|(Switch)|(Prey( Switch)?)$/i.test(fields.getTextInputValue("role"))) return interaction.editReply({ content: "Please enter a valid vore role. Pred can be substituted for Predator. (`Apex Pred`, `Pred`, `Pred Switch`, `Switch`, `Prey Switch`, or `Prey`)" });
      if(!/^[0-9]+(\.[0-9]{1,3})?$/.test(m2.fields.getTextInputValue("height")) || !/^[0-9]+(\.[0-9]{1,3})?$/.test(m2.fields.getTextInputValue("weight"))) return interaction.editReply({ content: "Your weight and height must be a number with a maximum of three decimal places. Please try again!" });
      if((await client.models.Character.findOne({ where: { discordId: interaction.user.id, name: fields.getTextInputValue("name") } }))) return interaction.editReply({ content: "You already have a character with that name!" });
      // if a character with a name LIKE the one entered already exists, ask if they want to continue
      const similarChar = await client.models.Character.findOne({ where: { discordId: interaction.user.id, name: { [Op.substring]: fields.getTextInputValue("name") } } });
      if(similarChar !== undefined) {
        await interaction.editReply({ content: `${emojis.warning} | You have a character that has a name like the one you entered (${similarChar.name}). Please make sure you enter the **full** name when using \`/profile switch\`` });
        await require("node:util").promisify(setTimeout)(5000);
      }

      let char;
      try {
        char = await client.models.Character.create({
          discordId: interaction.user.id,
          active: false,
          busy: false,
          name: fields.getTextInputValue("name"),
          role: /^(Pred(ator)? Switch|(Apex )?Pred(ator)?)|(Switch)|(Prey( Switch)?)$/i.exec(fields.getTextInputValue("role").toLowerCase())[0],
          description: m2.fields.getTextInputValue("description"),
          gender: fields.getTextInputValue("gender").toLowerCase(),
          species: fields.getTextInputValue("species").toLowerCase(),
          weight: /^[0-9]+(\.[0-9]{1,3})?$/.exec(m2.fields.getTextInputValue("weight"))[0],
          height: /^[0-9]+(\.[0-9]{1,3})?$/.exec(m2.fields.getTextInputValue("height"))[0],
          whitelist: ["all"],
          blacklist: ["none"],
          autodigest: false
        });
        client.models.Stats.create({
          character: char.cId,
          health: 100,
          arousal: 0,
          digestion: 0,
          defiance: 0,
          euphoria: 0
        });
        client.models.Image.create({
          character: char.cId,
          profile: " ",
          analPred: " ",
          analPrey: " ",
          breastPred: " ",
          breastPrey: " ",
          cockPred: " ",
          cockPrey: " ",
          oralPred: " ",
          oralPrey: " ",
          tailPred: " ",
          tailPrey: " ",
          unbirthPred: " ",
          unbirthPrey: " "
        });
      } catch(e) {
        return interaction.editReply({ content: `${emojis.failure} | An error occurred while submitting your data to the database. Please report this to a developer` });
      }
      interaction.editReply({ content: `Success! Your character, \`${fields.getTextInputValue("name")}\`, has been added to the database. Use \`/profile switch\` to switch to them` });
    });

    confirm.on("end", () => {
      interaction.editReply({ content: "Please fill out the form if it was shown to you. If it was not, please re-run the command again!", components: [] });
    });
  }
};