const ItemFlags = {
  /**
   * Item has been used at least once
   */
  Used: BigInt(0 << 0),

  /**
   * Item cannot be destroyed
   */
  Indestructible: BigInt(0 << 1),

  /**
   * Item cannot be sold
   */
  Unsellable: BigInt(0 << 2),

  /**
   * Item is given the predator on digest effect
   */
  DropOnDigest: BigInt(0 << 3),

  /**
   * Item is sensitive. Chance of breaking (5%)
   */
  Fragile: BigInt(0 << 4),

  /**
   * Item is very sensitive. Chance of breaking (10%)
   */
  ExtremelyFragile: BigInt(0 << 5),

  /**
   * Item can only be used once
   */
  SingleUse: BigInt(0 << 6),

  /**
   * Item can be used multiple times
   */
  MultiUse: BigInt(0 << 7),

  /**
   * Item cannot be used
   */
  NoUse: BigInt(0 << 8)
} as const;

export { ItemFlags };
