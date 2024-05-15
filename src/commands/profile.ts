// eslint-disable-next-line no-unused-vars
import { SlashCommandBuilder, CommandInteraction, CommandInteractionOptionResolver, ComponentType, ModalBuilder, ActionRowBuilder, StringSelectMenuOptionBuilder, EmbedBuilder, ButtonStyle, ButtonBuilder, StringSelectMenuBuilder, Interaction, TextInputBuilder } from "discord.js";
import { emojis } from "../configs/config.json";
import { profileModals, awaitButtons, toConsole, uppercaseFirst, updateDigestions } from "../functions.js";
import { new_profile_1, edit_image } from "../configs/modals";
import { Op } from "sequelize";
import { CustomClient } from "../typings/Extensions";
import { Character, Digestion } from "../typings/Models";
import fetch, { Response } from "node-fetch";

function shortenText(text: string): string {
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
            .setDescription("The character you want to delete (Default: Active character)")
            .setRequired(false);
        });
    })
    .setNSFW(false),
  /**
   * @param {CustomClient} client
   * @param {CommandInteraction} interaction
   * @param {CommandInteractionOptionResolver} options
   */
  // skipcq: JS-0044
  run: async (client: CustomClient, interaction: CommandInteraction, options: CommandInteractionOptionResolver) => {
    const row: ActionRowBuilder<StringSelectMenuBuilder|ButtonBuilder> = new ActionRowBuilder();
    let subcommand = options.getSubcommand(true);
    let character: Character = await client.models.Character.findOne({ where: { discordId: interaction.user.id, active: true } });
    if(!/(new)/.test(subcommand) && !interaction.replied) await interaction.deferReply({ ephemeral: !/(view|list)/.test(subcommand) });
    const filter = (i: Interaction) => i.user.id === interaction.user.id; 

    // Find details on specific character
    if(subcommand === "list" && options.getString("search")) {
      subcommand = "view";
      const characters: Character[] = await client.models.Character.findAll({ where: { name: { [Op.substring]: options.getString("search") }, discordId: options.getUser("user") ? options.getUser("user").id : interaction.user.id } });
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

    switch(subcommand) {
    case "new": {
      return interaction.showModal(new_profile_1);
    }
    case "edit": {
      if(!character) return interaction.editReply({ content: `${emojis.failure} | You need an active character to use this command` });
      row.setComponents(
        new StringSelectMenuBuilder({ min_values: 1, max_values: 1, custom_id: "options" }).setOptions(
          new StringSelectMenuOptionBuilder({ value: "images", label: "Images", description: "Change your character's images" }),
          new StringSelectMenuOptionBuilder({ value: "name", label: "Name", description: "Changes the name of your character" }),
          new StringSelectMenuOptionBuilder({ value: "role", label: "Role", description: "Sets the vore role of your character" }),
          new StringSelectMenuOptionBuilder({ value: "description", label: "Description", description: "Set the description of your character" }),
          new StringSelectMenuOptionBuilder({ value: "gender", label: "Gender", description: "Sets the gender of your character" }),
          new StringSelectMenuOptionBuilder({ value: "species", label: "Species", description: "Sets the species of your character" }),
          new StringSelectMenuOptionBuilder({ value: "height", label: "Height", description: "Set the height of your character" }),
          new StringSelectMenuOptionBuilder({ value: "weight", label: "Weight", description: "Set the weight of your character" }),
          new StringSelectMenuOptionBuilder({ value: "whitelist", label: "Whitelist", description: "Set the only types of vore your character will do" }),
          new StringSelectMenuOptionBuilder({ value: "blacklist", label: "Blacklist", description: "Set the types of vore your character will not do" }),
          new StringSelectMenuOptionBuilder({ value: "autodigest", label: "Automatic Digestion", description: "Change your automatic digestion setting" })
        )
      );
      let message = await interaction.editReply({ content: "Please select what you want to edit", components: [row] });
      const option = await message
        .awaitMessageComponent({ filter, componentType: ComponentType.StringSelect, time: 15_000 })
        .catch(() => { return false; });

      if(typeof option === "boolean") return interaction.editReply({ content: "You took too long to respond", components: [] });
      if(/(whitelist|blacklist|images)/.test(option.values[0])) {
        await option.deferReply();
        await option.deleteReply();
      }
      switch(option.values[0]) {
      case "whitelist": {
        row.setComponents(
          new StringSelectMenuBuilder({ min_values: 1, max_values: 5, custom_id: "menu" }).addOptions(
            new StringSelectMenuOptionBuilder({ value: "anal", label: "Anal", description: "Anal vore" }),
            new StringSelectMenuOptionBuilder({ value: "breast", label: "Breast", description: "Breast/Nipple vore" }),
            new StringSelectMenuOptionBuilder({ value: "cock", label: "Cock", description: "Cock vore" }),
            new StringSelectMenuOptionBuilder({ value: "oral", label: "Oral", description: "Oral vore" }),
            new StringSelectMenuOptionBuilder({ value: "tail", label: "Tail", description: "Tail vore" }),
            new StringSelectMenuOptionBuilder({ value: "unbirth", label: "Unbirth", description: "Unbirth/Pussy Vore" }),
            new StringSelectMenuOptionBuilder({ value: "none", label: "None", description: "No vore types are allowed" }),
            new StringSelectMenuOptionBuilder({ value: "all", label: "All", description: "All vore types are allowed" })
          )
        );
        message = await interaction.editReply({ content: "What would you like to set your whitelist to?", components: [row] });
        const whitelist = await message.awaitMessageComponent({ filter, componentType: ComponentType.StringSelect, time: 25_000 })
          .catch(() => { return false; });

        if(typeof whitelist === "boolean") return interaction.editReply({ content: `${emojis.failure} | You took too long to respond!`, components: [] });
        if(whitelist.values.includes("all")) whitelist.values = ["all"];
        if(whitelist.values.includes("none")) whitelist.values = ["none"];
        if(whitelist.values[0] !== "none" && character.blacklist[0] !== "none") return interaction.editReply({ content: `${emojis.failure} | Please set your blacklist to none before updating your whitelist!`, components: [] });
        try {
          await client.models.Character.update({ whitelist: whitelist.values }, { where: { characterId: character.characterId } });
          return interaction.editReply({ content: `${emojis.success} | Successfully updated your whitelist!`, components: [] });
        } catch(e) {
          toConsole(String(e), new Error().stack, client);
          return interaction.editReply({ content: `${emojis.failure} | I couldn't write the changes to your whitelist. Report this to a developer (Snack code: \`PRF-001\`)`, components: [] });
        }
      }
      case "blacklist": {
        row.setComponents(
          new StringSelectMenuBuilder({ min_values: 1, max_values: 5, custom_id: "menu" }).addOptions(
            new StringSelectMenuOptionBuilder({ value: "anal", label: "Anal", description: "Anal vore" }),
            new StringSelectMenuOptionBuilder({ value: "breast", label: "Breast", description: "Breast/Nipple vore" }),
            new StringSelectMenuOptionBuilder({ value: "cock", label: "Cock", description: "Cock vore" }),
            new StringSelectMenuOptionBuilder({ value: "oral", label: "Oral", description: "Oral vore" }),
            new StringSelectMenuOptionBuilder({ value: "tail", label: "Tail", description: "Tail vore" }),
            new StringSelectMenuOptionBuilder({ value: "unbirth", label: "Unbirth", description: "Unbirth/Pussy Vore" }),
            new StringSelectMenuOptionBuilder({ value: "none", label: "None", description: "No vore types are allowed" }),
            new StringSelectMenuOptionBuilder({ value: "all", label: "All", description: "All vore types are allowed" })
          )
        );
        message = await interaction.editReply({ content: "What would you like to set your blacklist to?", components: [row] });
        const blacklist = await message.awaitMessageComponent({ filter, componentType: ComponentType.StringSelect, time: 25_000 })
          .catch(() => { return false; });

        if(typeof blacklist === "boolean") return interaction.editReply({ content: `${emojis.failure} | You took too long to respond!`, components: [] });
        if(blacklist.values.includes("all")) blacklist.values = ["all"];
        if(blacklist.values.includes("none")) blacklist.values = ["none"];
        if(blacklist.values[0] !== "none" && character.whitelist[0] !== "none") return interaction.editReply({ content: `${emojis.failure} | Please set your whitelist to none before updating your blacklist!`, components: [] });
        try {
          await client.models.Character.update({ blacklist: blacklist.values }, { where: { characterId: character.characterId } });
          return interaction.editReply({ content: `${emojis.success} | Successfully updated your blacklist!`, components: [] });
        } catch(e) {
          toConsole(String(e), new Error().stack, client);
          return interaction.editReply({ content: `${emojis.failure} | I couldn't apply the changes to your blacklist. Please report this to a developer (Snack code: \`PRF-002\`)`, components: [] });
        }
      }
      case "images": {
        row.setComponents(
          new StringSelectMenuBuilder({ min_values: 1, max_values: 1, custom_id: "edit_image" }).setOptions(
            new StringSelectMenuOptionBuilder({ value: "profile", label: "Profile", description: "Profile picture" }),
            new StringSelectMenuOptionBuilder({ value: "analPred", label: "Anal Pred", description: "Image of your prey when they are anal vored by you" }),
            new StringSelectMenuOptionBuilder({ value: "analPrey", label: "Anal Prey", description: "Image of your character when they are anal vored" }),
            new StringSelectMenuOptionBuilder({ value: "breastPred", label: "Breast Pred", description: "Image of your prey when they are breast vored by you" }),
            new StringSelectMenuOptionBuilder({ value: "breastPrey", label: "Breast Prey", description: "Image of your character when they are breast vored" }),
            new StringSelectMenuOptionBuilder({ value: "cockPred", label: "Cock Pred", description: "Image of your prey when they are cock vored by you" }),
            new StringSelectMenuOptionBuilder({ value: "cockPrey", label: "Cock Prey", description: "Image of your character when they are cock vored" }),
            new StringSelectMenuOptionBuilder({ value: "oralPred", label: "Oral Pred", description: "Image of your prey when they are oral vored by you" }),
            new StringSelectMenuOptionBuilder({ value: "oralPrey", label: "Oral Prey", description: "Image of your character when they are oral vored" }),
            new StringSelectMenuOptionBuilder({ value: "tailPred", label: "Tail Pred", description: "Image of your prey when they are tail vored by you" }),
            new StringSelectMenuOptionBuilder({ value: "tailPrey", label: "Tail Prey", description: "Image of your character when they are tail vored" }),
            new StringSelectMenuOptionBuilder({ value: "unbirthPred", label: "Unbirth Pred", description: "Image of your prey when they are unbirthed by you" }),
            new StringSelectMenuOptionBuilder({ value: "unbirthPrey", label: "Unbirth Prey", description: "Image of your character when they are unbirth" })
          )
        );
        const imageMessage = await interaction.editReply({ content: "What image would you like to update?", components: [row] });
        const imageOption = await imageMessage
          .awaitMessageComponent({ filter, componentType: ComponentType.StringSelect, time: 15_000 })
          .catch(() => { return false; });

        if(typeof imageOption === "boolean") return interaction.editReply({ content: `${emojis.failure} | You took too long to respond!`, components: [] });
        const modal = edit_image;
        modal.components[0].components[0].setCustomId(imageOption.values[0]);
        imageOption.showModal(modal);
        const url = await imageOption.awaitModalSubmit({ filter, time: 30_000 })
          .catch(() => { return false; });

        if(typeof url === "boolean") return interaction.editReply({ content: `${emojis.failure} | You took too long to respond!`, components: [] });
        await url.reply({ content: `${emojis.failure} | Please close this message and pay attention to the above one!`, ephemeral: true });
        await interaction.editReply({ content: `${emojis.warning} | Processing...`, components: [] });
        const image = url.fields.fields.first();
        const regex = /^https:\/\/.+\.[a-zA-Z0-9]+(\/.+)+[a-zA-Z0-9]\.(png|jpg)$/i;
        if(!regex.test(image.value)) return interaction.editReply({ content: `${emojis.failure} | You must enter a URL that starts with https and ends with .png or .jpg` });

        const test = await fetch(image.value)
          .then((res: Response) => res.ok);

        if(!test) return interaction.editReply({ content: `${emojis.failure} | Please enter a valid URL that exists` });
        try {
          await client.models.Image.update({ [image.customId]: image.value }, { where: { characterId: character.characterId } });
          return interaction.editReply({ content: `${emojis.success} | Successfully updated your image` });
        } catch(e) {
          toConsole(String(e), new Error().stack, client);
          return interaction.editReply({ content: `${emojis.failure} | An error occurred while updating your image` });
        }
      }
      default: {
        const modal = new ModalBuilder();
        const mRow: ActionRowBuilder<TextInputBuilder> = new ActionRowBuilder();
        modal.setTitle("Edit Character");
        modal.setCustomId("edit_profile");
        mRow.setComponents(profileModals[option.values[0]]);
        modal.addComponents(mRow);
        option.showModal(modal);
        break;
      }
      }
      break;
    }
    case "switch": {
      const name = options.getString("character");
      let char: Character = await client.models.Character.findOne({ where: { discordId: interaction.user.id, name: name } });
      if(!char) char = await client.models.Character.findOne({ where: { discordId: interaction.user.id, name: {[Op.substring]: name} }});
      if(!char) return interaction.editReply({ content: `${emojis.failure} | You don't have a character with that name!` });
      if(character && char.characterId === character.characterId) return interaction.editReply({ content: `${emojis.failure} | That character is already active. Try using their full name if you think this is a mistake` });
      await client.models.Character.update({ active: true }, { where: { characterId: char.characterId } });
      if(character !== null) await client.models.Character.update({ active: false }, { where: { characterId: character.characterId } });
      return interaction.editReply({ content: `${emojis.success} | Successfully switched to ${char.name}!` });
    }
    case "delete": {
      if(!character || character.name !== options.getString("character")) {
        if(!options.getString("character"))
          return interaction.editReply({ content: `${emojis.failure} | You need an active character to use this command` });
        else {
          character = await client.models.Character.findOne({ where: {name: {[Op.substring]: options.getString("character")}, discordId: interaction.user.id} });
          if(!character) return interaction.editReply({ content: `${emojis.failure} | No character found with that name` });
        }
      }
      const confirmation = await awaitButtons(interaction, 15, [
        new ButtonBuilder({ custom_id: "no", label: "No, I don't want to delete that character", style: ButtonStyle.Success }),
        new ButtonBuilder({ custom_id: "yes", label: "Yes, I want to delete that character", style: ButtonStyle.Danger })
      ], `Are you sure you want to delete your character, \`${character.name}\`? This action cannot be undone!`, false);
      if(confirmation instanceof SyntaxError) return interaction.editReply({ content: `${emojis.failure} | Something went wrong while generating the prompt. Please contact a developer`, components: [] });
      await confirmation.update({ components: [] });
      if(confirmation.customId === "yes") {
        try {
          client.models.Character.destroy({ where: { characterId: character.characterId } });
          return interaction.editReply({ content: `${emojis.success} | Successfully deleted your active character, \`${character.name}\``, components: [] });
        } catch(e) {
          toConsole(String(e), new Error().stack, client);
          return interaction.editReply({ content: `${emojis.failure} | An error occurred while deleting your character. Please try again later`, components: [] });
        }
      } else {
        return interaction.editReply({ content: `${emojis.success} | Successfully cancelled character deletion` });
      }
    }
    case "view": {
      if(!character) return interaction.editReply({ content: `${emojis.failure} | You need an active character to use this command` });
      const images = await character.getImage();
      const stats = await character.getStat();
      const mementos = await character.getMementos();
      const items = await character.getItems();
      await updateDigestions(character.characterId);
      const digestions: Digestion[] = await client.models.Digestion.findAll({ where: { [Op.or]: { prey: character.characterId, predator: character.characterId } } });
      let currentPrey: Promise<Character>[] = [],
        statuses = [];
      for(let prey of digestions.filter(d => /(Voring|Vored|Digesting)/.test(d.status) && d.prey !== character.characterId)) {
        let {status} = prey;
        switch(status) {
        case "Vored":
          status = `who was ${prey.type} vored`;
          break;
        case "Voring":
          status = `who is being ${prey.type} vored`;
          break;
        case "Digesting":
          status = `who was ${prey.type} vored but is digesting`;
          break;
        }
        statuses.push(status);
        const preyCharacter: Promise<Character> = client.models.Character.findOne({ where: { characterId: prey.prey } });
        currentPrey.push(preyCharacter);
      }
      const resolvedPrey: {name?:string,status?:string}[] = await Promise.all(currentPrey)
        .then(prey => prey.map((p, index) => new Object({ name: p.name, status: statuses[index] })));
      let currentPred = digestions.filter(d => /(Voring|Vored|Digesting|Digested)/.test(d.status) && d.predator !== character.characterId)[0];
      let pred: Character|string;
      if(currentPred)
        pred = await client.models.Character.findOne({ where: { characterId: currentPred.predator } });
      else
        pred = "Nobody yet!";
      const embeds: EmbedBuilder[] = [
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
              value: `${character.role.split(" ").map(v => uppercaseFirst(v)).join(" ")}`,
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
              value: `${character.autoDigest ? "Yes" : "No"}`,
              inline: true
            },
            {
              name: "Whitelist",
              value: character.whitelist.map(v => uppercaseFirst(v)).join(", "),
              inline: true
            },
            {
              name: "Blacklist",
              value: character.blacklist.map(v => uppercaseFirst(v)).join(", "),
              inline: true
            }
          ],
          footer: {
            text: `Owned by ${character.discordId}`
          }
        }),
        new EmbedBuilder(),
        new EmbedBuilder({
          title: `${character.name} | Stats`,
          thumbnail: { url: images.profile },
          color: Math.floor(Math.random() * 16777215),
          fields: [
            {
              name: "Spending some time inside of...",
              value: `${typeof pred !== "string" ? `${pred.name} since <t:${Math.floor(currentPred.voreUpdate.getTime()/1000)}>` : pred}`,
              inline: true
            },
            {
              name: "Enjoying the taste of some prey...",
              value: `...which includes: ${resolvedPrey.length > 0 ? resolvedPrey.map((obj) => `${obj.name} ${obj.status}`).join(", ") : "Nobody yet!"}`,
            },
            {
              name: "Health",
              value: String(stats.health),
              inline: true
            },
            {
              name: "Arousal",
              value: String(stats.arousal),
              inline: true
            },
            {
              name: "Euphoria",
              value: String(stats.euphoria),
              inline: true
            },
            {
              name: "Defiance Strength",
              value: String(stats.defiance),
              inline: true
            },
            {
              name: "Mental Resistance",
              value: String(stats.resistance),
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
              name: memento.title,
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
      if(typeof pred !== "string") {
        const predStats = await pred.getStat();
        embeds.splice(2, 1, new EmbedBuilder({
          title: `${character.name} | Digestion`,
          description: "*Where 'Stomach' is used, it represents where you are being held in your predator. This does not mean your own!*",
          thumbnail: { url: images.profile },
          color: Math.floor(Math.random() * 16777215),
          fields: [
            {
              name: "Status",
              value: `${uppercaseFirst(currentPred.status)} via ${uppercaseFirst(currentPred.type)}${uppercaseFirst(currentPred.type) !== "Unbirth" ? " Vore" : ""}`,
              inline: true
            },
            {
              name: "Prey Exhaustion",
              value: `${stats.pExhaustion > 7 ? "High" : (stats.pExhaustion > 3 ? "Medium" : "Low")} (${stats.pExhaustion})`,
              inline: true
            },
            {
              name: "Stomach Health",
              value: String(predStats.sHealth),
              inline: true
            },
            {
              name: "Stomach Power",
              value: String(predStats.sPower),
              inline: true
            },
            {
              name: "Stomach Resistance",
              value: String(predStats.sResistance),
              inline: true
            },
            {
              name: "Stomach Acids",
              value: String(predStats.acids),
              inline: true
            }
          ],
          footer: {
            text: `Owned by ${character.discordId}`
          }
        }));
      } else
        embeds.splice(2, 1);
      let page = 0;
      const paginationRow: ActionRowBuilder<ButtonBuilder> = new ActionRowBuilder({ components: [
        new ButtonBuilder({ customId: "previous", label: "◀️", style: ButtonStyle.Primary }),
        new ButtonBuilder({ customId: "cancel", label: "🟥", style: ButtonStyle.Danger }),
        new ButtonBuilder({ customId: "next", label: "▶️", style: ButtonStyle.Primary })
      ] });
      interaction.editReply({ embeds: [embeds[page]], components: [paginationRow] });
      const coll = await interaction.fetchReply()
        .then(r => r.createMessageComponentCollector({ filter, componentType: ComponentType.Button, time: 120_000 }));

      coll.on("collect", (i) => {
        if(i.customId === "next") {
          page = page + 1;
          if(page > embeds.length - 1) page = 0;
          i.update({ embeds: [embeds[page]], components: [paginationRow] });
        } else if(i.customId === "previous") {
          page = page - 1;
          if(page < 0) page = embeds.length - 1;
          i.update({ embeds: [embeds[page]], components: [paginationRow] });
        } else {
          coll.stop();
        }
      });

      coll.once("end", () => {
        interaction.editReply({ content: `This command has expired. Run </profile ${options.getSubcommand(true)}:${interaction.commandId}>`, embeds: [embeds[page]], components: [] });
      });

      return;
    }
    case "list": {
      const user = interaction.options.getUser("user") || interaction.user;
      const characters: Character[] = await client.models.Character.findAll({ where: { discordId: user.id } });
      if(character)
        await updateDigestions(character.characterId);
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
        fields: fields.length > 0 ? fields : [{ name: "No characters", value: "This user has no characters", inline: true }],
        footer: {
          text: options.getString("search") ? `No characters found for "${options.getString("search")}" - Returning existing characters` : ""
        }
      })] });
    }
    default: {
      interaction.editReply({ content: `${emojis.failure} | Something went wrong and you shouldn't be seeing this. Report this to a developer with this code: \`PF-EL001\`` });
    }
    }
  }
};