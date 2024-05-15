import { DataTypes, Sequelize } from "sequelize";

module.exports.import = (sequelize: Sequelize) => sequelize.define("Image", {
  iId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  profile: {
    type: DataTypes.STRING(512),
    allowNull: false,
    validate: {
      is: /^((https:\/\/).+(\.).+\/.+(\.png|\.jpg)| )$/
    },
    defaultValue: "https://tavis.page/files/3lufz9xn.jpg"
  },
  analPred: {
    type: DataTypes.STRING(512),
    allowNull: false,
    validate: {
      is: /^((https:\/\/).+(\.).+\/.+(\.png|\.jpg)| )$/
    },
    defaultValue: " "
  },
  analPrey: {
    type: DataTypes.STRING(512),
    allowNull: false,
    validate: {
      is: /^((https:\/\/).+(\.).+\/.+(\.png|\.jpg)| )$/
    },
    defaultValue: " "
  },
  breastPred: {
    type: DataTypes.STRING(512),
    allowNull: false,
    validate: {
      is: /^((https:\/\/).+(\.).+\/.+(\.png|\.jpg)| )$/
    },
    defaultValue: " "
  },
  breastPrey: {
    type: DataTypes.STRING(512),
    allowNull: false,
    validate: {
      is: /^((https:\/\/).+(\.).+\/.+(\.png|\.jpg)| )$/
    },
    defaultValue: " "
  },
  cockPred: {
    type: DataTypes.STRING(512),
    allowNull: false,
    validate: {
      is: /^((https:\/\/).+(\.).+\/.+(\.png|\.jpg)| )$/
    },
    defaultValue: " "
  },
  cockPrey: {
    type: DataTypes.STRING(512),
    allowNull: false,
    validate: {
      is: /^((https:\/\/).+(\.).+\/.+(\.png|\.jpg)| )$/
    },
    defaultValue: " "
  },
  oralPred: {
    type: DataTypes.STRING(512),
    allowNull: false,
    validate: {
      is: /^((https:\/\/).+(\.).+\/.+(\.png|\.jpg)| )$/
    },
    defaultValue: " "
  },
  oralPrey: {
    type: DataTypes.STRING(512),
    allowNull: false,
    validate: {
      is: /^((https:\/\/).+(\.).+\/.+(\.png|\.jpg)| )$/
    },
    defaultValue: " "
  },
  tailPred: {
    type: DataTypes.STRING(512),
    allowNull: false,
    validate: {
      is: /^((https:\/\/).+(\.).+\/.+(\.png|\.jpg)| )$/
    },
    defaultValue: " "
  },
  tailPrey: {
    type: DataTypes.STRING(512),
    allowNull: false,
    validate: {
      is: /^((https:\/\/).+(\.).+\/.+(\.png|\.jpg)| )$/
    },
    defaultValue: " "
  },
  unbirthPred: {
    type: DataTypes.STRING(512),
    allowNull: false,
    validate: {
      is: /^((https:\/\/).+(\.).+\/.+(\.png|\.jpg)| )$/
    },
    defaultValue: " "
  },
  unbirthPrey: {
    type: DataTypes.STRING(512),
    allowNull: false,
    validate: {
      is: /^((https:\/\/).+(\.).+\/.+(\.png|\.jpg)| )$/
    },
    defaultValue: " "
  }
});