import { ChatInputCommandInteraction, Interaction, InteractionType } from 'discord.js';
import { CustomClient } from '../../../typings/Extensions.js';
import { toConsole } from '../../../functions.js';

export const name = 'main';
export async function execute(client: CustomClient<true>, interaction: Interaction): Promise<void> {
  // Avoid running commands before the bot is ready
  if (!client.ready && interaction.isCommand()) {
    interaction.reply({
      content: 'The bot is still starting up. Please wait a few seconds and try again.',
      ephemeral: true
    });
  } else if (!client.ready) {
    return;
  }
  // Get the interaction function
  let func: string;
  switch (interaction.type) {
    case InteractionType.ApplicationCommand: {
      func = 'command';
      break;
    }
    case InteractionType.MessageComponent: {
      func = 'component';
      break;
    }
    case InteractionType.ApplicationCommandAutocomplete: {
      func = 'autocomplete';
      break;
    }
    case InteractionType.ModalSubmit: {
      func = 'modal';
      break;
    }
  }
  // Run all interaction functions
  try {
    client.functions.get(`events_interactionCreate_${func}`).execute(client, interaction);
  } catch (err) {
    console.error('hi it errored', err);
    toConsole(`Failed to run ${func}\n\n${String(err)}`, err.stack || new Error().stack, client);
    if (func === 'autocomplete') return;
    // Sometimes not a ChatInputCommandInteraction, but this excludes autocomplete from TS errors
    (interaction as ChatInputCommandInteraction).editReply({
      content: 'Oops! I bit off more than I could chew. Please report this to a developer'
    });
  }
  return;
}
