import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { characters, charactersId } from './characters.js';

export interface digestionsAttributes {
  digestionId: string;
  status: 'Voring' | 'Vored' | 'Digesting' | 'Digested' | 'Reformed' | 'Escaped';
  type: string;
  predator?: string;
  prey?: string;
  voreUpdate: Date;
}

export type digestionsPk = 'digestionId';
export type digestionsId = digestions[digestionsPk];
export type digestionsOptionalAttributes = 'status' | 'type' | 'predator' | 'prey' | 'voreUpdate';
export type digestionsCreationAttributes = Optional<digestionsAttributes, digestionsOptionalAttributes>;

export class digestions
  extends Model<digestionsAttributes, digestionsCreationAttributes>
  implements digestionsAttributes
{
  declare digestionId: string;
  declare status: 'Voring' | 'Vored' | 'Digesting' | 'Digested' | 'Reformed' | 'Escaped';
  declare type: string;
  declare predator?: string;
  declare prey?: string;
  declare voreUpdate: Date;
  declare createdAt: Date;
  declare updatedAt: Date;

  // digestions belongsTo characters via predator
  declare predator_character: characters;
  declare getPredator_character: Sequelize.BelongsToGetAssociationMixin<characters>;
  declare setPredator_character: Sequelize.BelongsToSetAssociationMixin<characters, charactersId>;
  declare createPredator_character: Sequelize.BelongsToCreateAssociationMixin<characters>;
  // digestions belongsTo characters via prey
  declare prey_character: characters;
  declare getPrey_character: Sequelize.BelongsToGetAssociationMixin<characters>;
  declare setPrey_character: Sequelize.BelongsToSetAssociationMixin<characters, charactersId>;
  declare createPrey_character: Sequelize.BelongsToCreateAssociationMixin<characters>;

  static initModel(sequelize: Sequelize.Sequelize): typeof digestions {
    return digestions.init(
      {
        digestionId: {
          type: DataTypes.UUID,
          allowNull: false,
          primaryKey: true,
          defaultValue: DataTypes.UUIDV4
        },
        status: {
          type: DataTypes.ENUM,
          allowNull: false,
          defaultValue: 'Voring',
          values: ['Voring', 'Vored', 'Digesting', 'Digested', 'Reformed', 'Escaped']
        },
        type: {
          type: DataTypes.STRING(10),
          allowNull: false,
          defaultValue: 'oral'
        },
        predator: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'characters',
            key: 'characterId'
          }
        },
        prey: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'characters',
            key: 'characterId'
          }
        },
        voreUpdate: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.Sequelize.fn('now')
        }
      },
      {
        sequelize,
        tableName: 'digestions',
        timestamps: true,
        indexes: [
          {
            name: 'PRIMARY',
            unique: true,
            using: 'BTREE',
            fields: [{ name: 'digestionId' }]
          },
          {
            name: 'predator',
            using: 'BTREE',
            fields: [{ name: 'predator' }]
          },
          {
            name: 'prey',
            using: 'BTREE',
            fields: [{ name: 'prey' }]
          }
        ]
      }
    );
  }
}
