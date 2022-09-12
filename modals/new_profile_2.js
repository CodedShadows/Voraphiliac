// eslint-disable-next-line no-unused-vars
const { Client, ModalSubmitInteraction, ModalSubmitFields } = require("discord.js");
const { emojis } = require("../configs/config.json");

module.exports = {
  name: "new_profile_2",
  /**
   * @param {Client} client
   * @param {ModalSubmitInteraction} interaction
   * @param {ModalSubmitFields} fields
   */
  run: async (client, interaction) => {
    await require("node:util").promisify(setTimeout)(1500);
    if(!interaction.deferred && !interaction.replied)
      return interaction.reply({ content: `${emojis.failure} | The modal timed out. Please try again!`, ephemeral: true, components: [] });
    else
      return true;
  }
};