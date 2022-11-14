/* eslint-disable no-unreachable */
// eslint-disable-next-line no-unused-vars
const { Client, CommandInteraction, CommandInteractionOptionResolver, SlashCommandBuilder } = require("discord.js");
const { emojis } = require("../configs/config.json");
const { interactionEmbed } = require("../functions");

module.exports = {
  name: "digest",
  data: new SlashCommandBuilder()
    .setName("digest")
    .setDescription("Digests specific or all prey inside you")
    .addStringOption((option) => {
      return option
        .setName("type")
        .setDescription("How you want to digest your prey");
    }),
  /**
   * @param {Client} client
   * @param {CommandInteraction} interaction
   * @param {CommandInteractionOptionResolver} options
   */
  async run(client, interaction, options) {
    return interactionEmbed(4, "[INFO-DEV]", "", interaction, client, [false, 0]);
    // ^ Temporary Fix ^ //
    if(!interaction.replied) await interaction.deferReply(); // In case of overload
    const active = await process.Character.findOne({ where: { discordId: interaction.user.id, active: true } });
    if(!active) return interaction.editReply({ content: `${emojis.failure} | You don't have an active character!` });

    if(options.getString("selective")) {
      return interaction.editReply({ content: `${emojis.failure} | You didn't select anything! Seems like your prey are safe... for now (Command is WIP)` });
    }

    return interaction.editReply({ content: "*Nothing happened. This command is in development.*" });
  }
};