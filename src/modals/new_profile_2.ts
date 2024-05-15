// eslint-disable-next-line no-unused-vars
import { Client, ModalSubmitInteraction } from "discord.js";
import { emojis } from "../configs/config.json";

module.exports = {
  name: "new_profile_2",
  /**
   * @param {Client} client
   * @param {ModalSubmitInteraction} interaction
   */
  run: async (client: Client, interaction: ModalSubmitInteraction) => {
    await require("node:util").promisify(setTimeout)(1500);
    if(!interaction.deferred && !interaction.replied)
      return interaction.reply({ content: `${emojis.failure} | The modal timed out. Please try again!`, ephemeral: true, components: [] });
    else
      return true;
  }
};