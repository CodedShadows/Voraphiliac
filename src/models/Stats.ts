const { DataTypes } = require("sequelize");
const { minMaxValidator } = require("../functions.js");

module.exports.import = (sequelize) => sequelize.define("Stats", {
  sId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  health: {
    type: DataTypes.INTEGER,
    allowNull: false,
    set(value: number|string) {
      this.setDataValue("health", minMaxValidator(-1, 115, value, "health", this));
    },
    defaultValue: 115
  },
  arousal: {
    type: DataTypes.INTEGER,
    allowNull: false,
    set(value: number|string) {
      this.setDataValue("arousal", minMaxValidator(-1, false, value, "arousal", this));
    },
    defaultValue: 0
  },
  defiance: {
    type: DataTypes.INTEGER,
    allowNull: false,
    set(value: number|string) {
      this.setDataValue("defiance", minMaxValidator(-1, false, value, "defiance", this));
    },
    defaultValue: 0
  },
  euphoria: {
    type: DataTypes.INTEGER,
    allowNull: false,
    set(value: number|string) {
      this.setDataValue("euphoria", minMaxValidator(-1, false, value, "euphoria", this));
    },
    defaultValue: 0
  },
  resistance: {
    type: DataTypes.INTEGER,
    allowNull: false,
    set(value: number|string) {
      this.setDataValue("resistance", minMaxValidator(0, false, value, "resistance", this));
    },
    defaultValue: 0
  },

  // DIGESTION INFO //

  sHealth: {
    type: DataTypes.INTEGER,
    allowNull: false,
    set(value: number|string) {
      this.setDataValue("sHealth", minMaxValidator(0, 50, value, "sHealth", this));
    },
    defaultValue: 50
  },
  sPower: {
    type: DataTypes.INTEGER,
    allowNull: false,
    set(value: number|string) {
      this.setDataValue("sPower", minMaxValidator(-10, 10, value, "sPower", this));
    },
    defaultValue: 0
  },
  sResistance: {
    type: DataTypes.INTEGER,
    allowNull: false,
    set(value: number|string) {
      this.setDataValue("sResistance", minMaxValidator(-10, 10, value, "sResistance", this));
    },
    defaultValue: 0
  },
  acids: {
    type: DataTypes.INTEGER,
    allowNull: false,
    set(value: number|string) {
      this.setDataValue("acids", minMaxValidator(0, 5, value, "acids", this));
    },
    defaultValue: 0
  },
  pExhaustion: {
    type: DataTypes.INTEGER,
    allowNull: false,
    set(value: number|string) {
      this.setDataValue("pExhaustion", minMaxValidator(0, 10, value, "pExhaustion", this));
    },
    defaultValue: 10
  },
});