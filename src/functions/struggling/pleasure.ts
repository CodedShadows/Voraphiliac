import { CommandInteraction } from 'discord.js';
import { default as responses } from '../../configs/responses.json' with { type: 'json' };
import { characters } from '../../models/characters.js';
import { stats } from '../../models/stats.js';
import { CustomClient, StatsUpdateHolder } from '../../typings/Extensions.js';
const { actions } = responses;

export const name = 'massage';
export async function execute(
  _client: CustomClient,
  interaction: CommandInteraction,
  _chars: [characters, characters],
  stats: [stats, stats],
  toUpdate: [StatsUpdateHolder, StatsUpdateHolder],
  insertNames: (action: string[]) => string
): Promise<void> {
  const preyStats = stats[0];
  const preyStatsToUpdate = toUpdate[0];
  const predStatsToUpdate = toUpdate[1];

  const pValue = Math.ceil(Math.random() * 100);
  if (pValue > 75) {
    if (preyStats.data.pExhaustion < 1) throw new Error('Too exhausted for successful arousal');
    predStatsToUpdate['arousal'] = 5;
    preyStatsToUpdate['pExhaustion'] = 1;
    // pleasure_crit
    interaction.editReply({
      content: `${insertNames(actions.pleasure_crit)} (\`++Predator Arousal\`)`
    });
  } else if (pValue > 25) {
    if (preyStats.data.pExhaustion < 1) throw new Error('Too exhausted for neutral arousal');
    predStatsToUpdate['arousal'] = 3;
    preyStatsToUpdate['pExhaustion'] = 1;
    // pleasure_pass
    interaction.editReply({
      content: `${insertNames(actions.pleasure_pass)} (\`+Predator Arousal\`)`
    });
  } else {
    if (preyStats.data.pExhaustion < 2) throw new Error('Too exhausted for failed arousal');
    // pleasure_fail
    interaction.editReply({
      content: `${insertNames(actions.pleasure_fail)}`
    });
    preyStatsToUpdate['pExhaustion'] = 2;
  }

  return;
}
