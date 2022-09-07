const { ItemFlagsBits } = require("./Flags.ts");

module.exports.ItemFlags = class {
  static Flags = ItemFlagsBits;
  static All = Object.values(ItemFlagsBits).reduce((all, p) => all | p, 0n);
  static Default = BigInt(0);
  static DefaultBit = BigInt(0);

  constructor(bits = this.constructor.DefaultBit) {
    this.bitfield = this.constructor.resolve(bits);
  }

  static add(...bits) {
    return new this(this.resolve(...bits));
  }

  static has(bit) {
    return (this.resolve(bit) & this.resolve(this.DefaultBit)) !== 0n;
  }

  static hasArray(bits) {
    return bits.every(bit => this.has(bit));
  }

  static remove(...bits) {
    return new this(this.resolve(this.DefaultBit) & ~this.resolve(...bits));
  }

  static resolve(bit) {
    const { DefaultBit } = this;
    if (typeof DefaultBit === typeof bit && bit >= DefaultBit) return bit;
    if (bit instanceof this) return bit.bitfield;
    if (Array.isArray(bit)) return bit.map(p => this.resolve(p)).reduce((prev, p) => prev | p, DefaultBit);
    if (typeof bit === "string") {
      if (typeof this.Flags[bit] !== "undefined") return this.Flags[bit];
      if (!isNaN(bit)) return typeof DefaultBit === "bigint" ? BigInt(bit) : Number(bit);
    }
    throw new RangeError("BitFieldInvalid", bit);
  }

  static resolveArray(bits) {
    return bits.map(bit => this.resolve(bit));
  }

  static resolveBit(bit) {
    return this.resolve(bit);
  }

  static resolveBitArray(bits) {
    return bits.map(bit => this.resolve(bit));
  }

  static toString() {
    return this.resolve(this.DefaultBit).toString();
  }

  static toArray() {
    return this.resolveArray(this.DefaultBit);
  }
};