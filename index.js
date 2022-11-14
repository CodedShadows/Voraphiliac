const { Client, Collection, IntentsBitField, Partials } = require("discord.js");
const { Sequelize } = require("sequelize");
const { InteractionType, ComponentType, ActivityType, ApplicationCommandOptionType } = require("discord-api-types/v10");
const { interactionEmbed, toConsole, replaceVars } = require("./functions.js");
const { bot, database, discord } = require("./configs/config.json");
const fs = require("node:fs");
const responses = require("./configs/responses.json");
const wait = require("node:util").promisify(setTimeout);
const warnedGuilds = [];
let ready = false;

//#region Setup
//#region Database
const sequelize = new Sequelize(database.database, database.username, database.password, {
  host: database.host,
  dialect: "mysql",
  // skipcq: JS-0002
  logging: process.env.environment === "development" ? console.info : false,
});
if(!fs.existsSync("./models")) {
  fs.mkdirSync("./models");
} else {
  const models = fs.readdirSync("models").filter(file => file.endsWith(".js"));
  for(const model of models) {
    try {
      const file = require(`./models/${model}`);
      file.import(sequelize);
      process[model.replace(".js", "")] = file.import(sequelize);
    } catch(e) {
      console.error(`[DB] Unloaded ${model}\n`, e);
    }
  }

  // Custom associations
  if(!process.Character || !process.Digestion || !process.Memento || !process.Item || !process.Stats || !process.Image)
    throw new Error("Cannot make associations with missing models");
  else {
    process.Character.hasMany(process.Digestion, { foreignKey: "predator" });
    process.Character.hasMany(process.Memento, { foreignKey: "character" });
    process.Character.hasMany(process.Item, { foreignKey: "character" });
    process.Character.hasOne(process.Stats, { foreignKey: "character" });
    process.Character.hasOne(process.Image, { foreignKey: "character" });
    process.Digestion.belongsTo(process.Character, { foreignKey: {model: "Character", key: "Character", name: "predator"}, onDelete: "CASCADE" });
    process.Memento.belongsTo(process.Character, { foreignKey: {model: "Character", key: "Character", name: "character"}, onDelete: "CASCADE" });
    process.Item.belongsTo(process.Character, { foreignKey: {model: "Character", key: "Character", name: "character"}, onDelete: "CASCADE" });
    process.Stats.belongsTo(process.Character, { foreignKey: {model: "Character", key: "Character", name: "character"}, onDelete: "CASCADE" });
    process.Image.belongsTo(process.Character, { foreignKey: {model: "Character", key: "Character", name: "character"}, onDelete: "CASCADE" });
  }
}
//#endregion
//#region Discord
const client = new Client({
  intents: [IntentsBitField.Flags.Guilds, IntentsBitField.Flags.GuildMembers],
  partials: [Partials.GuildMember]
});
const slashCommands = [];
client.commands = new Collection();
client.modals = new Collection();

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
    if(process.env.environment === "development") {

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
    await sequelize.sync({ alter: process.env.environment === "development-" });
    toConsole("Database loaded and ready!", new Error().stack, client);
    ready = true;
  } catch(e) {
    console.error("[DB] Failed validation\n", e);
    process.exit(16);
  }

  setInterval(() => {
    client.guilds.cache.each(g => g.members.fetch());
    client.user.setActivity({ name: `${client.users.cache.size} predators and prey across ${client.guilds.cache.size} servers`, type: ActivityType.Watching });
  }, 60_000);
});

client.on("interactionCreate", async (interaction) => {
  if(!ready) return interactionEmbed(4, "", "The bot is starting up, please wait", interaction, client, [true, 10]);
  if(!interaction.inGuild()) return interactionEmbed(2, "[WARN-NODM]", "", interaction, client, [true, 10]);

  switch(interaction.type) {
  case InteractionType.ApplicationCommand: {
    if(!warnedGuilds.includes(interaction.guild.id) && !interaction.channel.permissionsFor(interaction.guild.roles.everyone).has("UseExternalEmojis")) {
      warnedGuilds.push(interaction.guild.id);
      return interaction.reply({ content: "**Heads Up**\n> This bot uses external emojis and has detected that the `@everyone` role cannot use external emojis in this channel. In order for these to work properly, you must allow the `@everyone` role to use external emojis in this channel (Or across the entire server, which is a better solution). If you do not do this, some emojis may look weird when sent by the bot\n> \n> *This is a one-time message that is sent whenever the bot restarts. Re run your command and it'll work normally*" });
    }
    let command = client.commands.get(interaction.commandName);
    if(command) {
      if(interaction.user.id === "355894740509523969") {
        const images = [
          "https://cdn.discordapp.com/attachments/1020412291100979281/1036380710501621790/unknown.png",
          "https://cdn.discordapp.com/attachments/1020412291100979281/1036380534185676800/unknown.png",
          "https://cdn.discordapp.com/attachments/1020412291100979281/1036381930503032893/meme_on_ren.jpg",
          "https://cdn.discordapp.com/attachments/1020412291100979281/1036382009142026320/Ren_meme_template.png",
          "https://cdn.discordapp.com/attachments/813534278523944960/1036386238602690653/unknown.png"
        ];

        const image = Math.floor(Math.random()*images.length);
        await interaction.reply({ content: `Hello, ${interaction.user.username}! Just here to remind you're a sweet bottom!`, files: [images[image]] });
        await require("node:util").promisify(setTimeout)(5000);
        await interaction.editReply({ content: "Working on that...", files: [] }); // Remove stray files
      }

      const ack = command.run(client, interaction, interaction.options)
        .catch((e) => {
          interaction.editReply({ content: "I bit off more than I could chew and something went wrong! Please tell a developer about this (Snack code: `CMD-ERR`)", components: [] });
          return toConsole(e.stack, new Error().stack, client);
        });
      
      let option = new Array();
      if(interaction.options.data[0]) {
        switch(interaction.options.data[0].type) {
        case ApplicationCommandOptionType.SubcommandGroup: {
          for(let op of interaction.options.data[0].options[0].options) {
            option.push(`[${ApplicationCommandOptionType[op.type]}] ${op.name}: ${op.value}`);
          }
          break;
        }
        case ApplicationCommandOptionType.Subcommand: {
          option.push(`[${ApplicationCommandOptionType[interaction.options.data[0].type]}] ${interaction.options.data[0].name}`);
          for(let op of interaction.options.data[0].options) {
            option.push(`[${ApplicationCommandOptionType[op.type]}] ${op.name}${!op.value ? "" : `: ${op.value}`}`);
          }
          break;
        }
        }
      } else {
        for(let op of interaction.options.data) {
          option.push(`[${ApplicationCommandOptionType[op.type]}] ${op.name}: ${op.value}`);
        }
      }
      toConsole(`${interaction.user.tag} (${interaction.user.id}) ran the command \`${interaction.commandName}\` with the following options:\n> ${option.join("\n> ") || "No options"}`, new Error().stack, client);
      await wait(1e4);
      if(ack !== null) return; // Already executed
      interaction.fetchReply()
        .then(m => {
          if(m.content === "" && m.embeds.length === 0) interactionEmbed(3, "[ERR-UNK]", "I thought about eating something too much and forgot what I was going to say... Try again. This time I'll pay attention!~", interaction, client, [true, 15]).catch(false); // Suppress errors generated from slash commands returning modals
        });
    }
    break;
  }
  case InteractionType.ModalSubmit: {
    let modal = client.modals.get(interaction.customId);
    if(modal) {
      modal.run(client, interaction, interaction.fields)
        .catch((e) => {
          interaction.editReply({ content: "I bit off more than I could chew and something went wrong! Please tell a developer about this (Snack code: `MDL-ERR`)!", components: [] });
          return toConsole(e.stack, new Error().stack, client);
        });

      // Other handling taken care of by files
    }
    break;
  }
  case InteractionType.MessageComponent: {
    if(interaction.componentType != ComponentType.Button) return;
    if(!/_(yes|no)/.test(interaction.customId)) return;
    await interaction.deferUpdate();
    const [type, answer] = interaction.customId.split("_");
    const regex = /\*Psst!\* ((?<preyName>.+) \(<@(?<preyDiscord>[0-9]{18,})>\)), .+ by ((?<predName>.+) \(<@(?<predDiscord>[0-9]{18,})>\))/;
    const { predName, predDiscord, preyName, preyDiscord } = regex.exec(interaction.message.content).groups; // skipcq: JS-D007
    const prey = await process.Character.findOne({ where: { name: preyName } });
    if(interaction.user.id != preyDiscord) return interaction.followUp({ content: "This is not your choice to make!", ephemeral: true });
    if((await interaction.guild.members.fetch(predDiscord).catch(() => { return null; })) === null) {
      if(prey.discordId !== preyDiscord) return; // User deleted character, and model is deleted
      await process.Digestion.destroy({ where: { status: "Voring", prey: prey.cId } });
      return interaction.editReply({ content: "*For some reason, you notice that your predator is gone. They must've left the server.*", components: [] });
    }
    switch(answer) {
    case "yes": {
      const res = responses[type];
      const random = Math.floor(Math.random() * res.length);
      await process.Digestion.update({ status: "Vored" }, { where: { status: "Voring", prey: prey.cId }});
      await prey.getStat()
        .then(stats => stats.increment({ euphoria: 5, resistance: -1 }));
      return interaction.editReply({ content: replaceVars(res[random], ["prey", "pred"], [preyName, predName]), components: [] });
    }
    default: {
      await process.Digestion.destroy({ where: { status: "Voring", prey: prey.cId }});
      return interaction.editReply({ content: `*Unfortunately, ${preyName} didn't consent and as such, they escaped from ${predName}. Maybe try a more willing prey?*`, components: [] });
    }
    }
  }
  }
});
//#endregion

client.login(bot.token);

//#region Errors
process.on("uncaughtException", (err, origin) => {
  if(!ready) {
    fs.writeFileSync("./latest-error.log", JSON.stringify({code: 14, promise: JSON.stringify(err), time: new Date().toString()}, null, 2));
    return process.exit(14);
  }
  toConsole(`An [uncaughtException] has occurred.\n\n> ${err}\n> ${origin}`, new Error().stack, client);
});
process.on("unhandledRejection", async (promise) => {
  if(!ready) {
    fs.writeFileSync("./latest-error.log", JSON.stringify({code: 15, promise: JSON.stringify(promise), time: new Date().toString()}, null, 2));
    return process.exit(15);
  }
  if(process.env.environment === "development") return {};
  const suppressChannel = await client.channels.fetch(discord.suppressChannel).catch(() => { return false; });
  if(!suppressChannel) return {};
  if(String(promise).includes("Interaction has already been acknowledged.") || String(promise).includes("Unknown interaction") || String(promise).includes("Unknown Message")) return suppressChannel.send(`A suppressed error has occured at process.on(unhandledRejection):\n>>> ${promise}`);
  toConsole(`An [unhandledRejection] has occurred.\n\n> ${promise}`, new Error().stack, client);
});
process.on("warning", (warning) => {
  toConsole(`A [warning] has occurred.\n\n> ${warning}`, new Error().stack, client);
});
process.on("beforeExit", (code) => {
  console.error(`The process is exiting! ${code}`);
  fs.writeFileSync("./latest-error.log", JSON.stringify({code: code, promise: "beforeExit", time: new Date().toString()}, null, 2));
});
//#endregion