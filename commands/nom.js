// eslint-disable-next-line no-unused-vars
const { Client, CommandInteraction, CommandInteractionOptionResolver, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { Op } = require("sequelize");
const { emojis } = require("../configs/config.json");
const { toConsole } = require("../functions.js");

module.exports = {
  name: "nom",
  data: new SlashCommandBuilder()
    .setName("nom")
    .setDescription("Eats a person, using the specified type")
    .addUserOption(option => {
      return option
        .setName("target")
        .setDescription("Person you want to nom")
        .setRequired(true);
    })
    .addStringOption(option => {
      return option
        .setName("type")
        .setDescription("Type of vore to use when nomming (Defaults to oral)")
        .addChoices(
          {
            name: "Oral Vore",
            value: "Oral Vore"
          },
          {
            name: "Anal Vore",
            value: "Anal Vore"
          },
          {
            name: "Breast Vore",
            value: "Breast Vore"
          },
          {
            name: "Cock Vore",
            value: "Cock Vore"
          },
          {
            name: "Tail Vore",
            value: "Tail Vore"
          },
          {
            name: "Unbirth",
            value: "Unbirth"
          }
        );
    }),
  /**
   * @param {Client} client
   * @param {CommandInteraction} interaction
   * @param {CommandInteractionOptionResolver} options
   */
  run: async (client, interaction, options) => {
    await interaction.deferReply();
    const type = options.getString("type").split(" ")[0].toLowerCase() || "oral";
    const target = options.getMember("target");
    if(!target) return interaction.editReply({ content: `${emojis.failure} | Your target doesn't exist on this server`});

    const character = await client.models.Character.findOne({ where: { discordId: interaction.user.id, active: true } });
    const victim = await client.models.Character.findOne({ where: { discordId: target.id, active: true } });
    if(!character) return interaction.editReply({ content: `${emojis.failure} | You need an active character to use this command` });
    if(!victim) return interaction.editReply({ content: `${emojis.failure} | Your target doesn't have an active character` });
    const cDigestions_pred = await client.models.Digestion.findAll({ where: { status: { [Op.or]: ["Voring", "Vored", "Digesting"] }, predator: character.cId } });
    const cDigestions_prey = await client.models.Digestion.findAll({ where: { status: { [Op.or]: ["Voring", "Vored", "Digesting"] }, prey: character.cId } });
    const vDigestions_pred = await client.models.Digestion.findAll({ where: { status: { [Op.or]: ["Voring", "Vored", "Digesting"] }, predator: victim.cId } });
    const vDigestions_prey = await client.models.Digestion.findAll({ where: { status: { [Op.or]: ["Voring", "Vored", "Digesting"] }, prey: victim.cId } });
    // Check whitelist and blacklist
    if(JSON.parse(character.blacklist).includes(type) || (!JSON.parse(character.whitelist).includes(type) && !JSON.parse(character.whitelist).includes("All")))
      return interaction.editReply({ content: `${emojis.failure} | ${JSON.parse(character.blacklist).includes(type) ? "Your character's blacklist contains the vore you are trying to do" : "Your character's whitelist does not have the type of vore you are trying to do"}` });
    if(JSON.parse(victim.blacklist).includes(type) || (!JSON.parse(victim.whitelist).includes(type) && !JSON.parse(victim.whitelist).includes("All")))
      return interaction.editReply({ content: `${emojis.failure} | ${JSON.parse(victim.blacklist).includes(type) ? "Your victim's blacklist contains the vore you are trying to do" : "Your victim's whitelist does not have the type of vore you are trying to do"}` });
    // Check if either is busy
    if(cDigestions_pred.some(d => /(Voring|Digesting)/.test(d.status)))
      return interaction.editReply({ content: "*You feel something moving in you. Seems like you're a little bit preoccupied with your current prey. Try finishing with them before you vore someone new.*" });
    if(vDigestions_pred.some(d => /(Voring|Digesting)/.test(d)))
      return interaction.editReply({ content: "*You take a look at your target. They seem busy with dealing with their current predicament. Maybe try later?" });
    // Check if you're voring yourself
    if(character.cId === victim.cId)
      return interaction.editReply({ content: "*You look at yourself and seem confused. Did you just think about voring yourself? That's silly, nobody would do that.*" });
    // If the victim is vored
    for(let digestion in vDigestions_prey.filter(d => d.status === "Vored")) {
      digestion = vDigestions_prey.filter(d => d.status === "Vored")[digestion];
      // If the victim is vored by the character
      if(character.cId === digestion.predator)
        return interaction.editReply({ content: "*You look at yourself and feel something moving inside of you. They're already inside of you! Try someone different.*" });
      // If the victim is vored by someone else
      else
        return interaction.editReply({ content: "*You look at your target and see that they are already vored by someone else! Try someone different.*" });
    }
    // Check if character is vored
    for(let digestion in cDigestions_prey.filter(d => d.status === "Vored")) {
      digestion = cDigestions_prey.filter(d => d.status === "Vored")[digestion];
      console.info(digestion, victim);
      // If the character is vored by the victim
      if(digestion.predator === victim.cId)
        return interaction.editReply({ content: "*You look at your current predicament and realise something. You're vored by the person you're trying to vore. Escaping is probably a good idea.*" });
      // If the victim hasn't been vored by the character's predator
      else if(digestion.predator != vDigestions_prey.filter(d => d.status === "Vored").predator)
        return interaction.editReply({ content: "*Inside your predator, you look around. For some reason, you can't find your prey anywhere in sight!*" });
    }

    try {
      await client.models.Digestion.create({
        status: "Voring",
        type: type,
        predator: character.cId,
        prey: victim.cId
      });
      await interaction.editReply({ content: `${emojis.success} | *The thought of voring ${victim.name.trim()} suddenly engulfs ${character.name.trim()} and you start to vore them!*` });
      return interaction.followUp({ content: `*Psst!* ${victim.name.trim()} (<@${victim.discordId}>), you're being vored by ${character.name.trim()} (<@${character.discordId}>)`, components: [new ActionRowBuilder().setComponents(
        new ButtonBuilder({ custom_id: `${type}_yes`, label: "", style: ButtonStyle.Success, emoji: "1016311604410863736" }),
        new ButtonBuilder({ custom_id: `${type}_no`, label: "", style: ButtonStyle.Danger, emoji: "1016311766470377502" })
      )] });
    } catch(e) {
      toConsole(String(e), new Error().stack, client);
      return interaction.editReply({ content: `${emojis.failure} | An error occurred while nomming ${victim.name}` });
    }
  }
};