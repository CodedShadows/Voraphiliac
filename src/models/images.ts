import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { characters, charactersId } from './characters.js';

export interface imagesAttributes {
  imageId: string;
  characterId: string;
  profile: string;
  vorePics: imagesVorePics;
}

export type imagesVorePics = {
  analPred: string;
  analPrey: string;
  breastPred: string;
  breastPrey: string;
  cockPred: string;
  cockPrey: string;
  oralPred: string;
  oralPrey: string;
  tailPred: string;
  tailPrey: string;
  unbirthPred: string;
  unbirthPrey: string;
};

export type imagesPk = 'imageId';
export type imagesId = images[imagesPk];
export type imagesOptionalAttributes = 'profile';
export type imagesCreationAttributes = Optional<imagesAttributes, imagesOptionalAttributes>;

export class images extends Model<imagesAttributes, imagesCreationAttributes> implements imagesAttributes {
  declare imageId: string;
  declare characterId: string;
  declare profile: string;
  declare vorePics: imagesVorePics;
  declare createdAt: Date;
  declare updatedAt: Date;

  // images belongsTo characters via characterId
  declare character: characters;
  declare getCharacter: Sequelize.BelongsToGetAssociationMixin<characters>;
  declare setCharacter: Sequelize.BelongsToSetAssociationMixin<characters, charactersId>;
  declare createCharacter: Sequelize.BelongsToCreateAssociationMixin<characters>;

  static initModel(sequelize: Sequelize.Sequelize): typeof images {
    return images.init(
      {
        imageId: {
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
        profile: {
          type: DataTypes.STRING(512),
          allowNull: false,
          defaultValue: 'https://tavis.page/files/3lufz9xn.jpg'
        },
        vorePics: {
          type: DataTypes.JSON,
          allowNull: false,
          defaultValue: {
            analPred: '',
            analPrey: '',
            breastPred: '',
            breastPrey: '',
            cockPred: '',
            cockPrey: '',
            oralPred: '',
            oralPrey: '',
            tailPred: '',
            tailPrey: '',
            unbirthPred: '',
            unbirthPrey: ''
          }
        }
      },
      {
        sequelize,
        tableName: 'images',
        timestamps: true,
        indexes: [
          {
            name: 'PRIMARY',
            unique: true,
            using: 'BTREE',
            fields: [{ name: 'imageId' }]
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
