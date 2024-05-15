import { Model } from "sequelize";
import ItemFlagsBitField from "./ItemFlagsBitField";
import MementoFlagsBitField from "./MementoFlagsBitField";

interface BaseModel extends Model {
  createdAt?: Date;
  updatedAt?: Date;
}
interface Character extends BaseModel {
  characterId?: number;
  discordId?: string;
  active?: boolean;
  name?: string;
  role?: string;
  description?: string;
  gender?: string;
  species?: string;
  weight?: number;
  height?: number;
  whitelist?: string[];
  blacklist?: string[];
  autoDigest?: boolean;
  lastDigest?: string[];
  // Association fields
  dId?: number;
  imageId?: number;
  itemId?: number;
  mId?: number;
  sId?: number;
  createImage?(): Promise<Image>;
  createStat?(): Promise<Stats>;
  getDigestions?(): Promise<Digestion[]>;
  getImage?(): Promise<Image>;
  getItems?(): Promise<Item[]>;
  getMementos?(): Promise<Memento[]>;
  getStat?(): Promise<Stats>;
}
interface Digestion extends BaseModel {
  dId?: number;
  status?: string;
  type?: string;
  voreUpdate?: Date;
  predator?: number;
  prey?: number;
  // Association fields
  getCharacter?(): Promise<Character>;
}
interface Image extends BaseModel {
  iId?: number;
  characterId?: number;
  profile?: string;
  analPred?: string;
  analPrey?: string;
  breastPred?: string;
  breastPrey?: string;
  cockPred?: string;
  cockPrey?: string;
  oralPred?: string;
  oralPrey?: string;
  tailPred?: string;
  tailPrey?: string;
  unbirthPred?: string;
  unbirthPrey?: string;
}
interface Item extends BaseModel {
  iId?: number;
  characterId?: number;
  name?: string;
  description?: string;
  flags?: ItemFlagsBitField;
  // Association fields
  getCharacter?(): Promise<Character>;
}
interface Memento extends BaseModel {
  mId?: number;
  characterId?: number;
  title?: string;
  description?: string;
  image?: string;
  flags?: MementoFlagsBitField;
  // Association fields
  getCharacter?(): Promise<Character>;
}
interface Stats extends BaseModel {
  /**
   * Character ID
   */
  characterId?: number;
  /**
   * Character's health (0-115)
   */
  health?: number;
  /**
   * Character's arousal (0+)
   */
  arousal?: number;
  /**
   * Character's willpower against attempted vore and digestion (0+)
   */
  defiance?: number;
  /**
   * How much the character enjoys being vored (0+)
   */
  euphoria?: number;
  /**
   * Resistance against digestion (0+)
   */
  resistance?: number;
  /**
   * Stomach health (0-50)
   */
  sHealth?: number;
  /**
   * How much the stomach is trying to digest (-10-10)
   */
  sPower?: number;
  /**
   * How much the stomach can handle escaping/non-compliant prey (-10-10)
   */
  sResistance?: number;
  /**
   * Level of the acids (0-5)
   */
  acids?: number;
  /**
   * Exhaustion as a prey (0-10)
   */
  pExhaustion?: number;
  // Association fields
  /**
   * Gets the {@link Character} associated with this {@link Stats}
   */
  getCharacter?(): Promise<Character>;
}

export { Character, Digestion, Image, Item, Memento, Stats }