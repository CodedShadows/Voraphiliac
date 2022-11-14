const { DataTypes } = require("sequelize");

module.exports.import = (sequelize) => sequelize.define("Memento", {
  mId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  character: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "Characters",
      key: "cId"
    },
    onDelete: "CASCADE"
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
    validation: {
      is: /^(https:\/\/).+(\.).+\/.+(\.png|\.jpg)$/
    }
  },
  flags: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
});