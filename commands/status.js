// eslint-disable-next-line no-unused-vars
const { Client, CommandInteraction, CommandInteractionOptionResolver, SlashCommandBuilder } = require("discord.js");
const { emojis } = require("../configs/config.json");
const { Op } = require("sequelize");

module.exports = {
  name: "status",
  data: new SlashCommandBuilder()
    .setName("status")
    .setDescription("Shows a character's status")
    .addStringOption((option) => {
      return option
        .setName("character")
        .setDescription("The character you want to see the status of");
    }),
  /**
   * @param {Client} client
   * @param {CommandInteraction} interaction
   * @param {CommandInteractionOptionResolver} options
   */
  run: async (client, interaction, options) => {
    if(!interaction.replied) await interaction.deferReply(); // In case of overload
    let status;
    let active = await process.Character.findOne({ where: { discordId: interaction.user.id, active: true } });
    if(options.getString("character")) {
      active = await process.Character.findOne({ where: { name: { [Op.substring]: options.getString("character") }, discordId: interaction.user.id } });
    }
    if(!active) return interaction.editReply({ content: `${emojis.failure} | ${options.getString("character") ? `I couldn't find \`${options.getString("character")}\` on your account` : "You don't have an active character! Use `/profile switch` to switch to it" }!` });
    
    const stats = await active.getStat();
    const image = await active.getImage();
    const predDigestions = await active.getDigestions();
    const preyDigestion = await process.Digestion.findOne({ where: { prey: active.cId, status: { [Op.not]: ["Escaped", "Reformed"] } }});
    if(preyDigestion) {
      const pred = await process.Character.findOne({ where: { cId: preyDigestion.predator } });
      switch(preyDigestion.status) {
      case "Voring": {
        status = `is being vored by \`${pred.name}\``;
        break;
      }
      case "Vored": {
        status = `is spending their time inside \`${pred.name}\``;
        break;
      }
      case "Digesting": {
        status = `is digesting inside \`${pred.name}\`~`;
        break;
      }
      case "Digested": {
        status = `was digested by \`${pred.name}\``;
        break;
      }
      default: {
        return interaction.editReply({ content: ":x: | I tried biting more than I could chew and something went wrong. Please tell the developers about this! (`ST-001`)" });
      }
      }
    }

    return interaction.editReply({ embeds: [{
      title: `${active.name}'s Status`,
      thumbnail: { url: image.profile },
      description: `Currently, \`${active.name}\` ${status !== undefined ? status : "is enjoying their time outside in the world!"}\n\n> **HP:** ${stats.health}\n> **Prey**: ${predDigestions.length || 0}`,
      color: stats.health >= 115 ? 0x00ff00 : stats.health >= 85 ? 0xffff00 : stats.health >= 35 ? 0xffa500 : 0xff0000,
    }] });
  }
};