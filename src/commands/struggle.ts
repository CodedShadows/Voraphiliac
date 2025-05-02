import { SlashCommandBuilder } from 'discord.js';
import { Op } from 'sequelize';
import { default as config } from '../configs/config.json' with { type: 'json' };
import { default as responses } from '../configs/responses.json' with { type: 'json' };
import { CmdFileArgs } from '../typings/Extensions.js';
const { emojis } = config;
const { actions } = responses;

export const name = 'struggle';
export const data = new SlashCommandBuilder()
  .setName(name)
  .setDescription('Give your predator a hard time')
  .addStringOption((option) => {
    return option.setName('type').setDescription('The type of the escape attempt').setChoices(
      {
        name: 'Massage',
        value: 'Massage'
      },
      {
        name: 'Struggle',
        value: 'Struggle'
      },
      {
        name: 'Move Around',
        value: 'Move Around'
      },
      {
        name: 'Pleasure',
        value: 'Pleasure'
      }
    );
  })
  .setNSFW(true);
export async function execute({ client, interaction, options }: CmdFileArgs): Promise<void> {
  await interaction.deferReply(); // In case of overload
  let exhaustion = 0;
  const type = options.getString('type') ?? 'Struggle';
  const character = await client.models.characters.findOne({
    where: { discordId: interaction.user.id, active: true }
  });
  if (!character) {
    interaction.editReply({ content: `${emojis.failure} | You don't have an active character!` });
    return;
  }
  await client.functions.get('utils_updateDigestions').execute(client, character.characterId);
  const digestion = await client.models.digestions.findOne({
    where: { prey: character.characterId, status: { [Op.or]: ['Vored', 'Digesting'] } }
  });
  if (!digestion) {
    interaction.editReply({
      content: `${emojis.failure} | Oops, you're not inside a predator! Maybe try again later when you've found your way inside one`
    });
    return;
  }
  const stats = await client.models.stats.findAll({
    where: { characterId: { [Op.or]: [digestion.prey, digestion.predator] } }
  });
  if (stats.length < 2) {
    interaction.editReply({
      content: `${emojis.failure} | Something went wrong. Please verify your predator still exists (Run \`/profile list\` on your predator)`
    });
    return;
  }
  const predStats = stats.filter((s) => s.characterId === digestion.predator)[0];
  const preyStats = stats.filter((s) => s.characterId === digestion.prey)[0];
  const pred = await predStats.getCharacter();
  const prey = await preyStats.getCharacter();
  try {
    const insertNames = (content: string[]) =>
      client.functions.get('utils_replaceVars').execute(
        client,
        // Used for all responses. Simplifies the copy/paste process
        content[Math.floor(Math.random() * content.length)],
        ['pred', 'prey'],
        [pred.data.name, prey.data.name]
      ) as unknown as string; // Non-async function
    switch (type) {
      case 'Massage': {
        if (preyStats.data.pExhaustion < 1) throw new Error('Too exhausted for massaging');
        predStats.data = {
          ...predStats.data,
          sPower: predStats.data.sPower - 1
        };
        preyStats.data = {
          ...preyStats.data,
          defiance: preyStats.data.defiance - 5
        };
        await Promise.all([predStats.save(), preyStats.save()]);
        // massage
        interaction.editReply({
          content: `${insertNames(actions.massage)} (\`-Arousal\` \`-Pred Digestive Strength\`)`
        });
        exhaustion = exhaustion++;
        break;
      }
      case 'Struggle': {
        // Success is default 0-100
        let success = Math.floor(Math.random() * 100);
        /**
         * Success is calculated by:
         * - Defiance/1.5 (+)
         * - Stomach power (-)
         * - Euphoria (-)
         */
        success += preyStats.data.defiance / 1.5 - predStats.data.sPower - preyStats.data.euphoria;
        if (success > predStats.data.sResistance * 2 + predStats.data.sPower + 10) {
          if (preyStats.data.pExhaustion < 2) throw new Error('Too exhausted for successful struggle');
          const newPred = await client.models.digestions.findOne({
            where: { prey: digestion.predator, status: { [Op.or]: ['Vored', 'Digesting', 'Digested'] } }
          });
          if (newPred) {
            await client.models.digestions.update(
              { status: 'Vored', predator: newPred.predator, voreUpdate: new Date() },
              { where: { prey: prey.characterId } }
            );
            // struggle_pass_pred
            interaction.editReply({
              content: `${insertNames(actions.struggle_pass_pred)} (\`+Defiance\`)`
            });
          } else {
            await client.models.digestions.update(
              { status: 'Escaped' },
              { where: { digestionId: digestion.digestionId } }
            );
            // struggle_pass
            interaction.editReply({
              content: `${insertNames(actions.struggle_pass)} (\`+Defiance\`)`
            });
          }
          preyStats.data.defiance += 5;
          preyStats.data.euphoria -= 1;
          exhaustion = exhaustion + 2;
        } else {
          if (preyStats.data.pExhaustion < 3) throw new Error('Too exhausted for failed struggle');
          predStats.data.sPower += 5;
          // struggle_fail
          interaction.editReply({
            content: `${insertNames(actions.struggle_fail)} (\`+Predator Strength\`)`
          });
        }
        break;
      }
      case 'MoveAround': {
        const flip = Math.floor(Math.random() * 2);
        if (flip === 0) {
          if (preyStats.data.pExhaustion < 2) throw new Error('Too exhausted for failed movement');
          predStats.data.sPower += 1;
          // move_fail
          interaction.editReply({
            content: `${insertNames(actions.move_fail)} (\`+Predator Strength\`)`
          });
          exhaustion = exhaustion + 2;
        } else {
          if (preyStats.data.pExhaustion < 1) throw new Error('Too exhausted for successful movement');
          predStats.data.sPower -= 2;
          // move_pass
          interaction.editReply({
            content: `${insertNames(actions.move_pass)} (\`-Predator Strength\`)`
          });
          exhaustion = exhaustion++;
        }
        break;
      }
      case 'Pleasure': {
        const pValue = Math.ceil(Math.random() * 100);
        if (pValue > 50) {
          if (preyStats.data.pExhaustion < 1) throw new Error('Too exhausted for successful arousal');
          predStats.data.arousal += 5;
          // pleasure_crit
          interaction.editReply({
            content: `${insertNames(actions.pleasure_crit)} (\`++Predator Arousal\`)`
          });
          exhaustion = exhaustion++;
        }
        if (pValue < 25) {
          if (preyStats.data.pExhaustion < 1) throw new Error('Too exhausted for neutral arousal');
          predStats.data.arousal += 3;
          // pleasure_pass
          interaction.editReply({
            content: `${insertNames(actions.pleasure_pass)} (\`+Predator Arousal\`)`
          });
          exhaustion = exhaustion++;
        }
        if (pValue < 0) {
          if (preyStats.data.pExhaustion < 2) throw new Error('Too exhausted for failed arousal');
          // pleasure_fail
          interaction.editReply({
            content: `${insertNames(actions.pleasure_fail)}`
          });
          exhaustion = exhaustion + 2;
        }
        break;
      }
      default: {
        interaction.editReply({
          content:
            "Don't scare me like that! You found something you're not supposed to. Tell a developer before you end up in my stomach~ (Snack code: `SG-001`)"
        });
        break;
      }
    }
  } catch (_e) {
    interaction.editReply({
      content: `${emojis.failure} | *You try to take an action but your body fails you. Your muscles won't move, you're too tired!*`
    });
    return;
  }

  preyStats.data = {
    ...preyStats.data,
    pExhaustion: preyStats.data.pExhaustion - exhaustion
  };
  preyStats.save();
  predStats.save();
  return;
}
