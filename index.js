const { Client, Collection, IntentsBitField, Partials } = require("discord.js");
const { REST } = require("@discordjs/rest");
const { Sequelize, Op } = require("sequelize");
const { Routes, InteractionType, ComponentType } = require("discord-api-types/v10");
const { interactionEmbed, toConsole } = require("./functions.js");
const config = require("./configs/config.json");
const responses = require("./configs/responses.json");
const rest = new REST({ version: 10 }).setToken(process.env.token);
const fs = require("node:fs");
const wait = require("node:util").promisify(setTimeout);
const warnedGuilds = [];
let ready = false,
  clientReady = false;

//#region Setup
// Database
const sequelize = new Sequelize(process.env.DBname, process.env.DBuser, process.env.DBpassword, {
  host: process.env.DBhost,
  dialect: "mysql",
  logging: {},
});
if(!fs.existsSync("./models")) {
  fs.mkdirSync("./models");
} else {
  const models = fs.readdirSync("models").filter(file => file.endsWith(".js"));
  for(const model of models) {
    try {
      const file = require(`./models/${model}`);
      file.import(sequelize);
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
      console.warn(`[CMD-LOAD] Unloaded: ${file}`);
      console.warn(`[CMD-LOAD] ${e}`);
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
      console.warn(`[MDL-LOAD] Unloaded: ${file}`);
      console.warn(`[MDL-LOAD] ${e}`);
    }
  }
  
  await wait(500); // Artificial wait to prevent instant sending

  try {
    // Refresh based on environment
    if(process.env.environment === "development") {
      await rest.get(
        Routes.applicationCommands(config.bot.applicationId)
      )
        .then(cmds => cmds.forEach((command) => {
          rest.delete(
            Routes.applicationCommand(config.bot.applicationId, command.id)
          );
        }));

      await rest.put(
        Routes.applicationGuildCommands(config.bot.applicationId, config.bot.guildId),
        { body: slashCommands }
      );
    } else {
      await rest.get(
        Routes.applicationGuildCommands(config.bot.applicationId, config.bot.guildId)
      )
        .then(cmds => cmds.forEach((command) => {
          rest.delete(
            Routes.applicationGuildCommand(config.bot.applicationId, config.bot.guildId, command.id)
          );
        }));
      
      await rest.put(
        Routes.applicationCommands(config.bot.applicationId),
        { body: slashCommands }
      );
    }
  } catch(error) {
    console.error("[APP-CMD] An error has occurred while attempting to refresh application commands.");
    console.error(`[APP-CMD] ${error}`);
  }
  
  ready = true;
  if(clientReady) toConsole("[READY] Commands **can** be received!", new Error().stack, client);
  clientReady = true;
})();
//#endregion

//#region Events
client.on("ready", async () => {
  toConsole(`[READY] Logged in as ${client.user.tag} (${client.user.id}) at <t:${Math.floor(Date.now()/1000)}:T>. Client ${ready ? "can" : "**cannot**"} receive commands!`, new Error().stack, client);
  clientReady = true;
  // Set the status to new Date();
  client.guilds.cache.each(g => g.members.fetch());
  client.user.setActivity(`${client.users.cache.size} users across ${client.guilds.cache.size} servers`, { type: "LISTENING" });

  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: process.env.environment === "development" });
  } catch(e) {
    console.warn("[DB] Failed validation");
    console.error(e);
    process.exit(16);
  }

  setInterval(() => {
    client.guilds.cache.each(g => g.members.fetch());
    client.user.setActivity(`${client.users.cache.size} users across ${client.guilds.cache.size} servers`, { type: "LISTENING" });

    // -- //

    client.models.Digestion.findAll({ where: { updatedAt: {[Op.lte]: new Date(Math.floor(Date.now()/1000)-21600) }} })
      .then((digestions) => {
        digestions.forEach(async (digestion) => {
          const prey = await client.models.Character.findAll({ where: { cId: digestion.prey } });
          const stats = await client.models.Status.findAll({ where: { character: { [Op.or]: [digestion.predator, digestion.prey] } }});
          const predStats = stats.filter(c => c.cId === digestion.predator);
          const preyStats = stats.filter(c => c.cId === digestion.prey);
          let health = 0;
          if((preyStats.arousal > (45 - predStats.resistance)) && (preyStats.euphoria - (preyStats.defiance*2)) < 50)
            return; // Too aroused to heal
          if(preyStats.defiance > predStats.digestion)
            health += 5;
          else if(preyStats.defiance === predStats.digestion)
            health += 3;
          else
            health += 1;
          if(prey.health === 115)
            health = 0; // Full health, can't regen
          if(prey.health + health > 115)
            health = 115 - prey.health;
          await client.models.Character.update({ health: prey.health + health }, { where: { cId: digestion.prey }});
        });
      });
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
      if(ack !== null) return; // Already executed
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
      if(ack !== null) return; // Already executed
      interaction.fetchReply()
        .then(m => {
          if(m.content === "" && m.embeds.length === 0) interactionEmbed(3, "[ERR-UNK]", "The modal timed out and failed to reply in 10 seconds", interaction, client, [true, 15]);
        });
    }
  } else if(interaction.type === InteractionType.MessageComponent && interaction.componentType === ComponentType.Button) {
    if(!/_(yes|no)/.test(interaction.customId)) return;
    await interaction.deferUpdate();
    const [type, answer] = interaction.customId.split("_");
    const regex = /\*Psst!\* ((?<preyName>.+) \(<@(?<preyDiscord>[0-9]{18,})>\)), .+ by ((?<predName>.+) \(<@(?<predDiscord>[0-9]{18,})>\))/;
    const { predName, predDiscord, preyName, preyDiscord } = regex.exec(interaction.message.content).groups;
    const prey = await client.models.Character.findOne({ where: { name: preyName } });
    if(interaction.user.id !== preyDiscord) return interaction.followUp({ content: "This is not your choice to make!", ephemeral: true });
    if((await interaction.guild.members.fetch(predDiscord).catch(() => { return null; })) === null) {
      if(prey.discordId !== preyDiscord) return; // User deleted character
      await client.models.Digestion.update({ status: "Free" }, { where: { status: "Voring", prey: prey.cId } });
      return interaction.editReply({ content: "*For some reason, you notice that your predator is gone. They must've left the server.*", components: [] });
    }
    if(answer === "yes") {
      const res = responses[type];
      const random = Math.floor(Math.random() * res.length);
      await client.models.Digestion.update({ status: "Vored" }, { where: { status: "Voring", prey: prey.cId }});
      return interaction.editReply({ content: res[random].replaceAll("{{prey}}", preyName).replaceAll("{{pred}}", predName), components: [] });
    } else {
      await client.models.Digestion.destroy({ where: { status: "Voring", prey: prey.cId }});
      return interaction.editReply({ content: `*Unfortunately, ${preyName} didn't consent and as such, they escaped from ${predName}. Maybe try a more willing prey?*`, components: [] });
    }
  } else if(interaction.type === InteractionType.MessageComponent) {
    return;
  }
});
//#endregion

client.login(process.env.token);

//#region Error handling
process.on("uncaughtException", (err, origin) => {
  if(!ready)
    return process.exit(14);
  toConsole(`An [uncaughtException] has occurred.\n\n> ${err}\n> ${origin}`, new Error().stack, client);
});
process.on("unhandledRejection", async (promise) => {
  if(!ready)
    return process.exit(15);
  if(process.env.environment === "development") return {};
  const suppressChannel = await client.channels.fetch(config.discord.suppressChannel).catch(() => { return undefined; });
  if(!suppressChannel) return {};
  if(String(promise).includes("Interaction has already been acknowledged.") || String(promise).includes("Unknown interaction") || String(promise).includes("Unknown Message")) return suppressChannel.send(`A suppressed error has occured at process.on(unhandledRejection):\n>>> ${promise}`);
  toConsole(`An [unhandledRejection] has occurred.\n\n> ${promise}`, new Error().stack, client);
});
process.on("warning", async (warning) => {
  toConsole(`A [warning] has occurred.\n\n> ${warning}`, new Error().stack, client);
});
//#endregion