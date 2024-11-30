import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ComponentType,
  EmbedBuilder,
  Interaction,
  InteractionEditReplyOptions,
  InteractionType
} from 'discord.js';
import { default as config } from './configs/config.json' assert { type: 'json' };
import { CustomClient } from './typings/Extensions.js';

//#region Enums
enum ResultMessage {
  DatabaseError = 'An error has occurred while communicating with the database',
  Cooldown = 'You are on cooldown!',
  UserPermission = 'You do not have the proper permissions to execute this command',
  BotPermission = 'This bot does not have proper permissions to execute this command',
  BadArgument = 'You have not supplied the correct parameters. Please check again',
  Unknown = 'An unknwon error occurred. Please report this to a developer',
  NotFound = "The requested information wasn't found",
  NoDM = "This command isn't available in Direct Messages. Please run this in a server",
  NonexistentCommand = 'The requested slash command was not found. Please refresh your Discord client and try again',
  Development = 'This command is in development. This should not be expected to work'
}
enum ResultType {
  Success,
  Warning,
  Error,
  Information
}
//#endregion
//#region Types
//#endregion
//#region Functions
/**
 * @async
 * @description Sends a message to the console
 * @example toConsole(`Hello, World!`, new Error().stack, client);
 */
export async function toConsole(message: string, source: string, client: CustomClient): Promise<void> {
  if (source.split('\n').length < 2)
    return console.error('[ERR] toConsole called but Error.stack was not used\n> Source: ' + source);
  source = /(?:[A-Za-z0-9._]+:[0-9]+:[0-9]+)/.exec(source)![0];
  const channel = await client.channels.fetch(config.discord.logChannel).catch(() => null);
  if (!channel || !channel.isTextBased())
    return console.warn('[WARN] toConsole called but bot cannot find logging channel\n', message, '\n', source);

  await channel
    .send({
      content: `Incoming message from \`${source}\` at <t:${Math.floor(Date.now() / 1000)}:F>`,
      embeds: [
        new EmbedBuilder({
          title: 'Message to Console',
          color: 0xde2821,
          description: message || '{No content provided!}',
          timestamp: new Date()
        })
      ]
    })
    .catch((err: Error) => {
      client.logs.error({ err }, `[ERR] At ${new Date().toString()}, toConsole called but message failed to send\n\n> msg: ${message}`);
    });
  return;
}

/**
 * @async
 * @description Replies with a Embed to the Interaction
 * @example interactionEmbed(1, "", `Removed ${removed} roles`, interaction)
 * @example interactionEmbed(3, `[ERR-UPRM]`, `Missing: \`Manage Messages\``, interaction)
 * @returns {Promise<void>}
 */
export async function interactionEmbed(
  type: ResultType,
  content: ResultMessage | string,
  interaction: Exclude<Interaction, { type: InteractionType.ApplicationCommandAutocomplete }>
): Promise<void> {
  if (!interaction.deferred) await interaction.deferReply();
  const embed = new EmbedBuilder()
    .setAuthor({ name: interaction.user.username, iconURL: interaction.user.avatarURL({ size: 4096 })! })
    .setDescription(content)
    .setTimestamp();

  switch (type) {
    case ResultType.Success:
      embed.setTitle('Success').setColor(0x7289da);

      break;
    case ResultType.Warning:
      embed.setTitle('Warning').setColor(0xffa500);

      break;
    case ResultType.Error:
      embed.setTitle('Error').setColor(0xff0000);

      break;
    case ResultType.Information:
      embed.setTitle('Information').setColor(0x7289da);

      break;
  }
  // Utilise invisible character to remove message content
  await interaction.editReply({ content: '​', embeds: [embed], components: [] });
  return;
}

export function parseTime(time: string): number {
  let duration = 0;
  if (!time.match(/[1-9]{1,3}[dhms]/g)) return NaN;

  for (const period of time.match(/[1-9]{1,3}[dhms]/g)!) {
    const [amount, unit] = period.match(/^(\d+)([dhms])$/)!.slice(1);
    duration +=
      unit === 'd'
        ? Number(amount) * 24 * 60 * 60
        : unit === 'h'
        ? Number(amount) * 60 * 60
        : unit === 'm'
        ? Number(amount) * 60
        : Number(amount);
  }

  return duration;
}

export function getEnumKey(enumObj: object, value: number): string | undefined {
  for (const key in enumObj) {
    if (Object.prototype.hasOwnProperty.call(enumObj, key) && enumObj[key] === (value as number)) {
      return key;
    }
  }
  return undefined;
}

export async function paginationRow(
  interaction: Exclude<Interaction, { type: InteractionType.ApplicationCommandAutocomplete }>,
  buttonRows: ButtonBuilder[][],
  args: InteractionEditReplyOptions,
  embeds?: EmbedBuilder[]
): Promise<ButtonInteraction> {
  // Create the row
  const paginationRow: ActionRowBuilder<ButtonBuilder> = new ActionRowBuilder({
    components: [
      new ButtonBuilder({ customId: 'prev', style: ButtonStyle.Primary, emoji: '⬅️' }),
      new ButtonBuilder({ customId: 'cancel', style: ButtonStyle.Danger, emoji: '🟥' }),
      new ButtonBuilder({ customId: 'next', style: ButtonStyle.Primary, emoji: '➡️' })
    ]
  });
  // Pair the embed with the buttons
  const rows: [ActionRowBuilder<ButtonBuilder>, EmbedBuilder?][] = buttonRows.map((r, i) => {
    // Create the row
    const row: ActionRowBuilder<ButtonBuilder> = new ActionRowBuilder({ components: r });
    // If no embeds exist, just return the row
    if (!embeds) return [row];
    // Else, return the row and the embed
    else return [row, embeds[i]];
  });
  // Configure message
  if (rows.length === 0 || (embeds && embeds.length !== rows.length)) return Promise.reject('No rows were provided');
  let index = 0,
    returnedInteraction;
  if (embeds && embeds.length > 0) args.embeds = [rows[index][1]];
  while (typeof returnedInteraction === 'undefined') {
    // Create message
    const coll = await interaction
      // Edit the reply
      .editReply({
        content: args.content || 'Please select an option below',
        embeds: args.embeds || undefined,
        components: [rows[index][0], paginationRow]
      })
      // Add listener
      .then((m) =>
        m.awaitMessageComponent({
          time: 15_000,
          filter: (i) => i.user.id === interaction.user.id,
          componentType: ComponentType.Button
        })
      )
      // Handle no response
      .catch((e) => e);
    // Check the custom id
    if (coll instanceof Error && coll.name === 'Error [InteractionCollectorError]') {
      returnedInteraction = null; // Timeout
      break;
    } else if (coll instanceof Error) {
      throw coll; // Not an error we can handle
    }
    // Drop the update
    await coll.update({});
    // If it's anything other than
    // next or prev, return it
    if (!/next|prev/.test(coll.customId)) {
      // Return the interaction
      returnedInteraction = coll;
      break;
    }
    // Configure index
    if (coll.customId === 'next') {
      if (index === rows.length - 1) index = 0;
      else index++;
    } else {
      if (index === 0) index = rows.length - 1;
      else index--;
    }
    // Configure message
    if (embeds && embeds.length > 0) args.embeds = [rows[index][1]];
    else args.embeds = [];
    args.components = [rows[index][0], paginationRow];
    // And the loop continues...
  }
  // Remove embeds and components
  await interaction.editReply({ content: args.content || 'Please select an option below', embeds: [], components: [] });
  return Promise.resolve(returnedInteraction);
}
//#endregion
