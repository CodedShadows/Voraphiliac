/* eslint-disable */
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
  const predatorChar = chars[1];
  const preyStats = stats[0];
  const predatorStats = stats[1];
  const preyStatsToUpdate = toUpdate[0];
  const predStatsToUpdate = toUpdate[1];

  // Unused, but kept for future use
}
