import { characters } from '../../models/characters.js';
import { CustomClient } from '../../typings/Extensions.js';

export const name = 'calcSuccess';
export async function execute(
  _client: CustomClient,
  prey: characters,
  predator: characters,
  digestionKind: number
): Promise<{ prey: string; success: boolean }> {
  const preyStats = await prey.getStats();
  const predStats = await predator.getStats();

  let random = Math.ceil(Math.random() * 20) - digestionKind;
  const heightDiff = predator.data.height - prey.data.height;
  const weightDiff = predator.data.weight - prey.data.weight;

  // Account for height and weight differences
  // TODO: Calculate neutral and negative values
  if (heightDiff > 0) random += Math.floor(heightDiff / 5);
  if (weightDiff > 0) random += Math.floor(weightDiff / 5);

  const successThreshold =
    predStats.data.sPower +
    predStats.data.acids +
    predStats.data.sHealth -
    preyStats.data.defiance +
    preyStats.data.euphoria;
  return { prey: prey.characterId, success: random < successThreshold };
}
