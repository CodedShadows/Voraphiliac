// eslint-disable-next-line no-unused-vars
const { SlashCommandBuilder, Client, CommandInteraction, CommandInteractionOptionResolver, ComponentType, ModalBuilder, ActionRowBuilder, SelectMenuBuilder, SelectMenuOptionBuilder, EmbedBuilder, ButtonStyle, ButtonBuilder, parseEmoji } = require("discord.js");
const { emojis } = require("../configs/config.json");
const { profileModals, awaitButtons, toConsole, uppercaseFirst } = require("../functions.js");
const { new_profile_1, edit_image } = require("../configs/modals.js");
const { default: fetch } = require("node-fetch");
const { Op } = require("sequelize");

function shortenText(text) {
  if(text.length > 1024)
    return text.slice(0, 1021) + "...";
  return text;
}

module.exports = {
  name: "profile",
  data: new SlashCommandBuilder()
    .setName("profile")
    .setDescription("Manages your profile")
    .addSubcommand(command => {
      return command
        .setName("new")
        .setDescription("Creates a new character");
    })
    .addSubcommand(command => {
      return command
        .setName("edit")
        .setDescription("Edits your character profile");
    })
    .addSubcommand(command => {
      return command
        .setName("switch")
        .setDescription("Switches the active character")
        .addStringOption(option => {
          return option
            .setName("character")
            .setDescription("The name of the character you want to switch to")
            .setRequired(true);
        });
    })
    .addSubcommand(command => {
      return command
        .setName("list")
        .setDescription("Lists all characters registered to you or a user")
        .addUserOption(option => {
          return option
            .setName("user")
            .setDescription("The user to list characters for");
        })
        .addStringOption(option => {
          return option
            .setName("search")
            .setDescription("The name to search for");
        });
    })
    .addSubcommand(command => {
      return command
        .setName("view")
        .setDescription("Shows the currently active character");
    })
    .addSubcommand(command => {
      return command
        .setName("delete")
        .setDescription("Deletes a character")
        .addStringOption(option => {
          return option
            .setName("character")
            .setDescription("The character you want to delete")
            .setRequired(true);
        });
    }),
  /**
   * @param {Client} client
   * @param {CommandInteraction} interaction
   * @param {CommandInteractionOptionResolver} options
   */
  run: async (client, interaction, options) => {
    const row = new ActionRowBuilder();
    let subcommand = options.getSubcommand();
    let character = await client.models.Character.findOne({ where: { discordId: interaction.user.id, active: true } });
    if(!/(new)/.test(subcommand)) await interaction.deferReply({ ephemeral: !/(view|list)/.test(subcommand) });
    const filter = (i) => i.user.id === interaction.user.id; 

    // Find details on specific character
    if(subcommand === "list" && options.getString("search") !== undefined) {
      subcommand = "view";
      const characters = await client.models.Character.findAll({ where: { name: { [Op.substring]: "%" + options.getString("search") + "%" }, discordId: options.getUser("user") ? options.getUser("user").id : interaction.user.id } });
      if(characters.length === 0)
        subcommand = "list";
      else {
        const active = await client.models.Character.findOne({ where: { discordId: characters[0].discordId, name: characters[0].name } });
        if(!active)
          subcommand = "list";
        else
          character = active;
      }
    }

    if(subcommand === "new") {
      return interaction.showModal(new_profile_1);
    } else if(subcommand === "edit") {
      if(!character) return interaction.editReply({ content: `${emojis.failure} | You need an active character to use this command` });
      row.setComponents(
        new SelectMenuBuilder({ min_values: 1, max_values: 1, custom_id: "options" }).setOptions(
          new SelectMenuOptionBuilder({ custom_id: "images", value: "images", label: "Images", description: "Change your character's images" }),
          new SelectMenuOptionBuilder({ custom_id: "name", value: "name", label: "Name", description: "Changes the name of your character" }),
          new SelectMenuOptionBuilder({ custom_id: "role", value: "role", label: "Role", description: "Sets the vore role of your character" }),
          new SelectMenuOptionBuilder({ custom_id: "description", value: "description", label: "Description", description: "Set the description of your character" }),
          new SelectMenuOptionBuilder({ custom_id: "gender", value: "gender", label: "Gender", description: "Sets the gender of your character" }),
          new SelectMenuOptionBuilder({ custom_id: "species", value: "species", label: "Species", description: "Sets the species of your character" }),
          new SelectMenuOptionBuilder({ custom_id: "whitelist", value: "whitelist", label: "Whitelist", description: "Set the only types of vore your character will do" }),
          new SelectMenuOptionBuilder({ custom_id: "blacklist", value: "blacklist", label: "Blacklist", description: "Set the types of vore your character will not do" }),
          new SelectMenuOptionBuilder({ custom_id: "autodigest", value: "autodigest", label: "Automatic Digestion", description: "Change your automatic digestion setting" })
        )
      );
      let message = await interaction.editReply({ content: "Please select what you want to edit", components: [row] });
      const option = await message
        .awaitMessageComponent({ filter, componentType: ComponentType.SelectMenu, time: 15_000 })
        .catch(() => { return undefined; });
      
      if(!option) return interaction.editReply({ content: "You took too long to respond", components: [] });
      if(/(whitelist|blacklist|images)/.test(option.values[0])) {
        await option.deferReply();
        await option.deleteReply();
      }
      switch(option.values[0]) {
      case "whitelist": {
        row.setComponents(
          new SelectMenuBuilder({ min_values: 1, max_values: 5, custom_id: "menu" }).addOptions(
            new SelectMenuOptionBuilder({ custom_id: "anal", value: "anal", label: "Anal", description: "Anal vore" }),
            new SelectMenuOptionBuilder({ custom_id: "breast", value: "breast", label: "Breast", description: "Breast/Nipple vore" }),
            new SelectMenuOptionBuilder({ custom_id: "cock", value: "cock", label: "Cock", description: "Cock vore" }),
            new SelectMenuOptionBuilder({ custom_id: "oral", value: "oral", label: "Oral", description: "Oral vore" }),
            new SelectMenuOptionBuilder({ custom_id: "tail", value: "tail", label: "Tail", description: "Tail vore" }),
            new SelectMenuOptionBuilder({ custom_id: "unbirth", value: "unbirth", label: "Unbirth", description: "Unbirth/Pussy Vore" }),
            new SelectMenuOptionBuilder({ custom_id: "none", value: "none", label: "None", description: "No vore types are allowed" }),
            new SelectMenuOptionBuilder({ custom_id: "all", value: "all", label: "All", description: "All vore types are allowed" })
          )
        );
        message = await interaction.editReply({ content: "What would you like to set your whitelist to?", components: [row] });
        const whitelist = await message.awaitMessageComponent({ filter, componentType: ComponentType.SelectMenu, type: 25_000, errors: ["time"] })
          .catch(() => { return undefined; });

        if(!option) return interaction.editReply({ content: `${emojis.failure} | You took too long to respond!`, components: [] });
        await whitelist.deferReply();
        await whitelist.deleteReply();
        if(whitelist.values.includes("all")) whitelist.values = ["all"];
        if(whitelist.values.includes("none")) whitelist.values = ["none"];
        if(whitelist.values[0] !== "none" && JSON.parse(character.blacklist)[0] !== "none") return interaction.editReply({ content: `${emojis.failure} | Please set your blacklist to none before updating your whitelist!`, components: [] });
        try {
          await client.models.Character.update({ whitelist: JSON.stringify(whitelist.values) }, { where: { cId: character.cId } });
          return interaction.editReply({ content: `${emojis.success} | Successfully updated your whitelist!`, components: [] });
        } catch(e) {
          toConsole(String(e), new Error().stack, client);
          return interaction.editReply({ content: `${emojis.failure} | An error occurred while updating your whitelist. Report this to a developer`, components: [] });
        }
      }
      case "blacklist": {
        row.setComponents(
          new SelectMenuBuilder({ min_values: 1, max_values: 5, custom_id: "menu" }).addOptions(
            new SelectMenuOptionBuilder({ custom_id: "anal", value: "anal", label: "Anal", description: "Anal vore" }),
            new SelectMenuOptionBuilder({ custom_id: "breast", value: "breast", label: "Breast", description: "Breast/Nipple vore" }),
            new SelectMenuOptionBuilder({ custom_id: "cock", value: "cock", label: "Cock", description: "Cock vore" }),
            new SelectMenuOptionBuilder({ custom_id: "oral", value: "oral", label: "Oral", description: "Oral vore" }),
            new SelectMenuOptionBuilder({ custom_id: "tail", value: "tail", label: "Tail", description: "Tail vore" }),
            new SelectMenuOptionBuilder({ custom_id: "unbirth", value: "unbirth", label: "Unbirth", description: "Unbirth/Pussy Vore" }),
            new SelectMenuOptionBuilder({ custom_id: "none", value: "none", label: "None", description: "No vore types are allowed" }),
            new SelectMenuOptionBuilder({ custom_id: "all", value: "all", label: "All", description: "All vore types are allowed" })
          )
        );
        message = await interaction.editReply({ content: "What would you like to set your blacklist to?", components: [row] });
        const blacklist = await message.awaitMessageComponent({ filter, componentType: ComponentType.SelectMenu, type: 25_000, errors: ["time"] })
          .catch(() => { return undefined; });

        if(!option) return interaction.editReply({ content: `${emojis.failure} | You took too long to respond!`, components: [] });
        await blacklist.deferReply();
        await blacklist.deleteReply();
        if(blacklist.values.includes("all")) blacklist.values = ["all"];
        if(blacklist.values.includes("none")) blacklist.values = ["none"];
        if(blacklist.values[0] !== "none" && JSON.parse(character.whitelist)[0] !== "none") return interaction.editReply({ content: `${emojis.failure} | Please set your whitelist to none before updating your blacklist!`, components: [] });
        try {
          await client.models.Character.update({ blacklist: JSON.stringify(blacklist.values) }, { where: { cId: character.cId } });
          return interaction.editReply({ content: `${emojis.success} | Successfully updated your blacklist!`, components: [] });
        } catch(e) {
          toConsole(String(e), new Error().stack, client);
          return interaction.editReply({ content: `${emojis.failure} | An error occurred while updating your blacklist. Report this to a developer`, components: [] });
        }
      }
      case "images": {
        row.setComponents(
          new SelectMenuBuilder({ min_values: 1, max_values: 1, custom_id: "edit_image" }).setOptions(
            new SelectMenuOptionBuilder({ value: "profile", label: "Profile", description: "Profile picture" }),
            new SelectMenuOptionBuilder({ value: "analPred", label: "Anal Pred", description: "Image of your prey when they are anal vored by you" }),
            new SelectMenuOptionBuilder({ value: "analPrey", label: "Anal Prey", description: "Image of your character when they are anal vored" }),
            new SelectMenuOptionBuilder({ value: "breastPred", label: "Breast Pred", description: "Image of your prey when they are breast vored by you" }),
            new SelectMenuOptionBuilder({ value: "breastPrey", label: "Breast Prey", description: "Image of your character when they are breast vored" }),
            new SelectMenuOptionBuilder({ value: "cockPred", label: "Cock Pred", description: "Image of your prey when they are cock vored by you" }),
            new SelectMenuOptionBuilder({ value: "cockPrey", label: "Cock Prey", description: "Image of your character when they are cock vored" }),
            new SelectMenuOptionBuilder({ value: "oralPred", label: "Oral Pred", description: "Image of your prey when they are oral vored by you" }),
            new SelectMenuOptionBuilder({ value: "oralPrey", label: "Oral Prey", description: "Image of your character when they are oral vored" }),
            new SelectMenuOptionBuilder({ value: "tailPred", label: "Tail Pred", description: "Image of your prey when they are tail vored by you" }),
            new SelectMenuOptionBuilder({ value: "tailPrey", label: "Tail Prey", description: "Image of your character when they are tail vored" }),
            new SelectMenuOptionBuilder({ value: "unbirthPred", label: "Unbirth Pred", description: "Image of your prey when they are unbirthed by you" }),
            new SelectMenuOptionBuilder({ value: "unbirthPrey", label: "Unbirth Prey", description: "Image of your character when they are unbirth" })
          )
        );
        let message = await interaction.editReply({ content: "What image would you like to update?", components: [row] });
        const option = await message
          .awaitMessageComponent({ filter, componentType: ComponentType.SelectMenu, type: 15_000 })
          .catch(() => { return undefined; });
        
        if(!option) return interaction.editReply({ content: `${emojis.failure} | You took too long to respond!`, components: [] });
        const modal = edit_image;
        modal.components[0].components[0].setCustomId(option.values[0]);
        option.showModal(modal);
        const url = await option.awaitModalSubmit({ filter, time: 30_000 })
          .catch(() => { return undefined; });

        if(!url) return interaction.editReply({ content: `${emojis.failure} | You took too long to respond!`, components: [] });
        await url.reply({ content: `${emojis.failure} | Please close this message and pay attention to the above one!`, ephemeral: true });
        await interaction.editReply({ content: `${emojis.warning} | Processing...`, components: [] });
        if(!option) return interaction.editReply({ content: `${emojis.failure} | You took too long to respond!`, components: [] });
        const image = url.fields.fields.first();
        const regex = /^https:\/\/.+\.[a-zA-Z0-9]+(\/.+)+[a-zA-Z0-9]\.(png|jpg)$/i;
        const character = await client.models.Character.findOne({ where: { discordId: interaction.user.id, active: true } });
        if(!regex.test(image.value)) return interaction.editReply({ content: `${emojis.failure} | You must enter a URL that starts with https and ends with .png or .jpg` });

        const test = await fetch(image.value)
          .then(res => res.ok);
    
        if(!test) return interaction.editReply({ content: `${emojis.failure} | Please enter a valid URL that exists` });
        try {
          await client.models.Image.update({ [image.customId]: image.value }, { where: { character: character.cId } });
          return interaction.editReply({ content: `${emojis.success} | Successfully updated your image` });
        } catch(e) {
          toConsole(String(e), new Error().stack, client);
          return interaction.editReply({ content: `${emojis.failure} | An error occurred while updating your image` });
        }
      }
      default: {
        const modal = new ModalBuilder();
        modal.setTitle("Edit Character");
        modal.setCustomId("edit_profile");
        row.setComponents(profileModals[option.values[0]]);
        modal.addComponents(row);
        option.showModal(modal);
        break;
      }
      }
    } else if(subcommand === "switch") {
      const name = options.getString("character");
      let char = await client.models.Character.findOne({ where: { discordId: interaction.user.id, name: name } });
      if(!char) char = await client.models.Character.findOne({ where: { discordId: interaction.user.id, name: {[Op.substring]: name} }});
      if(!char) return interaction.editReply({ content: `${emojis.failure} | You don't have a character with that name!` });
      if(character && char.cId === character.cId) return interaction.editReply({ content: `${emojis.failure} | That character is already active. Try using their full name if you think this is a mistake` });
      await client.models.Character.update({ active: true }, { where: { cId: char.cId } });
      if(character !== undefined) await client.models.Character.update({ active: false }, { where: { cId: character.cId } });
      return interaction.editReply({ content: `${emojis.success} | Successfully switched to ${char.name}!` });
    } else if(subcommand === "view") {
      if(!character) return interaction.editReply({ content: `${emojis.failure} | You need an active character to use this command` });
      const images = await client.models.Image.findOne({ where: { character: character.cId } });
      const stats = await client.models.Stats.findOne({ where: { character: character.cId } });
      const mementos = await client.models.Memento.findAll({ where: { character: character.cId } });
      const items = await client.models.Item.findAll({ where: { owner: character.cId } });
      const digestions = await client.models.Digestion.findAll({ where: { [Op.or]: { prey: character.cId, predator: character.cId } } });
      const currentPrey = [];
      for(let prey of digestions.filter(d => /(Voring|Vored|Digesting)/.test(d.status) && d.prey !== character.cId)) {
        let status = prey.status;
        switch(status) {
        case "Vored":
          status = `who was ${prey.type} vored`;
          break;
        case "Voring":
          status = `who is being ${prey.type} vored`;
          break;
        case "Digesting":
          status = `who was vored ${prey.type} vored but is digesting`;
          break;
        }
        prey = client.models.Character.findOne({ where: { cId: prey.prey } });
        currentPrey.push(prey);
      }
      await Promise.all(currentPrey);
      currentPrey.map(p => { return {name: p.name, status: p.status}; });
      let currentPred = digestions.filter(d => /(Voring|Vored|Digesting)/.test(d.status) && d.predator !== character.cId);
      if(currentPred.length > 0)
        currentPred = await client.models.Character.findOne({ where: { cId: currentPred[0].predator } });
      else
        currentPred = "Nobody yet!";
      const embeds = [
        new EmbedBuilder({
          title: character.name,
          thumbnail: { url: images.profile },
          description: character.description,
          color: Math.floor(Math.random() * 16777215)
        }),
        new EmbedBuilder({
          title: `${character.name} | Information`,
          thumbnail: { url: images.profile },
          color: Math.floor(Math.random() * 16777215),
          fields: [
            {
              name: "Vore Role",
              value: `${character.role.split(" ").map(v => uppercaseFirst(v))}`,
              inline: true
            },
            {
              name: "Gender",
              value: String(uppercaseFirst(character.gender)),
              inline: true
            },
            {
              name: "Species",
              value: String(uppercaseFirst(character.species)),
              inline: true
            },
            {
              name: "Weight",
              value: `${character.weight} kg`,
              inline: true
            },
            {
              name: "Height",
              value: `${character.height} cm`,
              inline: true
            },
            {
              name: "Auto Digest",
              value: `${character.autodigest ? "Yes" : "No"}`,
              inline: true
            },
            {
              name: "Whitelist",
              value: JSON.parse(character.whitelist).map(v => uppercaseFirst(v)).join(", "),
              inline: true
            },
            {
              name: "Blacklist",
              value: JSON.parse(character.blacklist).map(v => uppercaseFirst(v)).join(", "),
              inline: true
            }
          ],
          footer: {
            text: `Owned by ${character.discordId}`
          }
        }),
        new EmbedBuilder({
          title: `${character.name} | Stats`,
          thumbnail: { url: images.profile },
          color: Math.floor(Math.random() * 16777215),
          fields: [
            {
              name: "Spending some time inside of...",
              value: `${typeof currentPred !== "string" ? `${currentPred.name} since <t:${Math.floor(currentPred.createdAt.getTime()/1000)}>` : currentPred}`,
              inline: true
            },
            {
              name: "Enjoying the taste of some prey...",
              value: `...which includes: ${currentPrey.length > 0 ? currentPrey.map((obj) => `${obj.name} ${obj.status.toLowerCase()}`).join(", ") : "Nobody yet!"}`,
            },
            {
              name: "Health",
              value: stats.health,
              inline: true
            },
            {
              name: "Arousal",
              value: stats.arousal,
              inline: true
            },
            {
              name: "Euphoria",
              value: stats.euphoria,
              inline: true
            },
            {
              name: "Digestion Strength",
              value: stats.digestion,
              inline: true
            },
            {
              name: "Defiance Strength",
              value: stats.defiance,
              inline: true
            },
            {
              name: "Mental Resistance",
              value: stats.resistance,
              inline: true
            }
          ],
          footer: {
            text: `Owned by ${character.discordId}`
          }
        }),
        new EmbedBuilder({
          title: `${character.name} | Images`,
          thumbnail: { url: images.profile },
          color: Math.floor(Math.random() * 16777215),
          fields: [
            {
              name: "Anal Pred",
              value: images.analPred === " " ? "No image" : images.analPred,
              inline: false
            },
            {
              name: "Anal Prey",
              value: images.analPrey === " " ? "No image" : images.analPrey,
              inline: false
            },
            {
              name: "Breast Pred",
              value: images.breastPred === " " ? "No image" : images.breastPred,
              inline: false
            },
            {
              name: "Breast Prey",
              value: images.breastPrey === " " ? "No image" : images.breastPrey,
              inline: false
            },
            {
              name: "Cock Pred",
              value: images.cockPred === " " ? "No image" : images.cockPred,
              inline: false
            },
            {
              name: "Cock Prey",
              value: images.cockPrey === " " ? "No image" : images.cockPrey,
              inline: false
            },
            {
              name: "Oral Pred",
              value: images.oralPred === " " ? "No image" : images.oralPred,
              inline: false
            },
            {
              name: "Oral Prey",
              value: images.oralPrey === " " ? "No image" : images.oralPrey,
              inline: false
            },
            {
              name: "Tail Pred",
              value: images.tailPred === " " ? "No image" : images.tailPred,
              inline: false
            },
            {
              name: "Tail Prey",
              value: images.tailPrey === " " ? "No image" : images.tailPrey,
              inline: false
            },
            {
              name: "Unbirth Pred",
              value: images.unbirthPred === " " ? "No image" : images.unbirthPred,
              inline: false
            },
            {
              name: "Unbirth Prey",
              value: images.unbirthPrey === " " ? "No image" : images.unbirthPrey,
              inline: false
            }
          ],
          footer: {
            text: `Owned by ${character.discordId}`
          }
        }),
        new EmbedBuilder({
          title: `${character.name} | Mementos`,
          thumbnail: { url: images.profile },
          color: Math.floor(Math.random() * 16777215),
          fields: mementos.map(memento => {
            return {
              name: memento.name,
              value: memento.description,
              inline: true
            };
          }),
          footer: {
            text: `Owned by ${character.discordId}`
          }
        }),
        new EmbedBuilder({
          title: `${character.name} | Items`,
          thumbnail: { url: images.profile },
          color: Math.floor(Math.random() * 16777215),
          fields: items.map(item => {
            return {
              name: item.name,
              value: item.description,
              inline: true
            };
          }),
          footer: {
            text: `Owned by ${character.discordId}`
          }
        })
      ];
      let page = 0;
      const row = new ActionRowBuilder().setComponents(
        new ButtonBuilder({ customId: "previous", label: "◀️", style: ButtonStyle.Primary }),
        new ButtonBuilder({ customId: "cancel", label: "Cancel", style: ButtonStyle.Danger }),
        new ButtonBuilder({ customId: "next", label: "▶️", style: ButtonStyle.Primary }),
      );
      interaction.editReply({ embeds: [embeds[page]], components: [row] });
      const coll = await interaction.fetchReply()
        .then(r => r.createMessageComponentCollector({ filter, componentType: ComponentType.Button, time: 120_000 }));
      
      coll.on("collect", (i) => {
        i.deferUpdate();
        if(i.customId === "next") {
          page = page + 1;
          if(page > embeds.length - 1) page = 0;
          interaction.editReply({ embeds: [embeds[page]], components: [row] });
        } else if(i.customId === "previous") {
          page = page - 1;
          if(page < 0) page = embeds.length - 1;
          interaction.editReply({ embeds: [embeds[page]], components: [row] });
        } else {
          coll.stop();
        }
      });

      coll.once("end", () => {
        interaction.deleteReply();
      });

      return;
    } else if(subcommand === "delete") {
      if(!character) return interaction.editReply({ content: `${emojis.failure} | You need an active character to use this command` });
      const confirmation = await awaitButtons(interaction, 15, [
        new ButtonBuilder({ custom_id: "yes", label: "Yes, I want to delete the active character", style: ButtonStyle.Danger }),
        new ButtonBuilder({ custom_id: "no", label: "No, I don't want to delete the active character", style: ButtonStyle.Primary })
      ], `Are you sure you want to delete your active character, \`${character.name}\`? This action cannot be undone!`, false);
      await confirmation.deleteReply();
      if(confirmation.customId === "yes") {
        try {
          client.models.Character.delete({ where: { cId: character.cId } });
          return interaction.editReply({ content: `${emojis.success} | Successfully deleted your active character, \`${character.name}\`` });
        } catch(e) {
          toConsole(String(e), new Error().stack, client);
          return interaction.editReply({ content: `${emojis.failure} | An error occurred while deleting your character. Please try again later` });
        }
      } else {
        await interaction.editReply({ content: `${emojis.success} | Successfully cancelled character deletion` });
      }
    } else if(subcommand === "list") {
      await interaction.editReply({ content: `${emojis.warning} | Fetching your characters...` });
      const user = interaction.options.getUser("user") || interaction.user;
      const characters = await client.models.Character.findAll({ where: { discordId: user.id } });
      const fields = characters.map(char => {
        return {
          name: char.name,
          value: shortenText(char.description),
          inline: true
        };
      });
      return interaction.editReply({ content: "", embeds: [new EmbedBuilder({
        title: `${user.username}'s Characters`,
        color: Math.floor(Math.random() * 16777215),
        fields: fields.length > 0 ? fields : [{ name: "No characters", value: "This user has no characters", inline: true }]
      })] });
    } else {
      interaction.editReply({ content: "It works!" });
    }
  }
};