// eslint-disable-next-line no-unused-vars
import { Client, ModalSubmitInteraction, ModalSubmitFields } from "discord.js";

module.exports = {
  name: "edit_image",
  /**
   * @param {Client} client
   * @param {ModalSubmitInteraction} interaction
   * @param {ModalSubmitFields} fields
   */
  run: (client: Client, interaction: ModalSubmitInteraction, fields: ModalSubmitFields) => {
    return [client, interaction, fields];
    // Return as it's awaited elsewhere
  }
};