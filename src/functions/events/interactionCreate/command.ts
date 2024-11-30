import { ChatInputCommandInteraction } from 'discord.js';
import { CustomClient } from '../../../typings/Extensions.js';

export const name = 'command';
export async function execute(client: CustomClient<true>, interaction: ChatInputCommandInteraction) {
  if (!interaction.isChatInputCommand()) return;
  // Get command
  const cmd = client.commands.get(interaction.commandName);
  if (!cmd) return;
  // Run command
  cmd.execute({ client, interaction, options: interaction.options }).catch((err) => {
    const content = `Something went wrong while running the command! This error has been logged`;
    if (interaction.replied || interaction.deferred) interaction.editReply({ content });
    else interaction.reply({ content });
    // Send to logger
    client.logs.error({ msg: `E | ✘ ${name}`, err });
  });
}
