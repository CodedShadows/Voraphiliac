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
    const char = await process.Character.findOne({ where: { discordId: interaction.user.id, active: true } });
    const data = fields.fields.first();

    if(!char) return interaction.update({ content: `${emojis.failure} | You do not have an active character` });
    switch(data.customId) {
    case "name": {
      try {
        await process.Character.update({ name: data.value }, { where: { cId: char.cId } });
        return interaction.update({ content: `${emojis.success} | Updated your character's name to \`${data.value}\``, components: [] });
      } catch(e) {
        toConsole(String(e), new Error().stack, client);
        return interaction.update({ content: `${emojis.failure} | Something happened and I lost my food while updating the name! Report this to a developer (Snack code: \`EPF-001\`)`, components: [] });
      }
    }
    case "role": {
      if(!/^(Pred(ator)? Switch|(Apex )?Pred(ator)?)|(Switch)|(Prey( Switch)?)$/i.test(data.value)) return interactionEmbed(3, "[ERR-ARGS]", "Please enter a valid vore role. Pred can be substituted for Predator. (`Apex Pred`, `Pred`, `Pred Switch`, `Switch`, `Prey Switch`, or `Prey`)", interaction, client, [true, 10]);
      const cleanContent = /^(Pred(ator)? Switch|(Apex )?Pred(ator)?)|(Switch)|(Prey( Switch)?)$/i.exec(data.value)[0].toLowerCase(); // skipcq: JS-D007
      try {
        await process.Character.update({ role: cleanContent }, { where: { cId: char.cId } });
        return interaction.update({ content: `${emojis.success} | Updated your character's role to \`${cleanContent.split(" ").map(v => v.charAt(0).toUpperCase()+v.slice(1)).join(" ")}\``, components: [] });
      } catch(e) {
        toConsole(JSON.stringify(e), new Error().stack, client);
        return interaction.update({ content: `${emojis.failure} | Something happened and I lost my food while updating the role! Report this to a developer (Snack code: \`EPF-002\`)`, components: [] });
      }
    }
    case "description": {
      try {
        await process.Character.update({ description: data.value }, { where: { cId: char.cId } });
        return interaction.update({ content: `${emojis.success} | Updated your character's description to:\n>>> ${data.value}`, components: [] });
      } catch(e) {
        toConsole(JSON.stringify(e), new Error().stack, client);
        return interaction.update({ content: `${emojis.failure} | Something happened and I lost my food while updating the description! Report this to a developer (Snack code: \`EPF-003\`)`, components: [] });
      }
    }
    case "gender": {
      try {
        await process.Character.update({ gender: data.value }, { where: { cId: char.cId } });
        return interaction.update({ content: `${emojis.success} | Updated your character's gender to \`${data.value}\``, components: [] });
      } catch(e) {
        toConsole(JSON.stringify(e), new Error().stack, client);
        return interaction.update({ content: `${emojis.failure} | Something happened and I lost my food while updating the gender! Report this to a developer (Snack code: \`EPF-004\`)`, components: [] });
      }
    }
    case "species": {
      try {
        await process.Character.update({ species: data.value }, { where: { cId: char.cId } });
        return interaction.update({ content: `${emojis.success} | Updated your character's species to \`${data.value}\``, components: [] });
      } catch(e) {
        toConsole(JSON.stringify(e), new Error().stack, client);
        return interaction.update({ content: `${emojis.failure} | Something happened and I lost my food while updating the species! Report this to a developer (Snack code: \`EPF-005\`)`, components: [] });
      }
    }
    }
  }
};