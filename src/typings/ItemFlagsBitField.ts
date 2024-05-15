import { ItemFlags } from "./ItemFlags";
import { BitField } from "./Bitfield";

/**
 * Data structure that makes it easy to interact with a item flag bitfield.
 * @extends {BitField}
 */
class ItemFlagsBitField extends BitField {
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
  static All = Object.values(this.Flags).filter(v => typeof v !== "string").reduce((all, p) => BigInt(all) | BigInt(p), BigInt(0));

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

export default ItemFlagsBitField;