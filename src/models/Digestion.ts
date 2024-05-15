import { DataTypes, Sequelize } from "sequelize";

module.exports.import = (sequelize: Sequelize) => sequelize.define("Digestion", {
  dId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  status: {
    type: DataTypes.STRING(10),
    allowNull: false,
    validate: {
      isIn: [["Voring", "Vored", "Digesting", "Digested", "Reformed", "Escaped"]]
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
      key: "characterId"
    },
    onDelete: "CASCADE"
  },
  prey: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "Characters",
      key: "characterId"
    },
    onDelete: "CASCADE"
  }
});