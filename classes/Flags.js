const ItemFlagsBits = {
  None: 0x01,
  Used: 0x02,
  Indestructible: 0x04,
  Unsellable: 0x08,
  DropOnDigest: 0x16,
  Fragile: 0x32,
  ExtremelyFragile: 0x64,
  SingleUse: 0x128,
  MultiUse: 0x256,
  NoUse: 0x512
};

/**
 * Freeze the object of bits, preventing any modifications to it
 * @internal
 */
Object.freeze(ItemFlagsBits);

module.exports.ItemFlagsBits = ItemFlagsBits;