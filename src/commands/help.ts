import {
  ApplicationCommand,
  ApplicationCommandOptionType,
  ApplicationCommandSubCommand,
  Collection,
  EmbedBuilder,
  SlashCommandBuilder
} from 'discord.js';
import { default as config } from '../configs/config.json' with { type: 'json' };
import { CmdFileArgs } from '../typings/Extensions.js';
const { emojis } = config;

function getCommand(commandName: string, commands: Collection<string, ApplicationCommand>) {
  if (commandName.startsWith('/')) {
    commandName = commandName.slice(1);
  }

  const parts = commandName.split(' ');
  const cmd = commands.find((c) => c.name === parts[0]);
  if (!cmd) return;
  switch (parts.length) {
    case 1: {
      // Direct command
      return [cmd];
    }
    case 2: {
      // Subcommand
      const subCommand = cmd.options.find((option) => option.name === parts[1]);
      if (!subCommand) return;
      return [cmd, subCommand];
    }
    case 3: {
      // Subcommand with group
      const group = cmd.options.find(
        (option) => option.name === parts[1] && option.type === ApplicationCommandOptionType.SubcommandGroup
      ) as unknown as ApplicationCommand | null; // discord.js does not properly type this
      if (!group) return;
      const subCommand = group.options.find((option) => option.name === parts[2]);
      if (!subCommand) return;
      return [cmd, group, subCommand];
    }
    default: {
      return;
    }
  }
}

export const name = 'help';
export const data = new SlashCommandBuilder()
  .setName(name)
  .setDescription('Get helpful information about the bot')
  .addStringOption((option) => option.setName('command').setDescription('The command to get help for'));
export async function execute({ client, interaction, options }: CmdFileArgs) {
  await interaction.deferReply();

  let allCommands: Collection<string, ApplicationCommand>;
  if (process.env.NODE_ENV === 'development') {
    allCommands = await client.guilds.fetch(config.bot.guildId).then((g) => g.commands.fetch());
  } else {
    allCommands = await client.application.commands.fetch();
  }
  const commandName = options.getString('command');

  const embed = new EmbedBuilder();
  embed.setColor('Random');
  embed.setTimestamp();

  if (!commandName) {
    const commandList = allCommands
      .map((cmd) => {
        return `- </${cmd.name}:${cmd.id}>: ${cmd.description}${cmd.nsfw ? `(${emojis.nsfw})` : ''}`;
      })
      .join('\n');

    embed.setTitle('All Commands');
    embed.setDescription(
      commandList + `\n\nAny commands with ${emojis.nsfw} are NSFW commands and must be run in NSFW channels`
    );
    interaction.editReply({ embeds: [embed] });
    return;
  }

  const cmdQuery = getCommand(commandName, allCommands);
  if (!cmdQuery) {
    embed.setDescription(`${emojis.failure} | Command not found`);
    interaction.editReply({ embeds: [embed] });
    return;
  }

  const command = cmdQuery[0] as ApplicationCommand;
  switch (cmdQuery.length) {
    // Direct command
    case 1: {
      embed.setTitle(`Help for /${command.name}`);
      embed.setDescription(command.description + `\n\nClick to run: </${command.name}:${command.id}>`);
      break;
    }
    // Subcommand
    case 2: {
      if (cmdQuery[1].type === ApplicationCommandOptionType.Subcommand) {
        const subCommand = cmdQuery[1] as ApplicationCommandSubCommand;
        embed.setTitle(`Help for /${command.name} ${subCommand.name}`);
        embed.setDescription(
          subCommand.description + `\n\nClick to run: </${command.name} ${subCommand.name}:${command.id}>`
        );
      } else if (cmdQuery[1].type === ApplicationCommandOptionType.SubcommandGroup) {
        embed.setTitle(`Help for /${command.name}`);
        embed.setDescription(command.description);
        cmdQuery[1].options.forEach((option) => {
          const cmdStr = `/${command.name} ${cmdQuery[1].name} ${option.name}`;
          embed.addFields({
            name: `Subcommand ${cmdStr}`,
            value: option.description + `\n\nClick to run: </${cmdStr}:${command.id}>`,
            inline: true
          });
        });
      }
      break;
    }
    case 3: {
      const cmdStr = `/${command.name} ${cmdQuery[1].name} ${cmdQuery[2].name}`;
      embed.setTitle(`Help for /${cmdStr}`);
      embed.setDescription(cmdQuery[2].description + `\n\nClick to run: </${cmdStr}:${command.id}>`);
    }
  }
  if (command.nsfw) {
    embed.setDescription(embed.data.description + '\n\n\\*\\* You must use this in a NSFW channel!');
  }
  interaction.editReply({ embeds: [embed] });
}
