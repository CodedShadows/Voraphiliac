// eslint-disable-next-line no-unused-vars
import { CommandInteraction, CommandInteractionOptionResolver, SlashCommandBuilder, StringSelectMenuOptionBuilder } from "discord.js";
import { emojis } from "../configs/config.json";
import { awaitMenu, replaceVars, updateDigestions } from "../functions";
import { CustomClient } from "../typings/Extensions";
import { Character, Digestion, Stats } from "../typings/Models";
import { digested } from "../configs/responses.json";

enum DigestionType {
  Massage = 0,
  Squeeze = 1,
  Crush = 2
}

module.exports = {
  name: "digest",
  data: new SlashCommandBuilder()
    .setName("digest")
    .setDescription("Digests specific or all prey inside you")
    .addStringOption((option) => {
      return option
        .setName("type")
        .setDescription("How you want to digest your prey")
        .setChoices(
          {
            name: "Massage",
            value: "Ease some pain your prey might be causing you"
          },
          {
            name: "Squeeze",
            value: "Become a bit more aggressive with those inside"
          },
          {
            name: "Crush",
            value: "Use a significant amount of energy to speed up the digestion process"
          }
        );
    })
    .addStringOption((option) => {
      return option
        .setName("selective")
        .setDescription("Select prey you want to digest?")
        .addChoices(
          {
            name: "Yes",
            value: "Yes"
          },
          {
            name: "No",
            value: "No"
          }
        );
    })
    .setNSFW(true),
  /**
   * @param {Client} client
   * @param {CommandInteraction} interaction
   * @param {CommandInteractionOptionResolver} options
   */
  async run(client: CustomClient, interaction: CommandInteraction, options: CommandInteractionOptionResolver) {
    if(!interaction.replied) await interaction.deferReply(); // In case of overload
    const active: Character = await client.models.Character.findOne({ where: { discordId: interaction.user.id, active: true } });
    if(!active) return interaction.editReply({ content: `${emojis.failure} | You don't have an active character!` });
    const type = DigestionType[options.getString("type") as keyof typeof DigestionType] || DigestionType.Massage;

    let dbPrey: Digestion[] = await client.models.Digestion.findAll({ where: { predator: active.characterId, status: ["Vored","Digesting"] } });
    let preyCharacters: Character[];
    if(options.getString("selective")) {
      if(!dbPrey.length) return interaction.editReply({ content: `${emojis.failure} | You don't have any prey to digest!` });
      const promises = dbPrey.map((p) => client.models.Character.findOne({ where: { characterId: p.prey } }));
      preyCharacters = await Promise.all(promises);

      const options = [];
      preyCharacters.forEach(p => options.push(new StringSelectMenuOptionBuilder({ label: p.name, value: String(p.characterId) })));
      options.push(new StringSelectMenuOptionBuilder({ label: "All", value: "all", description: `Digest all ${dbPrey.length} of your prey` }));
      const preyInteraction = await awaitMenu(interaction, 60_000, [1, dbPrey.length], options, "Select the prey you wish to digest", false);
      if(!preyInteraction || preyInteraction instanceof SyntaxError) return interaction.editReply({ content: `${emojis.failure} | You took too long to respond!` });

      if(!preyInteraction.values.includes("all")) dbPrey = preyCharacters.filter((p) => preyInteraction.values.includes(String(p.characterId)));
    } else {
      const promises = dbPrey.map((p) => client.models.Character.findOne({ where: { characterId: p.prey } }));
      preyCharacters = await Promise.all(promises);
    }
    const predStats = await active.getStat();
    // Check exhaustion
    if(predStats.pExhaustion < (Math.floor(preyCharacters.length/2)+type))
      return interaction.editReply({ content: `${emojis.failure} | You're too exhausted to digest ${predStats.pExhaustion === 0 ? "your" : "that much"} prey!` });
    // Store all results in Array
    const results: {prey: Character, stats: Stats, result: boolean}[] = [];
    for(const prey of preyCharacters) {
      // Generate value determining success
      let random = Math.ceil(Math.random()*20)-type;
      const preyStats = await prey.getStat();
      const differences = [active.height - prey.height, active.weight - prey.weight];
      // If prey is smaller, add more to random
      if(differences[0] > 0) random += Math.floor(differences[0]/5);
      if(differences[1] > 0) random += Math.floor(differences[1]/5);

      /**
       * Digestion relies on several factors.
       * - Stomach power (+)
       * - Stomach acids (+)
       * - Stomach health (+)
       * - Prey euphoria (+)
       * - Prey defiance (-)
       */
      if(random < (predStats.sPower + predStats.acids + predStats.sHealth - preyStats.defiance + preyStats.euphoria))
        results.push({ prey, stats: preyStats, result: true });
      else
        results.push({ prey, stats: preyStats, result: false });
    }
    // Await promises
    const aP: Promise<any>[] = [];
    // Increase acids by 2/10 chance
    if(Math.ceil(Math.random()*10) > 8 && predStats.acids === 10) aP.push(predStats.update({ acids: predStats.acids+1 }));
    // Decerase energy by the amount of prey digested (rounded down) times the type
    aP.push(predStats.update({ pExhaustion: predStats.pExhaustion-(Math.floor(preyCharacters.length/2)+type) }));
    // Handle success
    results.filter(v => v.result).forEach((v) => {
      let hpDecrease = Math.ceil(Math.random()*16);
      // Euphoria slows digestion
      hpDecrease -= Math.floor(v.stats.euphoria%3);
      // Type speeds up digestion
      hpDecrease += type*2;
      if(type === 2) hpDecrease += 25;
      if(hpDecrease < 0) hpDecrease = 0;
      aP.push(v.stats.update({ health: v.stats.health-hpDecrease }));
      aP.push(updateDigestions(v.prey.characterId));
    });
    // Await promises
    await Promise.all(aP);

    // Heal stomach
    if(type === DigestionType.Massage) await predStats.update({ sHealth: predStats.sHealth+5 });
    // Generate result text
    const parsedResults: string[] = results.map((v) => {
      const random = digested[Math.floor(Math.random()*digested.length)];
      if(v.stats.health <= 0)
        return replaceVars(random, ["prey", "pred"], [v.prey.name, active.name]);
      else
        return `While inside **${active.name}**, **${v.prey.name}** feels a bit softer than before. Their time is running out and they take some damage!`;
    });

    return interaction.editReply({ content: `You work your way with your prey and...\n> ${parsedResults.join("\n")}` });
  }
};