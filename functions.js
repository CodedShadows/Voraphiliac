// eslint-disable-next-line no-unused-vars
const { Client, EmbedBuilder, Interaction, ActionRow, ButtonComponent, SelectMenuComponent, SelectMenuInteraction, SelectMenuOptionBuilder, ComponentType, TextInputBuilder, TextInputStyle, TextInputComponent } = require("discord.js");
const config = require("./configs/config.json");

const errors = {
  "[ERR-SQL]": "An error has occurred while trying to execute a database query",
  "[ERR-CLD]": "You are on cooldown!",
  "[ERR-UPRM]": "You do not have the proper permissions to execute this command",
  "[ERR-BPRM]": "I do not have the proper permissions to execute this command",
  "[ERR-ARGS]": "You have not supplied the correct parameters. Please check again",
  "[ERR-UNK]": "I can't tell why an issue spawned. Please report this to a developer",
  "[ERR-MISS]": "I cannot find the information in the system",
  "[WARN-NODM]": "Sorry, but all slash commands only work in a server, not DMs",
  "[WARN-CMD]": "The requested slash command was not found",
  "[INFO-DEV]": "This command is in development. This should not be expected to work"
};

module.exports = {
  /**
   * @description Sends a message to the console
   * @param {String} message [REQUIRED] The message to send to the console
   * @param {String} source [REQUIRED] Source of the message (Error.stack)
   * @param {Client} client [REQUIRED] A logged-in Client to send the message
   * @returns {null} null
   * @example toConsole(`Hello, World!`, new Error().stack, client);
   * @example toConsole(`Published a ban`, new Error().stack, client);
   */
  async toConsole(message, source, client) {
    if(!message || !source || !client) return console.error(`One or more of the required parameters are missing.\n\n> message: ${message}\n> source: ${source}\n> client: ${client}`);
    const channel = await client.channels.cache.get(config.discord.logChannel);
    if(source.split("\n").length < 2) return console.error("[ERR] toConsole called but Error.stack was not used\n> Source: " + source);
    source = source.split("\n")[1].trim().replace("at ", "").replaceAll("\\", "/");
    if(/^.+ \(.+\)/.test(source)) source.split("(")[1];
    // eslint-disable-next-line no-useless-escape
    source = source.split("/")[source.split("/").length - 1].replaceAll(":", "\:").replace(")", "");
    if(!channel) return console.warn("[WARN] toConsole called but bot cannot find config.discord.devChannel\n", message, "\n", source);
    if(process.env.environment === "development") console.info(source, message);

    await channel.send(`Incoming message from \`${source}\` at <t:${Math.floor(Date.now()/1000)}:F>`);
    const check = await channel.send({ embeds: [{
      title: "Message to Console",
      color: 0xDE2821,
      description: `${message ?? "No message. Please check the source for errors!"}`,
      footer: {
        text: `Source: ${source} @ ${new Date().toLocaleTimeString()} ${/GMT([+-]\d{2})(\d{2})/.exec(new Date().toString())[0]}`
      },
      timestamp: new Date()
    }] })
      .then(() => { return false; })
      .catch(() => { return true; }); // Supress errors
    if(check) return console.error("[ERR] toConsole called but message failed to send");

    return null;
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
    if(!type || typeof content !== "string" || expected === undefined || !interaction || !client || !remove || remove.length !== 2) throw new SyntaxError(`One or more of the required parameters are missing in [interactionEmbed]\n\n> ${type}\n> ${content}\n> ${expected}\n> ${interaction}\n> ${client}`);
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
        .setDescription(!errors[content] ? `I don't understand the error \`${content}\` but was expecting \`${expected}\`.\n\n> Please report this to the support server!` : `${errors[content]}\n> ${expected}`)
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
    * Sends buttons to a user and awaits the response
    * @param {Interaction} interaction Interaction object
    * @param {Number} time Seconds for which the buttons are valid
    * @param {Array<ButtonComponent>} buttons The buttons to place on the message
    * @param {String|null} content The content to display, can be blank
    * @param {Boolean} remove Delete the message after the time expires
    * @example awaitButtons(interaction, 15, [button1, button2], `Select a button`, true);
    * @returns {ButtonComponent|null} The button the user clicked or null if no button was clicked
    */
  async awaitButtons(interaction, time, buttons, content, remove) {
    if(!interaction || !time || !buttons || remove === null) return new SyntaxError(`One of the following values is not fulfilled:\n> interaction: ${interaction}\n> time: ${time}\n> buttons: ${buttons}\n> remove: ${remove}`);
    content = content ?? "Please select an option";
    
    // Create a filter
    const filter = i => {
      return i.user.id === interaction.user.id;
    };
    // Convert the time to milliseconds
    time *= 1000;
    // Create a ActionRow and add the buttons
    const row = new ActionRow();
    row.addComponents(buttons);
    // Send a follow-up message with the buttons and await a response
    const message = await interaction.followUp({ content: content, components: [row] });
    const res = await message
      .awaitMessageComponent({ filter, componentType: ComponentType.Button, time: time, errors: ["time"] })
      .catch(() => { return null; });
    // Disable the buttons on row
    for(const button of row.components) {
      button.setDisabled(true);
    }
    // Step 5: Cleanup
    setTimeout(() => {
      if(message !== undefined && remove && res !== null) message.delete();
    }, 1500);
    await message.edit({ content: content, components: [] });
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
    const message = await interaction.followUp({ content: content, components: [row] });
    const res = await message
      .awaitMessageComponent({ filter, componentType: ComponentType.SelectMenu, time: time, errors: ["time"] })
      .catch(() => { return null; });

    // Step 4: Processing
    row.components[0].setDisabled(true);
    // eslint-disable-next-line no-useless-escape
    await message.edit({ content: res === null ? "\:lock: Cancelled" : content, components: [row] });

    // Step 5: Cleanup
    setTimeout(() => {
      if(message !== undefined && remove && res !== null) message.delete();
    }, 1500);
    await message.edit({ content: content, components: [] });
    return res;
  },
  /**
   * @param {String} time 
   * @returns {Number|"NaN"}
   */
  parseTime(time) {
    let duration = 0;
    if(!/[1-9]{1,3}[dhms]/g.test(time)) return "NaN";

    for(const period of /[1-9]{1,3}[dhms]/g.exec(time)) {
      const [amount, unit] = /^(\d+)([dhms])$/.exec(period).slice(1);
      duration += unit === "d" ? amount * 24 * 60 * 60 : unit === "h" ? amount * 60 * 60 : unit === "m" ? amount * 60 : amount;
    }

    return duration;
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