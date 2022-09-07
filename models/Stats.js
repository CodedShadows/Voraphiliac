const { DataTypes } = require("sequelize");

module.exports.import = (sequelize) => sequelize.define("Stats", {
  character: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "Characters",
      key: "cId",
      onDelete: "CASCADE"
    }
  },
  health: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validation: {
      min: -1,
      max: 100
    }
  },
  arousal: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validation: {
      min: -1
    }
  },
  digestion: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validation: {
      min: -1
    }
  },
  defiance: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validation: {
      min: -1
    }
  },
  euphoria: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validation: {
      min: -1
    }
  }
});