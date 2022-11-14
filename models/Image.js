const { DataTypes } = require("sequelize");

module.exports.import = (sequelize) => sequelize.define("Image", {
  iId: {
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
  profile: {
    type: DataTypes.STRING(512),
    allowNull: false,
    validation: {
      is: /^((https:\/\/).+(\.).+\/.+(\.png|\.jpg)| )$/
    },
    defaultValue: " "
  },
  analPred: {
    type: DataTypes.STRING(512),
    allowNull: false,
    validation: {
      is: /^((https:\/\/).+(\.).+\/.+(\.png|\.jpg)| )$/
    },
    defaultValue: " "
  },
  analPrey: {
    type: DataTypes.STRING(512),
    allowNull: false,
    validation: {
      is: /^((https:\/\/).+(\.).+\/.+(\.png|\.jpg)| )$/
    },
    defaultValue: " "
  },
  breastPred: {
    type: DataTypes.STRING(512),
    allowNull: false,
    validation: {
      is: /^((https:\/\/).+(\.).+\/.+(\.png|\.jpg)| )$/
    },
    defaultValue: " "
  },
  breastPrey: {
    type: DataTypes.STRING(512),
    allowNull: false,
    validation: {
      is: /^((https:\/\/).+(\.).+\/.+(\.png|\.jpg)| )$/
    },
    defaultValue: " "
  },
  cockPred: {
    type: DataTypes.STRING(512),
    allowNull: false,
    validation: {
      is: /^((https:\/\/).+(\.).+\/.+(\.png|\.jpg)| )$/
    },
    defaultValue: " "
  },
  cockPrey: {
    type: DataTypes.STRING(512),
    allowNull: false,
    validation: {
      is: /^((https:\/\/).+(\.).+\/.+(\.png|\.jpg)| )$/
    },
    defaultValue: " "
  },
  oralPred: {
    type: DataTypes.STRING(512),
    allowNull: false,
    validation: {
      is: /^((https:\/\/).+(\.).+\/.+(\.png|\.jpg)| )$/
    },
    defaultValue: " "
  },
  oralPrey: {
    type: DataTypes.STRING(512),
    allowNull: false,
    validation: {
      is: /^((https:\/\/).+(\.).+\/.+(\.png|\.jpg)| )$/
    },
    defaultValue: " "
  },
  tailPred: {
    type: DataTypes.STRING(512),
    allowNull: false,
    validation: {
      is: /^((https:\/\/).+(\.).+\/.+(\.png|\.jpg)| )$/
    },
    defaultValue: " "
  },
  tailPrey: {
    type: DataTypes.STRING(512),
    allowNull: false,
    validation: {
      is: /^((https:\/\/).+(\.).+\/.+(\.png|\.jpg)| )$/
    },
    defaultValue: " "
  },
  unbirthPred: {
    type: DataTypes.STRING(512),
    allowNull: false,
    validation: {
      is: /^((https:\/\/).+(\.).+\/.+(\.png|\.jpg)| )$/
    },
    defaultValue: " "
  },
  unbirthPrey: {
    type: DataTypes.STRING(512),
    allowNull: false,
    validation: {
      is: /^((https:\/\/).+(\.).+\/.+(\.png|\.jpg)| )$/
    },
    defaultValue: " "
  }
});