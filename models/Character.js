const { DataTypes } = require("sequelize");

module.exports.import = (sequelize) => sequelize.define("Character", {
  cId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  discordId: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
  },
  busy: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
  },
  // -- CHARACTER INFO -- //
  name: {
    type: DataTypes.TEXT("tiny"),
    allowNull: false
  },
  role: {
    type: DataTypes.TEXT("tiny"),
    allowNull: false,
    validation: {
      is: /^(Pred(ator)? Switch|(Apex )?Pred(ator)?)|(Switch)|(Prey( Switch)?)$/i
    }
  },
  description: {
    type: DataTypes.TEXT("medium"),
    allowNull: false
  },
  gender: {
    type: DataTypes.TEXT("tiny"),
    allowNull: false,
  },
  species: {
    type: DataTypes.TEXT("tiny"),
    allowNull: false,
  },
  weight: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  height: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  // -- VORE INFO -- //
  whitelist: {
    type: DataTypes.TEXT,
    allowNull: false,
    validation: {
      is: /\[.+,*\]/
    },
    set(value) {
      if(!Array.isArray(value)) throw new Error(value + " is not an array");
      return JSON.stringify(value);
    },
    get() {
      return JSON.parse(this.getDataValue("whitelist"));
    }
  },
  blacklist: {
    type: DataTypes.TEXT,
    allowNull: false,
    validation: {
      is: /\[.+,*\]/
    },
    set(value) {
      if(!Array.isArray(value)) throw new Error(value + " is not an array");
      return JSON.stringify(value);
    },
    get() {
      return JSON.parse(this.getDataValue("blacklist"));
    }
  },
  autodigest: {
    type: DataTypes.BOOLEAN,
    allowNull: false
  }
});