import type { Sequelize } from 'sequelize';
import { characters as _characters } from './characters.js';
import type { charactersAttributes, charactersCreationAttributes } from './characters.js';
import { digestions as _digestions } from './digestions.js';
import type { digestionsAttributes, digestionsCreationAttributes } from './digestions.js';
import { images as _images } from './images.js';
import type { imagesAttributes, imagesCreationAttributes } from './images.js';
import { items as _items } from './items.js';
import type { itemsAttributes, itemsCreationAttributes } from './items.js';
import { mementos as _mementos } from './mementos.js';
import type { mementosAttributes, mementosCreationAttributes } from './mementos.js';
import { stats as _stats } from './stats.js';
import type { statsAttributes, statsCreationAttributes } from './stats.js';

export {
  _characters as characters,
  _digestions as digestions,
  _images as images,
  _items as items,
  _mementos as mementos,
  _stats as stats
};

export type {
  charactersAttributes,
  charactersCreationAttributes,
  digestionsAttributes,
  digestionsCreationAttributes,
  imagesAttributes,
  imagesCreationAttributes,
  itemsAttributes,
  itemsCreationAttributes,
  mementosAttributes,
  mementosCreationAttributes,
  statsAttributes,
  statsCreationAttributes
};

export function initModels(sequelize: Sequelize) {
  const characters = _characters.initModel(sequelize);
  const digestions = _digestions.initModel(sequelize);
  const images = _images.initModel(sequelize);
  const items = _items.initModel(sequelize);
  const mementos = _mementos.initModel(sequelize);
  const stats = _stats.initModel(sequelize);

  digestions.belongsTo(characters, { as: 'predator_character', foreignKey: 'predator' });
  characters.hasMany(digestions, { as: 'digestions', foreignKey: 'predator' });
  digestions.belongsTo(characters, { as: 'prey_character', foreignKey: 'prey' });
  characters.hasMany(digestions, { as: 'prey_digestions', foreignKey: 'prey' });
  images.belongsTo(characters, { as: 'character', foreignKey: 'characterId' });
  characters.hasOne(images, { as: 'images', foreignKey: 'characterId' });
  items.belongsTo(characters, { as: 'owner_character', foreignKey: 'owner' });
  characters.hasMany(items, { as: 'items', foreignKey: 'owner' });
  mementos.belongsTo(characters, { as: 'character', foreignKey: 'characterId' });
  characters.hasMany(mementos, { as: 'mementos', foreignKey: 'characterId' });
  stats.belongsTo(characters, { as: 'character', foreignKey: 'characterId' });
  characters.hasOne(stats, { as: 'stats', foreignKey: 'characterId' });

  return {
    characters: characters,
    digestions: digestions,
    images: images,
    items: items,
    mementos: mementos,
    stats: stats
  };
}
