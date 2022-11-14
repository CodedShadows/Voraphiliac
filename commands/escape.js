// eslint-disable-next-line no-unused-vars
const { Client, CommandInteraction, CommandInteractionOptionResolver, SlashCommandBuilder } = require("discord.js");
const { emojis } = require("../configs/config.json");
const { massage, move_fail, move_pass, pleasure_crit, pleasure_fail, pleasure_pass, struggle_fail, struggle_pass_pred, struggle_pass } = require("../configs/responses.json");
const { Op } = require("sequelize");
const { updateDigestions, replaceVars } = require("../functions");

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
    if(!interaction.replied) await interaction.deferReply(); // In case of overload
    let exhaustion = 0;
    let type = options.getString("type") ?? "Struggle";
    const character = await process.Character.findOne({ where: { discordId: interaction.user.id, active: true } });
    if(!character) return interaction.editReply({ content: `${emojis.failure} | You don't have an active character!` });
    await updateDigestions(character.cId);
    const digestion = await process.Digestion.findOne({ where: { prey: character.cId, status: {[Op.or]: ["Vored", "Digesting"]} } });
    if(!digestion)
      return interaction.editReply({ content: `${emojis.failure} | Oops, you're not inside a predator! Maybe try again later when you've found your way inside one` });
    const stats = await process.Stats.findAll({ where: { character: {[Op.or]: [digestion.prey, digestion.predator]} } });
    if(stats.length < 2) return interaction.editReply({ content: `${emojis.failure} | Something went wrong. Please verify your predator still exists (Run \`/profile list\` pn your predator)` });
    const predStats = stats.filter(s => s.character === digestion.predator)[0];
    const preyStats = stats.filter(s => s.character === digestion.prey)[0];
    const pred = await predStats.getCharacter();
    const prey = await preyStats.getCharacter();
    try {
      switch(type) {
      case "Massage": {
        if(preyStats.pExhaustion < 1) throw new Error("Too exhausted for massaging");
        await Promise.all(
          process.Stats.update({sPower: digestion.sPower - 1}, { where: { character: digestion.predator } }),
          process.Stats.update({defiance: preyStats.arousal - 5}, { where: { character: digestion.prey } })
        );
        // massage
        interaction.editReply({ content: `${replaceVars(massage[Math.floor(Math.random()*massage.length)], ["pred", "prey"], [pred.name, prey.name])} (\`-Arousal\` \`-Pred Digestive Strength\`)` });
        exhaustion = exhaustion++;
        break;
      }
      case "Struggle": {
        let success = Math.floor(Math.random() * 100);
        success += (preyStats.defiance/1.5) - digestion.sPower - preyStats.euphoria - predStats.digestion;
        if(success > ((digestion.acids * 2) + digestion.sPower + 10)) {
          if(preyStats.pExhaustion < 2) throw new Error("Too exhausted for successful struggle");
          const newPred = await process.Digestion.findOne({ where: { prey: digestion.pred, status: {[Op.or]: ["Vored", "Digesting", "Digested"]} } });
          if(newPred) {
            await process.Digestion.update({ status: "Vored", predator: newPred.predator, voreUpdate: new Date() });
            // struggle_pass_pred
            interaction.editReply({ content: `${replaceVars(struggle_pass_pred[Math.floor(Math.random()*struggle_pass_pred.length)], ["prey", "pred"], [pred.name, prey.name])} (\`+Defiance\`)` });
          } else {
            await process.Digestion.update({ status: "Free" }, { where: { dId: digestion.dId } });
            // struggle_pass
            interaction.editReply({ content: `${replaceVars(struggle_pass[Math.floor(Math.random*struggle_pass.length)], ["pred", "prey"], [pred.name, prey.name])} (\`+Defiance\`)` });
          }
          await preyStats.increment({ defiance: 5, euphoria: -1 });
          exhaustion = exhaustion+2;
        } else {
          if(preyStats.pExhaustion < 3) throw new Error("Too exhausted for failed struggle");
          await process.Stats.update({
            strength: digestion.sPower + 5
          }, { where: { character: digestion.predator } });
          // struggle_fail
          interaction.editReply({ content: `${replaceVars(struggle_fail[Math.floor(Math.random()*struggle_fail.length)], ["pred", "prey"], [pred.name, prey.name])} (\`+Predator Strength\`)` });
        }
        break;
      }
      case "Move Around": {
        const flip = Math.floor(Math.random() * 2);
        if(flip === 0) {
          if(preyStats.pExhaustion < 2) throw new Error("Too exhausted for failed movement");
          await process.Stats.update({
            sPower: digestion.sPower+1
          }, { where: { character: digestion.predator } });
          // move_fail
          interaction.editReply({ content: `${replaceVars(move_fail[Math.floor(Math.random()*move_fail.length)], ["pred", "prey"], [pred.name, prey.name])} (\`+Predator Strength\`)` });
          exhaustion = exhaustion+2;
        } else {
          if(preyStats.pExhaustion < 1) throw new Error("Too exhausted for successful movement");
          await process.Stats.update({
            sPower: digestion.sPower-2
          }, { where: { character: digestion.predator } });
          // move_pass
          interaction.editReply({ content: `${replaceVars(move_pass[Math.floor(Math.random()*move_pass.length)], ["pred", "prey"], [pred.name, prey.name])} (\`-Predator Strength\`)` });
          exhaustion = exhaustion++;
        }
        break;
      }
      case "Pleasure": {
        const pValue = Math.ceil(Math.random() * 100);
        if(pValue > 50) {
          if(preyStats.pExhaustion < 1) throw new Error("Too exhausted for successful arousal");
          await predStats.increment({ arousal: 5 });
          // pleasure_crit
          interaction.editReply({ content: `${replaceVars(pleasure_crit[Math.floor(Math.random()*pleasure_crit.length)], ["pred", "prey"], [pred.name, prey.name])} (\`++Predator Arousal\`)` });
          exhaustion = exhaustion++;
        }
        if(pValue < 25) {
          if(preyStats.pExhaustion < 1) throw new Error("Too exhausted for neutral arousal");
          await predStats.increment({ arousal: 3 });
          // pleasure_pass
          interaction.editReply({ content: `${replaceVars(pleasure_pass[Math.floor(Math.random()*pleasure_pass.length)], ["pred", "prey"], [pred.name, prey.name])} (\`+Predator Arousal\`)` });
          exhaustion = exhaustion++;
        }
        if(pValue < 0) {
          if(preyStats.pExhaustion < 2) throw new Error("Too exhausted for failed arousal");
          // pleasure_fail
          interaction.editReply({ content: `${replaceVars(pleasure_fail[Math.floor(Math.random()*pleasure_fail.length)], ["pred", "prey"], [pred.name, prey.name])}` });
          exhaustion = exhaustion+2;
        }
        break;
      }
      default: {
        interaction.editReply({ content: "Don't scare me like that! You found something you're not supposed to. Tell a developer before you end up in my stomach... (Snack code: `ES-001`)" });
        break;
      }
      }
    } catch(e) {
      return interaction.editReply({ content: `${emojis.failure} | *You try to take an action but your body fails you. Your muscles won't move, you're too tired!*` });
    }

    return process.Stats.update({ pExhaustion: preyStats.pExhaustion-exhaustion }, { where: { character: digestion.prey }});
  }
};