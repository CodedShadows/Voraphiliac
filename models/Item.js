const { DataTypes } = require("sequelize");

module.exports.import = (sequelize) => sequelize.define("Item", {
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
      key: "cId",
      onDelete: "CASCADE"
    }
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
    default: 0
  }
});