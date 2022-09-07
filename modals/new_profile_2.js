// eslint-disable-next-line no-unused-vars
const { Client, ModalSubmitInteraction, ModalSubmitFields } = require("discord.js");

module.exports = {
  name: "new_profile_2",
  /**
   * @param {Client} client
   * @param {ModalSubmitInteraction} interactions
   * @param {ModalSubmitFields} fields
   */
  run: async (client, interaction, fields) => {
    return [client, interaction, fields];
    // Prevent modal from triggering anything else since it's awaited in new_profile_1.js
  }
};