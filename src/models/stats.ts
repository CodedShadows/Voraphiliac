import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { characters, charactersId } from './characters.js';

export interface statsAttributes {
  statId: string;
  characterId: string;
  data: statsData;
}

export type statsData = {
  /**
   * @default 115
   * Health of a character
   */
  health: number;
  /**
   * @default 0
   * Overall arousal of a character. Uncapped
   * Prey massage and vore can increase this value
   */
  arousal: number;
  /**
   * @default 0
   * How likely a char is to escape. Uncapped
   * Increases through successful escapes
   */
  defiance: number;
  /**
   * @default 0
   * Pleasure a character receives from being inside. Uncapped.
   * Increases through failed escapes and other means
   */
  euphoria: number;
  /**
   * @default 0
   * How likely a character can resist stomach acids and digestion. Uncapped
   * Increases through successful resists (auto)
   */
  resistance: number;
  /**
   * @default 50
   * Health of the stomach (Or other carrying body)
   */
  sHealth: number;
  /**
   * @default 0
   * Current digestion power of the stomach
   */
  sPower: number;
  /**
   * @default 0
   * Resistance to prey struggling
   */
  sResistance: number;
  /**
   * @default 0
   * Current level of acids in the stomach
   * Can be: 1-4
   */
  acids: number;
  /**
   * @default 10
   * Amount of energy a predator has
   * Automatically regens, decreases on /digest
   */
  pExhaustion: number;
}

export type statsPk = 'statId';
export type statsId = stats[statsPk];
export type statsOptionalAttributes = null;
export type statsCreationAttributes = Optional<statsAttributes, statsOptionalAttributes>;

export class stats extends Model<statsAttributes, statsCreationAttributes> implements statsAttributes {
  declare statId: string;
  declare characterId: string;
  declare data: statsData;
  declare createdAt: Date;
  declare updatedAt: Date;

  // stats belongsTo characters via characterId
  declare character: characters;
  declare getCharacter: Sequelize.BelongsToGetAssociationMixin<characters>;
  declare setCharacter: Sequelize.BelongsToSetAssociationMixin<characters, charactersId>;
  declare createCharacter: Sequelize.BelongsToCreateAssociationMixin<characters>;

  static initModel(sequelize: Sequelize.Sequelize): typeof stats {
    return stats.init(
      {
        statId: {
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
        data: {
          type: DataTypes.JSON,
          allowNull: false,
          defaultValue: {
            health: 115,
            arousal: 0,
            defiance: 0,
            euphoria: 0,
            resistance: 0,
            sHealth: 50,
            sPower: 0,
            sResistance: 0,
            acids: 0,
            pExhaustion: 10
          },
          set(val: statsData) {
            const currData = this.getDataValue('data');
            // Acids = 1-4
            currData.acids = Math.max(0, Math.min(4, val.acids));
            this.setDataValue('data', currData);
          }
        }
      },
      {
        sequelize,
        tableName: 'stats',
        timestamps: true,
        indexes: [
          {
            name: 'PRIMARY',
            unique: true,
            using: 'BTREE',
            fields: [{ name: 'statId' }]
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
