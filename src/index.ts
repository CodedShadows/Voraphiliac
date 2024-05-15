import { Client, Collection, CommandInteraction, IntentsBitField, Interaction, MessageComponentInteraction, ModalSubmitInteraction, Options, Partials } from "discord.js";
import { Character } from "./typings/Models";
import { CustomProcess, CustomClient } from "./typings/Extensions";
import { Sequelize } from "sequelize";
import { InteractionType, ActivityType, ApplicationCommandOptionType, Snowflake } from "discord-api-types/v10";
import { interactionEmbed, toConsole, replaceVars } from "./functions.js";
import * as fs from "node:fs";
import * as responses from "./configs/responses.json";
import { bot, database, discord } from "./configs/config.json";
const wait = require("node:util").promisify(setTimeout);
const warnedGuilds: Snowflake[] = [];
const customProcess: CustomProcess = process;
let ready: boolean = false;

//#region Setup
//#region Database
const sequelize = new Sequelize(database.database, database.username, database.password, {
  host: database.host,
  dialect: "mysql",
  logging: customProcess.env.environment === "development" ? console.debug : false // skipcq: JS-0002
});
if(!fs.existsSync("./models")) fs.mkdirSync("./models");
const models = fs.readdirSync("./models").filter(file => file.endsWith(".js"));
for(const model of models) {
  try {
    const file = require(`./models/${model}`);
    file.import(sequelize);
    customProcess[model.replace(".js", "")] = file.import(sequelize);
    console.info(`[DB] Loaded ${model}`);
  } catch(e) {
    console.error(`[DB] Unloaded ${model}\n`, e);
  }
}

// Custom associations
if(!customProcess.Character || !customProcess.Digestion || !customProcess.Memento || !customProcess.Item || !customProcess.Stats || !customProcess.Image)
  throw new ReferenceError("Cannot make associations with missing models");
else {
  sequelize.models.Character.hasMany(sequelize.models.Digestion, { foreignKey: "predator" });
  sequelize.models.Character.hasMany(sequelize.models.Memento, { foreignKey: "characterId" });
  sequelize.models.Character.hasMany(sequelize.models.Item, { foreignKey: "characterId" });
  sequelize.models.Character.hasOne(sequelize.models.Stats, { foreignKey: "characterId" });
  sequelize.models.Character.hasOne(sequelize.models.Image, { foreignKey: "characterId" });
  sequelize.models.Digestion.belongsTo(sequelize.models.Character, { foreignKey: "predator" });
  sequelize.models.Memento.belongsTo(sequelize.models.Character, { foreignKey: "characterId" });
  sequelize.models.Item.belongsTo(sequelize.models.Character, { foreignKey: "characterId" });
  sequelize.models.Stats.belongsTo(sequelize.models.Character, { foreignKey: "characterId" });
  sequelize.models.Image.belongsTo(sequelize.models.Character, { foreignKey: "characterId" });
}
//#endregion
//#region Discord
const client: CustomClient = new Client({
  intents: [IntentsBitField.Flags.Guilds, IntentsBitField.Flags.GuildMembers],
  partials: [Partials.GuildMember]
});
const slashCommands = [];
client.commands = new Collection();
client.modals = new Collection();
// Database extensions
client.sequelize = sequelize;
client.models = sequelize.models;

(async () => {
  if(!fs.existsSync("./commands")) return {};
  const commands = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));

  for(let file of commands) {
    try {
      let command = require(`./commands/${file}`);
      if(command.name) {
        slashCommands.push(command.data.toJSON());
        client.commands.set(command.name, command);
      }
    } catch(e) {
      console.warn(`[CMD-LOAD] Unloaded: ${file}\n`, e);
    }
  }

  if(!fs.existsSync("./modals")) await fs.mkdirSync("./modals");
  const modals = fs.readdirSync("./modals").filter(file => file.endsWith(".js"));

  for(let file of modals) {
    try {
      let modal = require(`./modals/${file}`);
      if(modal.name)
        client.modals.set(modal.name, modal);
    } catch(e) {
      console.warn(`[MDL-LOAD] Unloaded: ${file}\n`, e);
    }
  }
})();
//#endregion
//#endregion
//#region Events
client.on("ready", async () => {
  client.guilds.cache.each(g => g.members.fetch());
  client.user.setActivity({ name: `${client.users.cache.size} predators and prey across ${client.guilds.cache.size} servers`, type: ActivityType.Watching });
  try {
    if(customProcess.env.environment === "development") {

      await client.application.commands.set(slashCommands, bot.guildId);
    } else {
      await client.application.commands.set(slashCommands);
      await client.guilds.fetch(bot.guildId)
        .then(g => g.commands.set([]));
    }
  } catch(error) {
    console.error("[APP-CMD] An error has occurred while attempting to refresh application commands.\n", error);
  }
  toConsole(`[READY] Logged in as ${client.user.tag} (${client.user.id}) at <t:${Math.floor(Date.now()/1000)}:T>. Client can receive commands!`, new Error().stack, client);

  try {
    ready = false;
    await sequelize.authenticate();
    await sequelize.sync({ alter: customProcess.env.environment === "development-" });
    toConsole("Database loaded and ready!", new Error().stack, client);
    ready = true;
  } catch(e) {
    console.error("[DB] Failed validation\n", e);
    customProcess.exit(16);
  }

  setInterval(() => {
    client.guilds.cache.each(g => g.members.fetch());
    client.user.setActivity({ name: `${client.users.cache.size} predators and prey across ${client.guilds.cache.size} servers`, type: ActivityType.Watching });
  }, 60_000);
});
// skipcq: JS-0044
client.on("interactionCreate", async (interaction: Interaction<"raw">) => {
  if(!ready) return (interactionEmbed(4, "", "The bot is starting up, please wait", (interaction as CommandInteraction|ModalSubmitInteraction), client, [true, 10]) as any);
  if(!interaction.inGuild()) return interactionEmbed(2, "[WARN-NODM]", "", interaction, client, [true, 10]);

  switch(interaction.type) {
  case InteractionType.ApplicationCommand: {
    const commandInteraction: CommandInteraction = interaction;
    if(!warnedGuilds.includes(commandInteraction.guild.id) && !commandInteraction.channel.permissionsFor(commandInteraction.guild.roles.everyone).has("UseExternalEmojis")) {
      warnedGuilds.push(commandInteraction.guild.id);
      return commandInteraction.reply({ content: "**Heads Up**\n> This bot uses external emojis and has detected that the `@everyone` role cannot use external emojis in this channel. In order for these to work properly, you must allow the `@everyone` role to use external emojis in this channel (Or across the entire server, which is a better solution). If you do not do this, some emojis may look weird when sent by the bot\n> \n> *This is a one-time message that is sent whenever the bot restarts. Re run your command and it'll work normally*" });
    }
    let command = client.commands.get(commandInteraction.commandName);
    if(command) {
      const ack = command.run(client, commandInteraction, commandInteraction.options)
        .catch((e) => {
          commandInteraction.editReply({ content: "I bit off more than I could chew and something went wrong! Please tell a developer about this (Snack code: `CMD-ERR`)", components: [] });
          return toConsole(e.stack, new Error().stack, client);
        });

      let option: Options[] = new Array();
      if(commandInteraction.options.data[0]) {
        switch(commandInteraction.options.data[0].type) {
        case ApplicationCommandOptionType.SubcommandGroup: {
          for(let op of commandInteraction.options.data[0].options[0].options) {
            option.push(`[${ApplicationCommandOptionType[op.type]}] ${op.name}: ${op.value}`);
          }
          break;
        }
        case ApplicationCommandOptionType.Subcommand: {
          option.push(`[${ApplicationCommandOptionType[commandInteraction.options.data[0].type]}] ${commandInteraction.options.data[0].name}`);
          for(let op of commandInteraction.options.data[0].options) {
            option.push(`[${ApplicationCommandOptionType[op.type]}] ${op.name}${!op.value ? "" : `: ${op.value}`}`);
          }
          break;
        }
        }
      } else {
        for(let op of commandInteraction.options.data) {
          option.push(`[${ApplicationCommandOptionType[op.type]}] ${op.name}: ${op.value}`);
        }
      }
      toConsole(`${commandInteraction.user.tag} (${commandInteraction.user.id}) ran the command \`${commandInteraction.commandName}\` with the following options:\n> ${option.join("\n> ") || "No options"}`, new Error().stack, client);
      await wait(1e4);
      if(ack !== null) return; // Already executed
      commandInteraction.fetchReply()
        .then(m => {
          if(m.content === "" && m.embeds.length === 0) interactionEmbed(3, "[ERR-UNK]", "I thought about eating something too much and forgot what I was going to say... Can you try again. This time I'll pay attention!~", commandInteraction, client, [true, 15]).catch(); // Suppress errors generated from slash commands returning modals
        });
    }
    break;
  }
  case InteractionType.ModalSubmit: {
    const modalInteraction: ModalSubmitInteraction = interaction;
    let modal = client.modals.get(modalInteraction.customId);
    if(modal) {
      try {
        modal.run(client, modalInteraction, modalInteraction.fields);
      } catch(e) {
        modalInteraction.editReply({ content: "I bit off more than I could chew and something went wrong! Please tell a developer about this (Snack code: `MDL-ERR`)!", embeds: [], components: [] });
        return toConsole(e.stack, new Error().stack, client);
      }
      // Other handling taken care of by files
    }
    break;
  }
  case InteractionType.MessageComponent: {
    const messageInteraction: MessageComponentInteraction = interaction;
    if(!/_(yes|no)/.test(messageInteraction.customId)) return;
    await messageInteraction.deferUpdate();
    const [type, answer] = messageInteraction.customId.split("_");
    const regex = /\*Psst!\* ((?<preyName>.+) \(<@(?<preyDiscord>[0-9]{18,})>\)), .+ by ((?<predName>.+) \(<@(?<predDiscord>[0-9]{18,})>\))/;
    const { predName, predDiscord, preyName, preyDiscord } = regex.exec(messageInteraction.message.content).groups; // skipcq: JS-D007
    const prey: Character = await sequelize.models.Character.findOne({ where: { name: preyName } });
    if(String(messageInteraction.user.id) !== String(preyDiscord)) return messageInteraction.followUp({ content: "This is not your choice to make!", ephemeral: true });
    if((await messageInteraction.guild.members.fetch(predDiscord).catch(() => { return null; })) === null) {
      if(prey.discordId !== preyDiscord) return; // User deleted character, and model is deleted
      await sequelize.models.Digestion.destroy({ where: { status: "Voring", prey: prey.characterId } });
      return messageInteraction.editReply({ content: "*For some reason, you notice that your predator is gone. They must've left the server.*", components: [] });
    }
    switch(answer) {
    case "yes": {
      const res = responses[type];
      const random = Math.floor(Math.random() * res.length);
      await sequelize.models.Digestion.update({ status: "Vored" }, { where: { status: "Voring", prey: prey.characterId }});123
      await prey.getStat()
        .then(stats => stats.update({ euphoria: stats.euphoria+5, resistance: stats.resistance-1 }));
      return messageInteraction.editReply({ content: replaceVars(res[random], ["prey", "pred"], [preyName, predName]), components: [] });
    }
    default: {
      await sequelize.models.Digestion.destroy({ where: { status: "Voring", prey: prey.characterId }});
      return messageInteraction.editReply({ content: `*Unfortunately, ${preyName} didn't consent and as such, they escaped from ${predName}. Maybe try a more willing prey?*`, components: [] });
    }
    }
  }
  }
});
//#endregion

client.login(bot.token);
process = customProcess; // Add custom methods to process

//#region Errors
const recentErrors = [];
customProcess.on("uncaughtException", (err, origin) => {
  fs.writeFileSync("./latest-error.log", JSON.stringify({code: 14, promise: JSON.stringify(err)+" <--> "+JSON.stringify(origin), time: new Date().toString()}, null, 2));
  if(!ready) return customProcess.exit(14);
});
customProcess.on("unhandledRejection", async (promise) => {
  // Anti-spam System
  if(recentErrors.length > 2) {
    recentErrors.push({ promise: String(promise), time: new Date() });
    recentErrors.shift();
  } else {
    recentErrors.push({ promise: String(promise), time: new Date() });
  }
  if(recentErrors.length === 3
    && (recentErrors[0].promise === recentErrors[1].promise && recentErrors[1].promise === recentErrors[2].promise)
    && recentErrors[0].time.getTime() - recentErrors[2].time.getTime() < 1e4) {
    fs.writeFileSync("./latest-error.log", JSON.stringify({code: 15, info: {source: "Anti spam triggered! Three errors with the same content have occurred recently", promise}, time: new Date().toString()}, null, 2));
    return customProcess.exit(17);
  }

  if(!ready) {
    console.error(promise); // skipcq: JS-0002
    fs.writeFileSync("./latest-error.log", JSON.stringify({code: 15, promise: JSON.stringify(promise), time: new Date().toString()}, null, 2));
    return customProcess.exit(15);
  }
  if(process.env.environment && process.env.environment.includes("development")) return {};
  const suppressChannel = await client.channels.fetch(discord.suppressChannel);
  if(!suppressChannel || !suppressChannel.isTextBased()) return {};
  if(String(promise).includes("Interaction has already been acknowledged.") || String(promise).includes("Unknown interaction") || String(promise).includes("Unknown Message")) return suppressChannel.send(`A suppressed error has occured at customProcess.on(unhandledRejection):\n>>> ${promise}`);
  toConsole(`An [unhandledRejection] has occurred.\n\n> ${promise}`, new Error().stack, client);
});
customProcess.on("warning", (warning) => {
  toConsole(`A [warning] has occurred.\n\n> ${warning}`, new Error().stack, client);
});
customProcess.on("beforeExit", (code) => {
  console.error(`The process is exiting! ${code}`);
  fs.writeFileSync("./latest-error.log", JSON.stringify({code: code, promise: "beforeExit", time: new Date().toString()}, null, 2));
});
//#endregion