import { DataTypes, Sequelize } from "sequelize";

module.exports.import = (sequelize: Sequelize) => sequelize.define("Item", {
  iId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  owner: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "Characters",
      key: "characterId"
    },
    onDelete: "CASCADE"
  },
  name: {
    type: DataTypes.TEXT("tiny"),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT("medium"),
    allowNull: false
  },
  flags: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
});