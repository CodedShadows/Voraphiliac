import { MementoFlags } from "./MementoFlags";
import { BitField } from "./Bitfield";

/**
 * Data structure that makes it easy to interact with a memento flag bitfield.
 * @extends {BitField}
 */
class MementoFlagsBitField extends BitField {
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
  static All = Object.values(this.Flags).filter(v => typeof v !== "string").reduce((all, p) => BigInt(all) | BigInt(p), BigInt(0));

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

export default MementoFlagsBitField;