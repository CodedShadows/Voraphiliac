import { DataTypes, Sequelize } from "sequelize";

module.exports.import = (sequelize: Sequelize) => sequelize.define("Memento", {
  mId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.TEXT("tiny"),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT("medium"),
    allowNull: false
  },
  image: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      is: /^(https:\/\/).+(\.).+\/.+(\.png|\.jpg)$/
    }
  },
  flags: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
});