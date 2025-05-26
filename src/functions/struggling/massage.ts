import { CommandInteraction } from 'discord.js';
import { default as responses } from '../../configs/responses.json' with { type: 'json' };
import { stats } from '../../models/stats.js';
import { CustomClient, StatsUpdateHolder } from '../../typings/Extensions.js';
import { characters } from '../../models/characters.js';
const { actions } = responses;

export const name = 'massage';
export async function execute(
  _client: CustomClient,
  interaction: CommandInteraction,
  chars: [characters, characters],
  stats: [stats, stats],
  toUpdate: [StatsUpdateHolder, StatsUpdateHolder],
  insertNames: (action: string[]) => string
): Promise<void> {
  const preyStats = stats[0];
  const preyStatsToUpdate = toUpdate[0];
  const predStatsToUpdate = toUpdate[1];

  if (preyStats.data.pExhaustion < 1) throw new Error('Too exhausted for massaging');
  predStatsToUpdate['sPower'] = -1;
  preyStatsToUpdate['defiance'] = -5;
  preyStatsToUpdate['pExhaustion'] = -1;
  // massage
  interaction.editReply({
    content: `${insertNames(actions.massage)} (\`-Arousal\` \`-Pred Digestive Strength\`)`
  });
}
