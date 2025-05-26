import { CommandInteraction } from 'discord.js';
import { default as responses } from '../../configs/responses.json' with { type: 'json' };
import { characters } from '../../models/characters.js';
import { stats } from '../../models/stats.js';
import { CustomClient, StatsUpdateHolder } from '../../typings/Extensions.js';
const { actions } = responses;

export const name = 'massage';
export async function execute(
  client: CustomClient,
  interaction: CommandInteraction,
  chars: [characters, characters],
  stats: [stats, stats],
  toUpdate: [StatsUpdateHolder, StatsUpdateHolder],
  insertNames: (action: string[]) => string
): Promise<void> {
  const preyChar = chars[0];
  const preyStats = stats[0];
  const predatorStats = stats[1];
  const preyStatsToUpdate = toUpdate[0];

  const digestion = await client.models.digestions.findOne({
    where: { prey: preyChar.characterId, status: ['Vored', 'Digesting'] }
  });
  if (!digestion) {
    throw new Error("Oops, you're not inside a predator! Maybe try again later when you've found your way inside one");
  }

  const diffCheck = predatorStats.data.sResistance * 2 + predatorStats.data.sPower + 10;
  // Success is default 0-100
  let success = Math.floor(Math.random() * (diffCheck * 1.25));
  /**
   * Success is adjusted by:
   * - Defiance/1.5 (+)
   * - Stomach power (-)
   * - Euphoria (-)
   */
  success += preyStats.data.defiance / 1.5 - predatorStats.data.sPower - preyStats.data.euphoria;
  if (success <= diffCheck) {
    if (preyStats.data.pExhaustion < 3) throw new Error('Too exhausted for failed struggle');
    preyStatsToUpdate['sPower'] = 5;
    interaction.editReply({
      content: `${insertNames(actions.struggle_fail)} (\`+Predator Strength\`)`
    });
    return;
  }

  if (preyStats.data.pExhaustion < 2) throw new Error('Too exhausted for successful struggle');

  // If the struggle is successful, check if the prey escapes into another predator
  const newPred = await client.models.digestions.findOne({
    where: { prey: digestion.predator, status: ['Vored', 'Digesting', 'Digested'] }
  });

  if (newPred) {
    await client.models.digestions.update(
      { status: 'Vored', predator: newPred.predator, voreUpdate: new Date() },
      { where: { prey: preyChar.characterId } }
    );
    // struggle_pass_pred
    interaction.editReply({
      content: `${insertNames(actions.struggle_pass_pred)} (\`+Defiance\`)`
    });
  } else {
    await client.models.digestions.update({ status: 'Escaped' }, { where: { digestionId: digestion.digestionId } });
    // struggle_pass
    interaction.editReply({
      content: `${insertNames(actions.struggle_pass)} (\`+Defiance\`)`
    });
  }

  preyStatsToUpdate['defiance'] = 5;
  preyStatsToUpdate['euphoria'] = -1;
  preyStatsToUpdate['pExhaustion'] = -2;
  return;
}
