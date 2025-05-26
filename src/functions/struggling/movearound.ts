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

  const coinflip = Math.floor(Math.random() * 2);
  if (coinflip === 0) {
    if (preyStats.data.pExhaustion < 2) throw new Error('Too exhausted for failed movement');
    predStatsToUpdate['sPower'] = 1;
    preyStatsToUpdate['pExhaustion'] = 2;
    // move_fail
    interaction.editReply({
      content: `${insertNames(actions.move_fail)} (\`+Predator Strength\`)`
    });
  } else {
    if (preyStats.data.pExhaustion < 1) throw new Error('Too exhausted for successful movement');
    predStatsToUpdate['sPower'] = -2;
    preyStatsToUpdate['pExhaustion'] = 1;
    // move_pass
    interaction.editReply({
      content: `${insertNames(actions.move_pass)} (\`-Predator Strength\`)`
    });
  }
}
