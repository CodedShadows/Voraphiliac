const { Client, Collection, IntentsBitField, Partials } = require("discord.js");
const { REST } = require("@discordjs/rest");
const { Sequelize } = require("sequelize");
const { Routes, InteractionType } = require("discord-api-types/v10");
const { interactionEmbed, toConsole } = require("./functions.js");
const config = require("./config.json");
const rest = new REST({ version: 10 }).setToken(config.bot.token);
const fs = require("node:fs");
const wait = require("node:util").promisify(setTimeout);
const warnedGuilds = [];
let ready = false;

//#region Setup
// Database
const sequelize = new Sequelize(config.mysql.database, config.mysql.user, config.mysql.password, {
  dialect: "mysql",
  logging: process.env.environment === "development" ? console.log : false,
});
if(!fs.existsSync("./models")) {
  console.warn("[DB] No models detected");
} else {
  console.info("[DB] Models detected");
  const models = fs.readdirSync("models").filter(file => file.endsWith(".js"));
  console.info(`[DB] Expecting ${models.length} models`);
  for(const model of models) {
    try {
      const file = require(`./models/${model}`);
      file.import(sequelize);
      console.info(`[DB] Loaded ${model}`);
    } catch(e) {
      console.error(`[DB] Unloaded ${model}`);
      console.error(`[DB] ${e}`);
    }
  }
}

// Discord bot
const client = new Client({
  intents: [IntentsBitField.Flags.Guilds, IntentsBitField.Flags.GuildMembers],
  partials: [Partials.GuildMember]
});
const slashCommands = [];
client.commands = new Collection();
client.modals = new Collection();
client.sequelize = sequelize;
client.models = sequelize.models;

(async () => {
  if(!fs.existsSync("./commands")) return console.info("[FILE-LOAD] No 'commands' folder found, skipping command loading");
  const commands = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));
  console.info(`[CMD-LOAD] Loading commands, expecting ${commands.length} files`);

  for(let file of commands) {
    try {
      console.info(`[CMD-LOAD] Loading file ${file}`);
      let command = require(`./commands/${file}`);

      if(command.name) {
        console.info(`[CMD-LOAD] Loaded: ${file}`);
        slashCommands.push(command.data.toJSON());
        client.commands.set(command.name, command);
      }
    } catch(e) {
      console.warn(`[CMD-LOAD] Unloaded: ${file}`);
      console.warn(`[CMD-LOAD] ${e}`);
    }
  }
  console.info("[CMD-LOAD] Loaded commands");

  if(!fs.existsSync("./modals")) await fs.mkdirSync("./modals");
  const modals = fs.readdirSync("./modals").filter(file => file.endsWith(".js"));
  console.info(`[MDL-LOAD] Loading modals, expecting ${modals.length} modals`);
  for(let file of modals) {
    try {
      console.info(`[MDL-LOAD] Loading file ${file}`);
      let modal = require(`./modals/${file}`);

      if(modal.name) {
        console.info(`[MDL-LOAD] Loaded: ${file}`);
        client.modals.set(modal.name, modal);
      }
    } catch(e) {
      console.warn(`[MDL-LOAD] Unloaded: ${file}`);
      console.warn(`[MDL-LOAD] ${e}`);
    }
  }
  console.info("[MDL-LOAD] Loaded modals");

  console.info("[FILE-LOAD] All files loaded into ASCII and ready to be sent");
  await wait(500); // Artificial wait to prevent instant sending
  const now = Date.now();

  try {
    console.info("[APP-CMD] Started refreshing application (/) commands.");

    // Refresh based on environment
    if(process.env.environment === "development") {
      console.warn("[APP-CMD] Development environment detected, refreshing application commands");
      await rest.put(
        Routes.applicationGuildCommands(config.bot.applicationId, config.bot.guildId),
        { body: slashCommands }
      );
    } else {
      await rest.put(
        Routes.applicationCommands(config.bot.applicationId),
        { body: slashCommands }
      );
    }
    
    const then = Date.now();
    console.info(`[APP-CMD] Successfully reloaded application (/) commands after ${then - now}ms.`);
  } catch(error) {
    console.error("[APP-CMD] An error has occurred while attempting to refresh application commands.");
    console.error(`[APP-CMD] ${error}`);
  }
  console.info("[FILE-LOAD] All files loaded successfully");
  ready = true;
})();
//#endregion

//#region Events
client.on("ready", async () => {
  console.info("[READY] Client is ready");
  console.info(`[READY] Logged in as ${client.user.tag} (${client.user.id}) at ${new Date()}`);
  toConsole(`[READY] Logged in as ${client.user.tag} (${client.user.id}) at <t:${Math.floor(Date.now()/1000)}:T>. Client ${ready ? "can" : "**cannot**"} receive commands!`, new Error().stack, client);
  // Set the status to new Date();
  client.guilds.cache.each(g => g.members.fetch());
  client.user.setActivity(`${client.users.cache.size} users across ${client.guilds.cache.size} servers`, { type: "LISTENING" });

  try {
    await sequelize.authenticate();
    console.info("[DB] Passed validation");
    await sequelize.sync({ alter: process.env.environment === "development" });
    console.info("[DB] Synchronized the database");
  } catch(e) {
    console.warn("[DB] Failed validation");
    console.error(e);
    process.exit(16);
  }

  setInterval(() => {
    client.guilds.cache.each(g => g.members.fetch());
    client.user.setActivity(`${client.users.cache.size} users across ${client.guilds.cache.size} servers`, { type: "LISTENING" });
  }, 60000);
});

client.on("interactionCreate", async (interaction) => {
  if(!ready) return interactionEmbed(4, "", "The bot is starting up, please wait", interaction, client, [true, 10]);
  if(!interaction.inGuild()) return interactionEmbed(2, "[WARN-NODM]", "", interaction, client, [true, 10]);
  
  if(interaction.type === InteractionType.ApplicationCommand) {
    if(!warnedGuilds.includes(interaction.guild.id) && !interaction.channel.permissionsFor(interaction.guild.roles.everyone).has("UseExternalEmojis")) {
      warnedGuilds.push(interaction.guild.id);
      return interaction.reply({ content: "**Heads Up**\n> This bot uses external emojis and has detected that the `@everyone` role cannot use external emojis in this channel. In order for these to work properly, you must allow the `@everyone` role to use external emojis in this channel (Or across the entire server, which is a better solution). If you do not do this, some emojis may look weird when sent by the bot\n> \n> *This is a one-time message that is sent whenever the bot restarts. Re run your command and it'll work normally*" });
    }
    let command = client.commands.get(interaction.commandName);
    if(command) {
      const ack = command.run(client, interaction, interaction.options)
        .catch((e) => {
          interaction.editReply({ content: "Something went wrong while executing the command. Please report this to a developer", components: [] });
          return toConsole(e.stack, new Error().stack, client);
        });
      
      await wait(1e4);
      if(ack != null) return; // Already executed
      interaction.fetchReply()
        .then(m => {
          if(m.content === "" && m.embeds.length === 0) interactionEmbed(3, "[ERR-UNK]", "The command timed out and failed to reply in 10 seconds", interaction, client, [true, 15]);
        });
    }
  } if(interaction.type === InteractionType.ModalSubmit) {
    let modal = client.modals.get(interaction.customId);
    if(modal) {
      const ack = modal.run(client, interaction, interaction.fields)
        .catch((e) => {
          interaction.editReply({ content: "Something went wrong while executing the modal. Please report this to a developer", components: [] });
          return toConsole(e.stack, new Error().stack, client);
        });

      await wait(1e4);
      if(ack != null) return; // Already executed
      interaction.fetchReply()
        .then(m => {
          if(m.content === "" && m.embeds.length === 0) interactionEmbed(3, "[ERR-UNK]", "The modal timed out and failed to reply in 10 seconds", interaction, client, [true, 15]);
        });
    }
  } else if(interaction.type === InteractionType.MessageComponent) {
    return;
  }
});
//#endregion

client.login(config.bot.token);

//#region Error handling
process.on("uncaughtException", (err, origin) => {
  if(!ready) {
    console.warn("Exiting due to a [uncaughtException] during start up");
    console.error(err, origin);
    return process.exit(14);
  }
  toConsole(`An [uncaughtException] has occurred.\n\n> ${err}\n> ${origin}`, new Error().stack, client);
});
process.on("unhandledRejection", async (promise) => {
  if(!ready) {
    console.warn("Exiting due to a [unhandledRejection] during start up");
    console.error(promise);
    return process.exit(15);
  }
  if(process.env.environment === "development") return console.log(promise);
  const suppressChannel = await client.channels.fetch(config.discord.suppressChannel).catch(() => { return undefined; });
  if(!suppressChannel) return console.error(`An [unhandledRejection] has occurred.\n\n> ${promise}`);
  if(String(promise).includes("Interaction has already been acknowledged.") || String(promise).includes("Unknown interaction") || String(promise).includes("Unknown Message")) return suppressChannel.send(`A suppressed error has occured at process.on(unhandledRejection):\n>>> ${promise}`);
  toConsole(`An [unhandledRejection] has occurred.\n\n> ${promise}`, new Error().stack, client);
});
process.on("warning", async (warning) => {
  if(!ready) {
    console.warn("[warning] has occurred during start up");
    console.warn(warning);
  }
  toConsole(`A [warning] has occurred.\n\n> ${warning}`, new Error().stack, client);
});
process.on("exit", (code) => {
  console.error("[EXIT] The process is exiting!");
  console.error(`[EXIT] Code: ${code}`);
});
//#endregion