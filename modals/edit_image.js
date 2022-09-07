// eslint-disable-next-line no-unused-vars
const { Client, ModalSubmitInteraction, ModalSubmitFields } = require("discord.js");

module.exports = {
  name: "edit_image",
  /**
   * @param {Client} client
   * @param {ModalSubmitInteraction} interaction
   * @param {ModalSubmitFields} fields
   */
  run: async (client, interaction, fields) => {
    return [client, interaction, fields];
    // Return as it's awaited elsewhere
  }
};