import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { digestions, digestionsId } from './digestions.js';
import type { images, imagesId } from './images.js';
import type { items, itemsId } from './items.js';
import type { mementos, mementosId } from './mementos.js';
import type { stats, statsId } from './stats.js';

export interface charactersAttributes {
  characterId: string;
  discordId: string;
  active: boolean;
  data: charactersData;
  pref: charactersPreferences;
}

export type charactersData = {
  name: string;
  role: string;
  description: string;
  gender: string;
  species: string;
  weight: number;
  height: number;
};
export type charactersPreferences = {
  whitelist: string[];
  blacklist: string[];
  autodigest: boolean;
  /** @deprecated Old property no longer used */
  lastDigest: string;
};

export type charactersPk = 'characterId';
export type charactersId = characters[charactersPk];
export type charactersOptionalAttributes = 'active';
export type charactersCreationAttributes = Optional<charactersAttributes, charactersOptionalAttributes>;

export class characters
  extends Model<charactersAttributes, charactersCreationAttributes>
  implements charactersAttributes
{
  declare characterId: string;
  declare discordId: string;
  declare active: boolean;
  declare data: charactersData;
  declare pref: charactersPreferences;
  declare createdAt: Date;
  declare updatedAt: Date;

  // characters hasMany digestions via predator
  declare digestions: digestions[];
  declare getDigestions: Sequelize.HasManyGetAssociationsMixin<digestions>;
  declare setDigestions: Sequelize.HasManySetAssociationsMixin<digestions, digestionsId>;
  declare addDigestion: Sequelize.HasManyAddAssociationMixin<digestions, digestionsId>;
  declare addDigestions: Sequelize.HasManyAddAssociationsMixin<digestions, digestionsId>;
  declare createDigestion: Sequelize.HasManyCreateAssociationMixin<digestions>;
  declare removeDigestion: Sequelize.HasManyRemoveAssociationMixin<digestions, digestionsId>;
  declare removeDigestions: Sequelize.HasManyRemoveAssociationsMixin<digestions, digestionsId>;
  declare hasDigestion: Sequelize.HasManyHasAssociationMixin<digestions, digestionsId>;
  declare hasDigestions: Sequelize.HasManyHasAssociationsMixin<digestions, digestionsId>;
  declare countDigestions: Sequelize.HasManyCountAssociationsMixin;
  // characters hasMany digestions via prey
  declare prey_digestions: digestions[];
  declare getPrey_digestions: Sequelize.HasManyGetAssociationsMixin<digestions>;
  declare setPrey_digestions: Sequelize.HasManySetAssociationsMixin<digestions, digestionsId>;
  declare addPrey_digestion: Sequelize.HasManyAddAssociationMixin<digestions, digestionsId>;
  declare addPrey_digestions: Sequelize.HasManyAddAssociationsMixin<digestions, digestionsId>;
  declare createPrey_digestion: Sequelize.HasManyCreateAssociationMixin<digestions>;
  declare removePrey_digestion: Sequelize.HasManyRemoveAssociationMixin<digestions, digestionsId>;
  declare removePrey_digestions: Sequelize.HasManyRemoveAssociationsMixin<digestions, digestionsId>;
  declare hasPrey_digestion: Sequelize.HasManyHasAssociationMixin<digestions, digestionsId>;
  declare hasPrey_digestions: Sequelize.HasManyHasAssociationsMixin<digestions, digestionsId>;
  declare countPrey_digestions: Sequelize.HasManyCountAssociationsMixin;
  // characters hasOne images via characterId
  declare images: images;
  declare getImages: Sequelize.HasOneGetAssociationMixin<images>;
  declare setImages: Sequelize.HasOneSetAssociationMixin<images, imagesId>;
  declare createImages: Sequelize.HasOneCreateAssociationMixin<images>;
  // characters hasMany items via owner
  declare items: items[];
  declare getItems: Sequelize.HasManyGetAssociationsMixin<items>;
  declare setItems: Sequelize.HasManySetAssociationsMixin<items, itemsId>;
  declare addItem: Sequelize.HasManyAddAssociationMixin<items, itemsId>;
  declare addItems: Sequelize.HasManyAddAssociationsMixin<items, itemsId>;
  declare createItem: Sequelize.HasManyCreateAssociationMixin<items>;
  declare removeItem: Sequelize.HasManyRemoveAssociationMixin<items, itemsId>;
  declare removeItems: Sequelize.HasManyRemoveAssociationsMixin<items, itemsId>;
  declare hasItem: Sequelize.HasManyHasAssociationMixin<items, itemsId>;
  declare hasItems: Sequelize.HasManyHasAssociationsMixin<items, itemsId>;
  declare countItems: Sequelize.HasManyCountAssociationsMixin;
  // characters hasMany mementos via characterId
  declare mementos: mementos[];
  declare getMementos: Sequelize.HasManyGetAssociationsMixin<mementos>;
  declare setMementos: Sequelize.HasManySetAssociationsMixin<mementos, mementosId>;
  declare addMemento: Sequelize.HasManyAddAssociationMixin<mementos, mementosId>;
  declare addMementos: Sequelize.HasManyAddAssociationsMixin<mementos, mementosId>;
  declare createMemento: Sequelize.HasManyCreateAssociationMixin<mementos>;
  declare removeMemento: Sequelize.HasManyRemoveAssociationMixin<mementos, mementosId>;
  declare removeMementos: Sequelize.HasManyRemoveAssociationsMixin<mementos, mementosId>;
  declare hasMemento: Sequelize.HasManyHasAssociationMixin<mementos, mementosId>;
  declare hasMementos: Sequelize.HasManyHasAssociationsMixin<mementos, mementosId>;
  declare countMementos: Sequelize.HasManyCountAssociationsMixin;
  // characters hasOne stats via characterId
  declare stats: stats;
  declare getStats: Sequelize.HasOneGetAssociationMixin<stats>;
  declare setStats: Sequelize.HasOneSetAssociationMixin<stats, statsId>;
  declare createStats: Sequelize.HasOneCreateAssociationMixin<stats>;

  static initModel(sequelize: Sequelize.Sequelize): typeof characters {
    return characters.init(
      {
        characterId: {
          type: DataTypes.UUID,
          allowNull: false,
          primaryKey: true,
          defaultValue: DataTypes.UUIDV4
        },
        discordId: {
          type: DataTypes.TEXT,
          allowNull: false
        },
        active: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        data: {
          type: DataTypes.JSON,
          allowNull: false,
          defaultValue: {
            name: '',
            role: '',
            description: ''
          }
        },
        pref: {
          type: DataTypes.JSON,
          allowNull: false,
          defaultValue: {
            whitelist: [],
            blacklist: [],
            autodigest: false
          }
        }
      },
      {
        sequelize,
        tableName: 'characters',
        timestamps: true,
        indexes: [
          {
            name: 'PRIMARY',
            unique: true,
            using: 'BTREE',
            fields: [{ name: 'characterId' }]
          }
        ]
      }
    );
  }
}
