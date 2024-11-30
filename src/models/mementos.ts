import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import { MementoFlagsBitField } from '../typings/ModelBitField.js';
import type { characters, charactersId } from './characters.js';

export interface mementosAttributes {
  mementoId: string;
  characterId: string;
  originalOwner?: string;
  data: mementosData;
}

export type mementosData = {
  title: string;
  description: string;
  image: string;
  flags: MementoFlagsBitField;
};

export type mementosPk = 'mementoId';
export type mementosId = mementos[mementosPk];
export type mementosOptionalAttributes = 'originalOwner';
export type mementosCreationAttributes = Optional<mementosAttributes, mementosOptionalAttributes>;

export class mementos extends Model<mementosAttributes, mementosCreationAttributes> implements mementosAttributes {
  declare mementoId: string;
  declare characterId: string;
  declare originalOwner?: string;
  declare data: mementosData;
  declare createdAt: Date;
  declare updatedAt: Date;

  // mementos belongsTo characters via characterId
  declare character: characters;
  declare getCharacter: Sequelize.BelongsToGetAssociationMixin<characters>;
  declare setCharacter: Sequelize.BelongsToSetAssociationMixin<characters, charactersId>;
  declare createCharacter: Sequelize.BelongsToCreateAssociationMixin<characters>;

  static initModel(sequelize: Sequelize.Sequelize): typeof mementos {
    return mementos.init(
      {
        mementoId: {
          type: DataTypes.UUID,
          allowNull: false,
          primaryKey: true,
          defaultValue: DataTypes.UUIDV4
        },
        characterId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'characters',
            key: 'characterId'
          }
        },
        originalOwner: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'characters',
            key: 'characterId'
          }
        },
        data: {
          type: DataTypes.JSON,
          allowNull: false,
          defaultValue: {
            title: '',
            description: '',
            image: '',
            flags: 0
          }
        }
      },
      {
        sequelize,
        tableName: 'mementos',
        timestamps: true,
        indexes: [
          {
            name: 'PRIMARY',
            unique: true,
            using: 'BTREE',
            fields: [{ name: 'mementoId' }]
          },
          {
            name: 'characterId',
            using: 'BTREE',
            fields: [{ name: 'characterId' }]
          }
        ]
      }
    );
  }
}
