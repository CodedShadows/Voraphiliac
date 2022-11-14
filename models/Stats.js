const { DataTypes } = require("sequelize");
const { minMaxValidator } = require("../functions.js");

module.exports.import = (sequelize) => sequelize.define("Stats", {
  character: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "Characters",
      key: "cId"
    },
    onDelete: "CASCADE"
  },
  health: {
    type: DataTypes.INTEGER,
    allowNull: false,
    set(value) {
      minMaxValidator(-1, 115, value, "health", this);
    },
    defaultValue: 115
  },
  arousal: {
    type: DataTypes.INTEGER,
    allowNull: false,
    set(value) {
      minMaxValidator(-1, false, value, "arousal", this);
    },
    defaultValue: 0
  },
  defiance: {
    type: DataTypes.INTEGER,
    allowNull: false,
    set(value) {
      minMaxValidator(-1, false, value, "defiance", this);
    },
    defaultValue: 0
  },
  euphoria: {
    type: DataTypes.INTEGER,
    allowNull: false,
    set(value) {
      minMaxValidator(-1, false, value, "euphoria", this);
    },
    defaultValue: 0
  },
  resistance: {
    type: DataTypes.INTEGER,
    allowNull: false,
    set(value) {
      minMaxValidator(0, false, value, "resistance", this);
    },
    defaultValue: 0
  },

  // DIGESTION INFO //

  sHealth: {
    type: DataTypes.INTEGER,
    allowNull: false,
    set(value) {
      minMaxValidator(0, 50, value, "sHealth", this);
    },
    defaultValue: 50
  },
  sPower: {
    type: DataTypes.INTEGER,
    allowNull: false,
    set(value) {
      minMaxValidator(-10, 10, value, "sPower", this);
    },
    defaultValue: 0
  },
  sResistance: {
    type: DataTypes.INTEGER,
    allowNull: false,
    set(value) {
      minMaxValidator(-10, 10, value, "sResistance", this);
    },
    defaultValue: 0
  },
  acids: {
    type: DataTypes.INTEGER,
    allowNull: false,
    set(value) {
      minMaxValidator(0, 5, value, "acids", this);
    },
    defaultValue: 0
  },
  pExhaustion: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isInt: true
    },
    set(value) {
      minMaxValidator(0, 10, value, "pExhaustion", this);
    },
    defaultValue: 10
  },
});