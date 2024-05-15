// eslint-disable-next-line no-unused-vars
import { CommandInteraction, CommandInteractionOptionResolver, SlashCommandBuilder } from "discord.js";
import { massage, move_fail, move_pass, pleasure_crit, pleasure_fail, pleasure_pass, struggle_fail, struggle_pass_pred, struggle_pass } from "../configs/responses.json";
import { Op } from "sequelize";
import { updateDigestions, replaceVars } from "../functions";
import { CustomClient } from "../typings/Extensions";
import { Character, Digestion, Stats } from "../typings/Models";
import { emojis } from "../configs/config.json";

module.exports = {
  name: "struggle",
  data: new SlashCommandBuilder()
  .setName("struggle")
  .setDescription("Give your predator a hard time")
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
  })
  .setNSFW(true),
  /**
   * @param {CustomClient} client
   * @param {CommandInteraction} interaction
   * @param {CommandInteractionOptionResolver} options
   */
  // skipcq: JS-0044
  run: async (client: CustomClient, interaction: CommandInteraction, options: CommandInteractionOptionResolver) => {
    if(!interaction.replied) await interaction.deferReply(); // In case of overload
    let exhaustion = 0;
    let type = options.getString("type") ?? "Struggle";
    const character: Character = await client.models.Character.findOne({ where: { discordId: interaction.user.id, active: true } });
    if(!character) return interaction.editReply({ content: `${emojis.failure} | You don't have an active character!` });
    await updateDigestions(character.characterId);
    const digestion: Digestion = await client.models.Digestion.findOne({ where: { prey: character.characterId, status: {[Op.or]: ["Vored", "Digesting"]} } });
    if(!digestion)
      return interaction.editReply({ content: `${emojis.failure} | Oops, you're not inside a predator! Maybe try again later when you've found your way inside one` });
    const stats: Stats[] = await client.models.Stats.findAll({ where: { characterId: {[Op.or]: [digestion.prey, digestion.predator]} } });
    if(stats.length < 2) return interaction.editReply({ content: `${emojis.failure} | Something went wrong. Please verify your predator still exists (Run \`/profile list\` on your predator)` });
    const predStats: Stats = stats.filter(s => s.characterId === digestion.predator)[0];
    const preyStats: Stats = stats.filter(s => s.characterId === digestion.prey)[0];
    const pred = await predStats.getCharacter();
    const prey = await preyStats.getCharacter();
    try {
      switch(type) {
      case "Massage": {
        if(preyStats.pExhaustion < 1) throw new Error("Too exhausted for massaging");
        await Promise.all(
          client.models.Stats.update({sPower: predStats.sPower - 1}, { where: { characterId: digestion.predator } }),
          // @ts-expect-error Multiple passed update() not typed properly
          client.models.Stats.update({defiance: preyStats.arousal - 5}, { where: { characterId: digestion.prey } })
        );
        // massage
        interaction.editReply({ content: `${replaceVars(massage[Math.floor(Math.random()*massage.length)], ["pred", "prey"], [pred.name, prey.name])} (\`-Arousal\` \`-Pred Digestive Strength\`)` });
        exhaustion = exhaustion++;
        break;
      }
      case "Struggle": {
        // Success is default 0-100
        let success = Math.floor(Math.random() * 100);
        /**
         * Success is calculated by:
         * - Defiance/1.5 (+)
         * - Stomach power (-)
         * - Euphoria (-)
         */
        success += (preyStats.defiance/1.5) - predStats.sPower - preyStats.euphoria;
        if(success > ((predStats.sResistance * 2) + predStats.sPower + 10)) {
          if(preyStats.pExhaustion < 2) throw new Error("Too exhausted for successful struggle");
          const newPred: Digestion = await client.models.Digestion.findOne({ where: { prey: digestion.predator, status: {[Op.or]: ["Vored", "Digesting", "Digested"]} } });
          if(newPred) {
            await client.models.Digestion.update({ status: "Vored", predator: newPred.predator, voreUpdate: new Date() }, { where: { prey: prey.characterId } });
            // struggle_pass_pred
            interaction.editReply({ content: `${replaceVars(struggle_pass_pred[Math.floor(Math.random()*struggle_pass_pred.length)], ["prey", "pred"], [pred.name, prey.name])} (\`+Defiance\`)` });
          } else {
            await client.models.Digestion.update({ status: "Free" }, { where: { dId: digestion.dId } });
            // struggle_pass
            interaction.editReply({ content: `${replaceVars(struggle_pass[Math.floor(Math.random()*struggle_pass.length)], ["pred", "prey"], [pred.name, prey.name])} (\`+Defiance\`)` });
          }
          await preyStats.update({ defiance: preyStats.defiance+5, euphoria: preyStats.euphoria-1 });
          exhaustion = exhaustion+2;
        } else {
          if(preyStats.pExhaustion < 3) throw new Error("Too exhausted for failed struggle");
          await client.models.Stats.update({
            strength: predStats.sPower + 5
          }, { where: { characterId: digestion.predator } });
          // struggle_fail
          interaction.editReply({ content: `${replaceVars(struggle_fail[Math.floor(Math.random()*struggle_fail.length)], ["pred", "prey"], [pred.name, prey.name])} (\`+Predator Strength\`)` });
        }
        break;
      }
      case "MoveAround": {
        const flip = Math.floor(Math.random() * 2);
        if(flip === 0) {
          if(preyStats.pExhaustion < 2) throw new Error("Too exhausted for failed movement");
          await client.models.Stats.update({
            sPower: predStats.sPower+1
          }, { where: { characterId: digestion.predator } });
          // move_fail
          interaction.editReply({ content: `${replaceVars(move_fail[Math.floor(Math.random()*move_fail.length)], ["pred", "prey"], [pred.name, prey.name])} (\`+Predator Strength\`)` });
          exhaustion = exhaustion+2;
        } else {
          if(preyStats.pExhaustion < 1) throw new Error("Too exhausted for successful movement");
          await client.models.Stats.update({
            sPower: predStats.sPower-2
          }, { where: { characterId: digestion.predator } });
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
          await predStats.update({ arousal: predStats.arousal+5 });
          // pleasure_crit
          interaction.editReply({ content: `${replaceVars(pleasure_crit[Math.floor(Math.random()*pleasure_crit.length)], ["pred", "prey"], [pred.name, prey.name])} (\`++Predator Arousal\`)` });
          exhaustion = exhaustion++;
        }
        if(pValue < 25) {
          if(preyStats.pExhaustion < 1) throw new Error("Too exhausted for neutral arousal");
          await predStats.update({ arousal: predStats.arousal+3 });
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
        interaction.editReply({ content: "Don't scare me like that! You found something you're not supposed to. Tell a developer before you end up in my stomach~ (Snack code: `SG-001`)" });
        break;
      }
      }
    } catch(e) {
      return interaction.editReply({ content: `${emojis.failure} | *You try to take an action but your body fails you. Your muscles won't move, you're too tired!*` });
    }

    return client.models.Stats.update({ pExhaustion: preyStats.pExhaustion-exhaustion }, { where: { characterId: digestion.prey }});
  }
};