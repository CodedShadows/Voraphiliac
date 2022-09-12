// eslint-disable-next-line no-unused-vars
const { Client, ModalSubmitInteraction, ModalSubmitFields } = require("discord.js");
const { interactionEmbed, toConsole } = require("../functions.js");
const { emojis } = require("../configs/config.json");

module.exports = {
  name: "edit_profile",
  /**
   * @param {Client} client
   * @param {ModalSubmitInteraction} interaction
   * @param {ModalSubmitFields} fields
   */
  run: async (client, interaction, fields) => {
    await interaction.deferReply();
    await interaction.deleteReply();
    const char = await client.models.Character.findOne({ where: { discordId: interaction.user.id, active: true } });
    const data = fields.fields.first();

    if(!char) return interaction.message.edit({ content: `${emojis.failure} | You do not have an active character` });
    switch(data.customId) {
    case "name": {
      try {
        await client.models.Character.update({ name: data.value }, { where: { cId: char.cId } });
        return interaction.message.edit({ content: `${emojis.success} | Updated your character's name to \`${data.value}\``, components: [] });
      } catch(e) {
        toConsole(String(e), new Error().stack, client);
        return interaction.message.edit({ content: `${emojis.failure} | An error occurred while updating your character's name. Report this to a developer`, components: [] });
      }
    }
    case "role": {
      if(!/^(Pred(ator)? Switch|(Apex )?Pred(ator)?)|(Switch)|(Prey( Switch)?)$/i.test(data.value)) return interactionEmbed(3, "[ERR-ARGS]", "Please enter a valid vore role. Pred can be substituted for Predator. (`Apex Pred`, `Pred`, `Pred Switch`, `Switch`, `Prey Switch`, or `Prey`)", interaction, client, [true, 10]);
      const cleanContent = data.value.match(/^(Pred(ator)? Switch|(Apex )?Pred(ator)?)|(Switch)|(Prey( Switch)?)$/i)[0].toLowerCase();
      try {
        await client.models.Character.update({ role: cleanContent }, { where: { cId: char.cId } });
        return interaction.message.edit({ content: `${emojis.success} | Updated your character's role to \`${cleanContent.split(" ").map(v => v.charAt(0).toUpperCase()+v.slice(1)).join(" ")}\``, components: [] });
      } catch(e) {
        toConsole(JSON.stringify(e), new Error().stack, client);
        return interaction.message.edit({ content: `${emojis.failure} | An error occurred while updating your character's role. Report this to a developer`, components: [] });
      }
    }
    case "description": {
      try {
        await client.models.Character.update({ description: data.value }, { where: { cId: char.cId } });
        return interaction.message.edit({ content: `${emojis.success} | Updated your character's description to:\n>>> ${data.value}`, components: [] });
      } catch(e) {
        toConsole(JSON.stringify(e), new Error().stack, client);
        return interaction.message.edit({ content: `${emojis.failure} | An error occurred while updating your character's description. Report this to a developer`, components: [] });
      }
    }
    case "gender": {
      try {
        await client.models.Character.update({ gender: data.value }, { where: { cId: char.cId } });
        return interaction.message.edit({ content: `${emojis.success} | Updated your character's gender to \`${data.value}\``, components: [] });
      } catch(e) {
        toConsole(JSON.stringify(e), new Error().stack, client);
        return interaction.message.edit({ content: `${emojis.failure} | An error occurred while updating your character's gender. Report this to a developer`, components: [] });
      }
    }
    case "species": {
      try {
        await client.models.Character.update({ species: data.value }, { where: { cId: char.cId } });
        return interaction.message.edit({ content: `${emojis.success} | Updated your character's species to \`${data.value}\``, components: [] });
      } catch(e) {
        toConsole(JSON.stringify(e), new Error().stack, client);
        return interaction.message.edit({ content: `${emojis.failure} | An error occurred while updating your character's species. Report this to a developer`, components: [] });
      }
    }
    }
  }
};