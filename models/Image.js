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
      key: "cId",
      onDelete: "CASCADE"
    }
  },
  profile: {
    type: DataTypes.TEXT,
    allowNull: false,
    validation: {
      is: /^((https:\/\/).+(\.).+\/.+(\.png|\.jpg)| )$/
    }
  },
  analPred: {
    type: DataTypes.TEXT,
    allowNull: false,
    validation: {
      is: /^((https:\/\/).+(\.).+\/.+(\.png|\.jpg)| )$/
    }
  },
  analPrey: {
    type: DataTypes.TEXT,
    allowNull: false,
    validation: {
      is: /^((https:\/\/).+(\.).+\/.+(\.png|\.jpg)| )$/
    }
  },
  breastPred: {
    type: DataTypes.TEXT,
    allowNull: false,
    validation: {
      is: /^((https:\/\/).+(\.).+\/.+(\.png|\.jpg)| )$/
    }
  },
  breastPrey: {
    type: DataTypes.TEXT,
    allowNull: false,
    validation: {
      is: /^((https:\/\/).+(\.).+\/.+(\.png|\.jpg)| )$/
    }
  },
  cockPred: {
    type: DataTypes.TEXT,
    allowNull: false,
    validation: {
      is: /^((https:\/\/).+(\.).+\/.+(\.png|\.jpg)| )$/
    }
  },
  cockPrey: {
    type: DataTypes.TEXT,
    allowNull: false,
    validation: {
      is: /^((https:\/\/).+(\.).+\/.+(\.png|\.jpg)| )$/
    }
  },
  oralPred: {
    type: DataTypes.TEXT,
    allowNull: false,
    validation: {
      is: /^((https:\/\/).+(\.).+\/.+(\.png|\.jpg)| )$/
    }
  },
  oralPrey: {
    type: DataTypes.TEXT,
    allowNull: false,
    validation: {
      is: /^((https:\/\/).+(\.).+\/.+(\.png|\.jpg)| )$/
    }
  },
  tailPred: {
    type: DataTypes.TEXT,
    allowNull: false,
    validation: {
      is: /^((https:\/\/).+(\.).+\/.+(\.png|\.jpg)| )$/
    }
  },
  tailPrey: {
    type: DataTypes.TEXT,
    allowNull: false,
    validation: {
      is: /^((https:\/\/).+(\.).+\/.+(\.png|\.jpg)| )$/
    }
  },
  unbirthPred: {
    type: DataTypes.TEXT,
    allowNull: false,
    validation: {
      is: /^((https:\/\/).+(\.).+\/.+(\.png|\.jpg)| )$/
    }
  },
  unbirthPrey: {
    type: DataTypes.TEXT,
    allowNull: false,
    validation: {
      is: /^((https:\/\/).+(\.).+\/.+(\.png|\.jpg)| )$/
    }
  }
});