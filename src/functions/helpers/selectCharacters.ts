import { characters } from '../../models/characters.js';
import { CustomClient } from '../../typings/Extensions.js';

export const name = 'selectCharacters';
export async function execute(client: CustomClient, characters: characters[], selector: string): Promise<characters[]> {
  if (selector === '*') {
    return characters;
  }

  const selectorArray = selector.split(',').map((prey) => prey.trim());

  return characters.filter((char) => selectorArray.includes(char.data.name));
}
