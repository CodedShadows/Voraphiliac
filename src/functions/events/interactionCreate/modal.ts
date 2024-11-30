import { ModalSubmitInteraction } from "discord.js";
import { CustomClient } from "../../../typings/Extensions.js";

export const name = 'modal';
export async function execute(client: CustomClient<true>, interaction: ModalSubmitInteraction): Promise<void> {
  // Avoid running commands before the bot is ready
  if (!client.ready) {
    return;
  }
  // Find corresponding modal
  const modalFile = client.functions.get(`modals_${interaction.customId}`);
  if (!modalFile) {
    return; // We don't have it. Perhaps something is using awaitModalSubmit() and caught it
  }
  modalFile.execute(client, interaction, interaction.fields);
  return;
}