// eslint-disable-next-line no-unused-vars
const { Client, CommandInteraction, CommandInteractionOptionResolver, SlashCommandBuilder } = require("discord.js");
const { emojis } = require("../configs/config.json");
const { Op } = require("sequelize");

module.exports = {
  name: "escape",
  data: new SlashCommandBuilder()
    .setName("escape")
    .setDescription("Attempt to escape from your current predator!")
    .addStringOption(option => {
      return option
        .setName("type")
        .setDescription("The type of the escape attempt")
        .setChoices(
          {
            name: "Massage",
            value: "Massage"
          },
          {
            name: "Struggle",
            value: "Struggle"
          },
          {
            name: "Move Around",
            value: "Move Around"
          },
          {
            name: "Pleasure",
            value: "Pleasure"
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
    const type = options.getString("type") ?? "Struggle";
    const character = await client.models.Character.findOne({ where: { discordId: interaction.user.id, active: true } });
    if(!character) return interaction.editReply({ content: `${emojis.failure} | You don't have an active character!` });
    const digestion = await client.models.Digestion.findOne({ where: { prey: character.cId, status: {[Op.or]: ["Vored", "Digesting"]} } });
    if(!digestion)
      return interaction.editReply({ content: `${emojis.failure} | Oops, you're not inside a predator! Maybe try again later when you've found your way inside one` });
    const stats = await client.models.Stats.findOne({ where: { character: {[Op.or]: [digestion.prey, digestion.predator]} } });
    if(stats.length < 2) return interaction.editReply({ content: `${emojis.failure} | Something went wrong. Please verify your predator still exists (Run \`/profile list\` pn your predator)` });
    const predStats = stats.filter(s => s.character === digestion.predator);
    const preyStats = stats.filter(s => s.character === digestion.prey);
    switch(type) {
    case "Massage": {
      await client.models.Stats.update({
        strength: digestion.strength - 1 > 0 ? digestion.strength - 1 : 0
      }, { where: { character: digestion.predator } });
      await client.models.Stats.update({
        defiance: preyStats.arousal - 5 > 0 ? preyStats.arousal - 5 : (preyStats.arousal - 5) + 1
      }, { where: { character: digestion.prey } });
      return interaction.editReply({ content: "*You massage the inside of your predator, making sure to pay special attention to what they want. Once you find a special spot, you rub it a bit more. The acids inside have calmed down!* (`-Arousal` `-Pred Digestive Strength`" });
    }
    case "Struggle": {
      let success = Math.floor(Math.random() * 100);
      success += (preyStats.defiance/1.5) - digestion.strength - preyStats.euphoria - predStats.digestion;
      if(success > ((digestion.acids * 2) + digestion.strength + 10)) {
        await client.models.Digestion.update({ status: "Free" }, { where: { prey: digestion.prey } });
        await client.models.Stats.update({ acids: 0, strength: 0 }, { where: { character: digestion.pred } });
        return interaction.editReply({ content: "*You struggle as hard as you can and for a second, you feel freedom. However, alas, it was not meant to be and you slipped back inside. However this time, you were determined. You kept pushing on and eventually, you found your way outside of your predator!* (`+Defiance`)" });
      }
      await client.models.Stats.update({
        strength: digestion.strength + 5 > 100 ? 100 : digestion.strength + 5
      }, { where: { character: digestion.predator } });
      return interaction.editReply({ content: "*You try your best to struggle but in the end, your efforts were fruitless and you stayed inside your predator. Your home shook for a second and you pressed against it. It felt stronger...* (`+Predator Strength`)" });
    }
    case "Move Around": {
      const flip = Math.floor(Math.random() * 2);
      if(flip === 0) {
        await client.models.Stats.update({
          strength: digestion.strength + 2 > 100 ? 100 : digestion.strength + 2
        }, { where: { character: digestion.predator } });
        return interaction.editReply({ content: "*You decide to move around your new home inside your predator. Unfortunately, this doesn't make your predator that happy.* (`+Predator Strength`)" });
      }
      await client.models.Stats.update({
        strength: digestion.strength - 2 < 0 ? 0 : digestion.strength - 2
      }, { where: { character: digestion.predator } });
      return interaction.editReply({ content: "*You move around your while inside your predator, curious about what you can do. Luckily, you manage to rub them right and they relax a little.* (`-Predator Strength`)" });
    }
    case "Pleasure": {
      const pValue = Math.ceil(Math.random() * 100);
      if(pValue > 50) {
        await client.models.Stats.update({
          arousal: predStats.arousal + 5
        }, { where: { character: digestion.pred } });
        return interaction.editReply({ content: "*You move around inside your predator, finding a sensitive spot. You use all of your body to push against it, rubbing, licking, and doing anything you can to please that one point. A sound of pleasure comes out of your predator, and you feel like something changed inside.* (`+Predator Arousal`)" });
      }
      if(pValue < 25) {
        await client.models.Stats.update({
          arousal: predStats.arousal + 3
        }, { where: { character: digestion.pred } });
        return interaction.editReply({ content: "*Trying to find a special spot inside your predator is hard. Once you've found it, you try your hardest to please it. After some energy spent on pleasing them, you notice that something changed a bit...* (`+Predator Arousal`)" });
      }
      return interaction.editReply({ content: "*You try your best to find a place to please your predator. However, you were unable to find one. You feel a bit tired but could probably continue.*" });
    }
    default: {
      return interaction.editReply({ content: `${emojis.failure} | Something went terribly wrong and you shouldn't be seeing this! Please report this to a developer!` });
    }
    }
  }
};