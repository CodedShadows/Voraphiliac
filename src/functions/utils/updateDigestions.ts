import { Op } from 'sequelize';
import { stats } from '../../models/init-models.js';
import { CustomClient } from '../../typings/Extensions.js';

export const name = 'updateDigestions';
export async function execute(client: CustomClient, characterId: string): Promise<void> {
  const prey = await client.models.characters.findOne({ where: { characterId } });
  if (!prey) return; // Character doesn't exist
  const digestion = await client.models.digestions.findOne({
    where: { prey: characterId, status: { [Op.or]: ['Vored', 'Digesting'] } }
  });
  if (!digestion) return; // Character isn't being digested
  // Load stats
  const stats = await client.models.stats.findAll({
    where: { characterId: { [Op.or]: [digestion.predator, digestion.prey] } }
  });
  const predStats = stats.filter((s) => s.characterId === digestion.predator)[0];
  const preyStats = stats.filter((s) => s.characterId === digestion.prey)[0];
  // Handle digestion
  if (preyStats.data.health === 0) {
    digestion.update({ status: 'Digested' });
    predStats.data.health = 1;
    predStats.data.pExhaustion = 10;
    predStats.save();
    return;
  }
  // -- //
  let exhaustion = Math.floor((Date.now() - digestion.updatedAt.getTime()) / 3600000);
  if (exhaustion > 10) exhaustion = 10;
  if (preyStats.updatedAt > new Date(Date.now() - 21600)) return; // Old record not updated
  let health = 0;
  if (
    preyStats.data.arousal > 45 - predStats.data.resistance &&
    preyStats.data.euphoria - preyStats.data.defiance * 2 < 50
  )
    return; // Too aroused to heal
  if (preyStats.data.defiance > predStats.data.sResistance) health += 5;
  else if (preyStats.data.defiance === predStats.data.sResistance) health += 3;
  else health += 1;
  if (preyStats.data.health === 115) health = 0; // Full health, can't regen
  if (preyStats.data.health + health > 115) health = 115 - preyStats.data.health;
  health = health * Math.floor((Date.now() - preyStats.updatedAt.getTime()) / 21600000);
  // Data attr update
  preyStats.data.pExhaustion += exhaustion;
  preyStats.data.health += health;
  const p = [
    preyStats.save(),
    client.models.digestions.update({ voreUpdate: new Date() }, { where: { digestionId: digestion.digestionId } })
  ];
  await Promise.all(p);
  // -- //
  return;
}
