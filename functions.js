// eslint-disable-next-line no-unused-vars
const { Client, EmbedBuilder, Interaction, ActionRow, ButtonComponent, SelectMenuComponent, SelectMenuInteraction, SelectMenuOptionBuilder, ComponentType, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonInteraction } = require("discord.js");
// eslint-disable-next-line no-unused-vars
const { Sequelize, Op, Model } = require("sequelize");
const { discord } = require("./configs/config.json");

const errors = {
  "[ERR-SQL]": "Database error",
  "[ERR-CLD]": "Woah, slow down there! I can only eat so much information",
  "[ERR-UPRM]": "Sorry, but I can't allow you to do that. You don't have the proper permissions and no, a snack won't make me think otherwise",
  "[ERR-BPRM]": "I'm not allowed to do that! Check my permissions and I'll take a look again",
  "[ERR-ARGS]": "Please make sure you gave me the right food (args) to eat. I'm a little bit picky with what I eat",
  "[ERR-UNK]": "Unknown error occurred",
  "[ERR-MISS]": "Hmmm... I can't seem to find that",
  "[WARN-NODM]": "Sorry, I'm a guild-only gal. Please use commands in servers, not DMs, thanks!",
  "[WARN-CMD]": "I looked around for that tasty slash command and couldn't find it. Try refreshing your Discord",
  "[INFO-DEV]": "Hey, no stealing my early development snack! This is a feature in development, and not ready for the public to use yet"
};

module.exports = {
  /**
    * Sends buttons to a user and awaits the response
    * @param {Interaction} interaction Interaction object
    * @param {Number} time Seconds for which the buttons are valid
    * @param {Array<ButtonComponent>} buttons The buttons to place on the message
    * @param {String|null} content The content to display, can be blank
    * @param {Boolean} remove Delete the message after the time expires
    * @example awaitButtons(interaction, 15, [button1, button2], `Select a button`, true);
    * @returns {ButtonInteraction|null} The button the user clicked or null if no button was clicked
    */
  async awaitButtons(interaction, time, buttons, content, remove) {
    if(!interaction || !time || !buttons || remove === null) return new SyntaxError(`One of the following values is not fulfilled:\n> interaction: ${interaction}\n> time: ${time}\n> buttons: ${buttons}\n> remove: ${remove}`);
    content = content ?? "Please select an option";
  
    const filter = i => {
      return i.user.id === interaction.user.id;
    };
    time *= 1000;
  
    const row = new ActionRowBuilder();
    row.addComponents(buttons);
    const message = await interaction.followUp({ content, components: [row] });
    const res = await message
      .awaitMessageComponent({ filter, componentType: ComponentType.Button, time: time, errors: ["time"] })
      .catch(() => { return null; });
  
    if(message && remove && !message.ephemeral) message.delete();
    return res;
  },

  /**
   * Send a SelectMenuComponent to a user and awaits the response
   * @param {Interaction} interaction Interaction object
   * @param {Number} time Seconds for which the menu is valid
   * @param {Number[]} values [min, max] The amount of values that can be selected
   * @param {SelectMenuOptionBuilder|SelectMenuOptionBuilder[]} options The options for the menu
   * @param {String|null} content The content to display, can be blank
   * @param {Boolean} remove Delete the message after the time expires
   * @example awaitMenu(interaction, 15, [menu], `Select an option`, true);
   * @returns {SelectMenuInteraction|null} The menu the user interacted with or null if nothing was selected
   */
  async awaitMenu(interaction, time, values, options, content, remove) {
    // Step 0: Checks
    if(!interaction || !time || !values || !options || remove === null) return new SyntaxError(`One of the following values is not fulfilled:\n> interaction: ${interaction}\n> time: ${time}\n> values: ${values}\n> options: ${options}\n> remove: ${remove}`);
    content = content ?? "Please select an option";
  
    // Step 1: Setup
    const filter = i => {
      i.deferUpdate();
      return i.user.id === interaction.user.id;
    };
    time *= 1000;
  
    // Step 2: Creation
    const row = new ActionRow();
    const menu = new SelectMenuComponent({
      minValues: values[0],
      maxValues: values[1],
      customId: "await-menu"
    });
    menu.addOptions(options);
    row.addComponents(menu);
  
    // Step 3: Execution
    const message = await interaction.followUp({ content, components: [row] });
    const res = await message
      .awaitMessageComponent({ filter, componentType: ComponentType.SelectMenu, time: time, errors: ["time"] })
      .catch(() => { return null; });
  
    // Step 4: Processing
    row.components[0].setDisabled(true);
    // eslint-disable-next-line no-useless-escape
    await message.edit({ content: res === null ? "\:lock: Cancelled" : content, components: [row] });
  
    // Step 5: Cleanup
    setTimeout(() => {
      if(typeof message !== "undefined" && remove && res !== null) message.delete();
    }, 1500);
    await message.edit({ content, components: [] });
    return res;
  },

  /**
   * @description Replies with a EmbedBuilder to the Interaction
   * @param {Number} type 1- Sucessful, 2- Warning, 3- Error, 4- Information
   * @param {String} content The information to state
   * @param {String} expected The expected argument (If applicable)
   * @param {Interaction} interaction The Interaction object for responding
   * @param {Client} client Client object for logging
   * @param {Array<Boolean, Number>} remove Whether to delete the message and the specified timeout in seconds
   * @example interactionEmbed(1, `Removed ${removed} roles`, ``, interaction, client, [false, 0])
   * @example interactionEmbed(3, `[ERR-UPRM]`, `Missing: \`Manage Messages\``, interaction, client, [true, 15])
   * @returns {null} 
   */
  async interactionEmbed(type, content, expected, interaction, client, remove) {
    if(!type || typeof content !== "string" || typeof expected === "undefined" || !interaction || !client || !remove || remove.length !== 2) throw new SyntaxError(`One or more of the required parameters are missing in [interactionEmbed]\n\n> ${type}\n> ${content}\n> ${expected}\n> ${interaction}\n> ${client}`);
    if(!interaction.deferred) await interaction.deferReply();
    const embed = new EmbedBuilder();
  
    switch(type) {
    case 1:
      embed
        .setTitle("Success")
        .setAuthor({ name: interaction.user.username, iconURL: interaction.user.avatarURL({ dynamic: true, size: 4096 }) })
        .setColor(0x5865F2)
        .setDescription(!errors[content] ? expected : `${errors[content]}\n> ${expected}`)
        .setTimestamp();
    
      break;
    case 2:
      embed
        .setTitle("Warning")
        .setAuthor({ name: interaction.user.username, iconURL: interaction.user.avatarURL({ dynamic: true, size: 4096 }) })
        .setColor(0xFEE75C)
        .setDescription(!errors[content] ? expected : `${errors[content]}\n> ${expected}`)
        .setTimestamp();
    
      break;
    case 3:
      embed
        .setTitle("Error")
        .setAuthor({ name: interaction.user.username, iconURL: interaction.user.avatarURL({ dynamic: true, size: 4096 }) })
        .setColor(0xFF0000)
        .setDescription(!errors[content] ? `I don't understand the error \`${content}\` but was expecting \`${expected}\`.\n\n> Please report this to the developers! (Snack code: \`FNC-001\`)` : `${errors[content]}\n> ${expected}`)
        .setTimestamp();
    
      break;
    case 4:
      embed
        .setTitle("Information")
        .setAuthor({ name: interaction.user.username, iconURL: interaction.user.avatarURL({ dynamic: true, size: 4096 }) })
        .setColor(0x5865F2)
        .setDescription(!errors[content] ? expected : `${errors[content]}\n> ${expected}`)
        .setTimestamp();
    
      break;
    }
    await interaction.editReply({ content: "​", embeds: [embed] });
    if(remove[0]) setTimeout(() => { interaction.deleteReply(); }, remove[1]*1000);
    return null;
  },
  
  /**
   * @param {number} min Minimum a value can be
   * @param {number} max Maximum a value can be
   * @param {*} value The value to parse
   * @param {string} col Column name
   * @param {Sequelize} thisArg Variable to use as this
   * @returns {null} No value
   */
  minMaxValidator(min, max, value, col, thisArg) {
    if(max === false) max = Infinity;
    if(min === false) min = -Infinity;
    console.info(col, min, max, value);
    if(thisArg.getDataValue(col) + value >= max)
      return thisArg.setDataValue(col, max);
    else if(thisArg.getDataValue(col) + value <= min)
      return thisArg.setDataValue(col, min);
    else
      return thisArg.setDataValue(col, thisArg.getDataValue(col) + value);
  },

  /**
   * @param {String} time 
   * @returns {Number|"NaN"}
   */
  parseTime(time) {
    let duration = 0;
    if(!/[1-9]{1,3}[dhms]/g.test(time)) return "NaN";

    // skipcq: JS-D007
    for(const period of /[1-9]{1,3}[dhms]/g.exec(time)) {
      const [amount, unit] = /^(\d+)([dhms])$/.exec(period).slice(1); // skipcq: JS-D007
      duration += unit === "d" ? amount * 24 * 60 * 60 : unit === "h" ? amount * 60 * 60 : unit === "m" ? amount * 60 : amount;
    }

    return duration;
  },

  /**
   * @description Parses a string with {{var}} variables and substitutes them with values provided in values
   * @param {string} string Unfiltered string
   * @param {Array<string>} args Arguments to search and substitute
   * @param  {Array<string>} values Values to substitue in place of the variables
   * @example replaceVars("{{prey}} {{pred}}", ["prey", "pred"], ["Fox", "Wolf"]) // "{{prey}} {{pred}}" => "Fox Wolf"
   */
  replaceVars(string, args, values) {
    if(!string || !args || !values) throw new SyntaxError(`One or more of the required parameters are missing in [replaceVars]\n\n> ${string}\n> ${args}\n> ${values}`);
    if(args.length !== values.length) throw new SyntaxError(`The number of arguments and values do not match in [replaceVars]\n\n> ${args}\n> ${values}`);
    let newString = string;
    for(let i = 0; i < args.length; i++) {
      newString = newString.replace(new RegExp(`{{${args[i]}}}`, "g"), values[i]);
    }
    return newString;
  },

  /**
   * @description Sends a message to the console
   * @param {String} message The message to send to the console
   * @param {String} source Source of the message (Error.stack)
   * @param {Client} client A logged-in Client to send the message
   * @returns {null} null
   * @example toConsole(`Hello, World!`, new Error().stack, client);
   * @example toConsole(`Published a ban`, new Error().stack, client);
   */
  async toConsole(message, source, client) {
    if(!message || !source || !client) return {};
    const channel = await client.channels.cache.get(discord.logChannel);
    if(source.split("\n").length < 2) return {};
    source = source.split("\n")[1].trim().replace("at ", "").replaceAll("\\", "/");
    if(/^.+ \(.+\)/.test(source)) source = source.split("(")[1];
    // eslint-disable-next-line no-useless-escape
    source = source.split("/")[source.split("/").length - 1].replaceAll(":", "\:").replace(")", "");
    if(!channel) return {};

    await channel.send(`Incoming message from \`${source}\` at <t:${Math.floor(Date.now()/1000)}:F>`);
    const check = await channel.send({ embeds: [{
      title: "Message to Console",
      color: 0xDE2821,
      description: `${message ?? "No message. Please check the source for errors!"}`,
      footer: {
        text: `Source: ${source} @ ${new Date().toLocaleTimeString()} ${/GMT([+-]\d{2})(\d{2})/.exec(new Date().toString())[0]}` // skipcq: JS-D007
      },
      timestamp: new Date()
    }] })
      .then(() => { return false; })
      .catch(() => { return true; }); // Supress errors
    if(check) return {};

    return null;
  },

  /**
   * @async
   * @param {number} cId Character to check their digestions
   * @returns {Promise<Array<Model>>} Several updated models
   */
  async updateDigestions(cId) {
    const prey = await process.Character.findOne({ where: { cId } });
    if(!prey) return; // Character doesn't exist
    const digestion = await process.Digestion.findOne({ where: { prey: cId, status: { [Op.or]: ["Vored","Digesting"] } } });
    if(!digestion) return; // Character isn't being digested
    const stats = await process.Stats.findAll({ where: { character: { [Op.or]: [digestion.predator, digestion.prey] } }});
    let exhaustion = Math.floor((Date.now()-digestion.updatedAt.getTime())/3600000);
    if(exhaustion > 10) exhaustion = 10;
    const predStats = stats.filter(c => c.character === digestion.predator)[0];
    const preyStats = stats.filter(c => c.character === digestion.prey)[0];
    if(preyStats.updatedAt > new Date(Date.now()-21600)) return; // Old record not updated
    let health = 0;
    if((preyStats.arousal > (45 - predStats.resistance)) && (preyStats.euphoria - (preyStats.defiance*2)) < 50)
      return; // Too aroused to heal
    if(preyStats.defiance > predStats.digestion)
      health += 5;
    else if(preyStats.defiance === predStats.digestion)
      health += 3;
    else
      health += 1;
    if(preyStats.health === 115)
      health = 0; // Full health, can't regen
    if(preyStats.health + health > 115)
      health = 115 - preyStats.health;
    health = health * Math.floor((Date.now()-preyStats.updatedAt)/21600000);
    const p = [
      process.Stats.update({ updatedAt: new Date(), pExhaustion: preyStats.pExhaustion+exhaustion, health: preyStats.health+health }, { where: { character: prey.cId } }),
      process.Digestion.update({ updatedAt: new Date() }, { where: { dId: digestion.dId }})
    ];
    return Promise.all(p);
  },

  /**
   * @param {string} str String to capitalize the first letter on
   * @returns {string}
   */
  uppercaseFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  // -- //

  profileModals: {
    name: [
      new TextInputBuilder({
        custom_id: "name", placeholder: "Full name", label: "What is the character's name?", min_length: 3, max_length: 32, style: TextInputStyle.Short
      })
    ],
    role: [
      new TextInputBuilder({
        custom_id: "role", placeholder: "Apex Pred/Pred/Pred Switch/Switch/Prey Switch/Prey", label: "What is the character's vore role?", min_length: 4, max_length: 15, style: TextInputStyle.Short
      })
    ],
    description: [
      new TextInputBuilder({
        custom_id: "description", placeholder: "Description", label: "Describe this character", min_length: 3, max_length: 2048, style: TextInputStyle.Paragraph
      })
    ],
    gender: [
      new TextInputBuilder({
        custom_id: "gender", placeholder: "Gender", label: "What is your character's gender?", min_length: 3, max_length: 32, style: TextInputStyle.Short
      })
    ],
    species: [
      new TextInputBuilder({
        custom_id: "species", placeholder: "Species", label: "What is your character's species?", min_length: 3, max_length: 32, style: TextInputStyle.Short
      })
    ],
    autodigest: [
      new TextInputBuilder({
        custom_id: "autodigest", label: "Should your character autodigest prey?", placeholder: "Yes/No", min_length: 2, max_length: 3, style: TextInputStyle.Short
      })
    ]
  }
};