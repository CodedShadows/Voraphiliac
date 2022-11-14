const { DataTypes } = require("sequelize");

module.exports.import = (sequelize) => sequelize.define("Digestion", {
  dId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  status: {
    type: DataTypes.STRING(10),
    allowNull: false,
    validation: {
      is: /(Voring|Vored|Digesting|Digested|Reformed|Escaped)/
    },
    defaultValue: "Voring"
  },
  type: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: "oral"
  },
  voreUpdate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  predator: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "Characters",
      key: "cId"
    },
    onDelete: "CASCADE"
  },
  prey: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "Characters",
      key: "cId"
    },
    onDelete: "CASCADE"
  }
});