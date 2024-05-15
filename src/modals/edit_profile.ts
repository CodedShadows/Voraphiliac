import { ModalSubmitInteraction, ModalSubmitFields } from "discord.js";
import { CustomClient } from "../typings/Extensions";
import { interactionEmbed, toConsole } from "../functions.js";
import { Character } from "../typings/Models";
import { emojis } from "../configs/config.json";

module.exports = {
  name: "edit_profile",
  /**
   * @param {CustomClient} client
   * @param {ModalSubmitInteraction} interaction
   * @param {ModalSubmitFields} fields
   */
  run: async (client: CustomClient, interaction: ModalSubmitInteraction, fields: ModalSubmitFields) => {
    if(!interaction.replied) await interaction.deferUpdate(); // In case of overload
    const char: Character = await client.models.Character.findOne({ where: { discordId: interaction.user.id, active: true } });
    const data = fields.fields.first();
    const r1 = /^[0-9]{0,10}(?:\.[0-9]{1,3})?$/;
    let content = data.value;

    if(!char) return interaction.editReply({ content: `${emojis.failure} | You do not have an active character`, components: [] });
    try {
      switch(data.customId) {
      case "role": {
        if(!/^(Pred(ator)? Switch|(Apex )?Pred(ator)?)|(Switch)|(Prey( Switch)?)$/i.test(data.value)) return interactionEmbed(3, "[ERR-ARGS]", "Please enter a valid vore role. Pred can be substituted for Predator. (`Apex Pred`, `Pred`, `Pred Switch`, `Switch`, `Prey Switch`, or `Prey`)", interaction, client, [true, 10]);
        content = /^(Pred(ator)? Switch|(Apex )?Pred(ator)?)|(Switch)|(Prey( Switch)?)$/i.exec(data.value)[0].toLowerCase(); // skipcq: JS-D007
        break;
      }
      case "height": {
        if(!r1.test(data.value))
          return interaction.editReply({ content: `${emojis.failure} | Your height must be a number up to ten digits with a maximum of three decimal places (Ex. \`12.34\`, \`.123\`, \`1234567890.123\`)`, components: [] });
        break;
      }
      case "weight": {
        if(!r1.test(data.value))
          return interaction.editReply({ content: `${emojis.failure} | Your weight must be a number up to ten digits with a maximum of three decimal places (Ex. \`12.34\`, \`.123\`, \`1234567890.123\`)`, components: [] });
        break;
      }
      }
    } catch(err) {
      toConsole(err, new Error().stack, client);
      return interaction.editReply({ content: `${emojis.failure} | Something happened and I lost my food while updating the ${data.value}! Report this to a developer (Snack code: \`EPF-001\`)`, components: [] });
    }
    // Update database
    try {
      client.models.Character.update({ [data.customId]: content }, { where: { characterId: char.characterId } });
      return interaction.editReply({ content: `${emojis.success} | Successfully updated ${data.customId}:\n\`${content}\``, components: [] });
    } catch(err) {
      toConsole(err, new Error().stack, client);
      return interaction.editReply({ content: `${emojis.failure} | Something happened and I lost my food while updating the ${data.value}! Report this to a developer (Snack code: \`EPF-002\`)`, components: [] });
    }
  }
};