const { DataTypes } = require("sequelize");

module.exports.import = (sequelize) => sequelize.define("Digestion", {
  dId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  status: {
    type: DataTypes.TEXT("tiny"),
    allowNull: false,
    validation: {
      is: /(Voring)|(Vored)|(Digesting)|(Digested)|(Dead)/
    }
  },
  predator: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "Characters",
      key: "cId",
      onDelete: "CASCADE"
    }
  },
  prey: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "Characters",
      key: "cId"
    }
  }
});