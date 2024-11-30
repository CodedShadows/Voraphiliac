import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import { ItemFlagsBitField } from '../typings/ModelBitField.js';
import type { characters, charactersId } from './characters.js';

export interface itemsAttributes {
  itemId: string;
  owner: string;
  data: itemsData;
}

export type itemsData = {
  name: string;
  description: string;
  flags: ItemFlagsBitField;
};

export type itemsPk = 'itemId';
export type itemsId = items[itemsPk];
export type itemsOptionalAttributes = null;
export type itemsCreationAttributes = Optional<itemsAttributes, itemsOptionalAttributes>;

export class items extends Model<itemsAttributes, itemsCreationAttributes> implements itemsAttributes {
  declare itemId: string;
  declare owner: string;
  declare data: itemsData;
  declare createdAt: Date;
  declare updatedAt: Date;

  // items belongsTo characters via owner
  declare owner_character: characters;
  declare getOwner_character: Sequelize.BelongsToGetAssociationMixin<characters>;
  declare setOwner_character: Sequelize.BelongsToSetAssociationMixin<characters, charactersId>;
  declare createOwner_character: Sequelize.BelongsToCreateAssociationMixin<characters>;

  static initModel(sequelize: Sequelize.Sequelize): typeof items {
    return items.init(
      {
        itemId: {
          type: DataTypes.UUID,
          allowNull: false,
          primaryKey: true,
          defaultValue: DataTypes.UUIDV4
        },
        owner: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'characters',
            key: 'characterId'
          }
        },
        data: {
          type: DataTypes.JSON,
          allowNull: false,
          defaultValue: {}
        }
      },
      {
        sequelize,
        tableName: 'items',
        timestamps: true,
        indexes: [
          {
            name: 'PRIMARY',
            unique: true,
            using: 'BTREE',
            fields: [{ name: 'itemId' }]
          },
          {
            name: 'owner',
            using: 'BTREE',
            fields: [{ name: 'owner' }]
          }
        ]
      }
    );
  }
}
