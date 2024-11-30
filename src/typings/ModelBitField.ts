import { ItemFlags } from './ItemFlags.js';
import { MementoFlags } from './MementoFlags.js';
import { BitField } from './Bitfield.js';

/**
 * Data structure that makes it easy to interact with a item flag bitfield.
 * @extends {BitField}
 */
class ItemFlagsBitField extends BitField<string, bigint> {
  /**
   * Numeric item flags.
   * @type {UserFlags}
   * @memberof ItemFlagsBitField
   */
  static Flags = ItemFlags;

  /**
   * Bitfield representing every flag combined
   * @type {bigint}
   * @memberof ItemFlagsBitField
   */
  static All = Object.values(this.Flags)
    .filter((v) => typeof v !== 'string')
    .reduce((all, p) => BigInt(all) | BigInt(p), BigInt(0));

  /**
   * Bitfield representing the default item flags
   * @type {bigint}
   * @memberof ItemFlagsBitField
   */
  static Default = BigInt(0);

  /**
   * @type {bigint}
   * @memberof ItemFlagsBitField
   * @private
   */
  static DefaultBit = BigInt(0);

  /**
   * Bitfield of the packed bits
   * @type {bigint}
   * @name ItemFlagsBitField#bitfield
   */

  /**
   * Gets an {@link Array} of bitfield names based on the flags available.
   * @returns {string[]}
   */
  toArray(): string[] {
    return super.toArray(false);
  }
}

/**
 * Data structure that makes it easy to interact with a memento flag bitfield.
 * @extends {BitField}
 */
class MementoFlagsBitField extends BitField<string, bigint> {
  /**
   * Numeric memento flags.
   * @type {MementoFlags}
   * @memberof MementoFlagsBitField
   */
  static Flags = MementoFlags;

  /**
   * Bitfield representing every flag combined
   * @type {bigint}
   * @memberof MementoFlagsBitField
   */
  static All = Object.values(this.Flags)
    .filter((v) => typeof v !== 'string')
    .reduce((all, p) => BigInt(all) | BigInt(p), BigInt(0));

  /**
   * Bitfield representing the default memento flags
   * @type {bigint}
   * @memberof MementoFlagsBitField
   */
  static Default = BigInt(0);

  /**
   * @type {bigint}
   * @memberof MementoFlagsBitField
   * @private
   */
  static DefaultBit = BigInt(0);

  /**
   * Bitfield of the packed bits
   * @type {bigint}
   * @name MementoFlagsBitField#bitfield
   */

  /**
   * Gets an {@link Array} of bitfield names based on the flags available.
   * @returns {string[]}
   */
  toArray(): string[] {
    return super.toArray(false);
  }
}

export { ItemFlagsBitField, MementoFlagsBitField };
