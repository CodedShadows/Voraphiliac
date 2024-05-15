import { DataTypes, Sequelize } from "sequelize";

module.exports.import = (sequelize: Sequelize) => sequelize.define("Character", {
  characterId: {
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
    defaultValue: false
  },
  // -- CHARACTER INFO -- //
  name: {
    type: DataTypes.TEXT("tiny"),
    allowNull: false
  },
  role: {
    type: DataTypes.TEXT("tiny"),
    allowNull: false,
    validate: {
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
    type: DataTypes.DECIMAL(10, 3),
    allowNull: false,
  },
  height: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: false,
  },
  // -- VORE INFO -- //
  whitelist: {
    type: DataTypes.STRING,
    allowNull: false,
    set(value: string[]) {
      try {
        if(typeof value === "string")
          value = JSON.parse(value);
        else
          value = Array.from(value);

        if(!Array.isArray(value)) throw new Error("Value is not an array");
      } catch(e) {
        throw new Error(value + " is not an array");
      }
      return this.setDataValue("whitelist", JSON.stringify(value));
    },
    get() {
      return JSON.parse(this.getDataValue("whitelist"));
    },
    defaultValue: "[\"all\"]"
  },
  blacklist: {
    type: DataTypes.STRING,
    allowNull: false,
    set(value: string[]) {
      try {
        if(typeof value === "string")
          value = JSON.parse(value);
        else
          value = Array.from(value);

        if(!Array.isArray(value)) throw new Error("Value is not an array");
      } catch(e) {
        throw new Error(value + " is not an array");
      }
      return this.setDataValue("blacklist", JSON.stringify(value));
    },
    get() {
      return JSON.parse(this.getDataValue("blacklist"));
    },
    defaultValue: "[\"none\"]"
  },
  autodigest: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  lastDigest: {
    type: DataTypes.STRING,
    allowNull: false,
    set(value: string[]) {
      try {
        if(typeof value === "string")
          value = JSON.parse(value);
        else
          value = Array.from(value);

        if(!Array.isArray(value)) throw new Error("Value is not an array");
      } catch(e) {
        throw new Error(value + " is not an array");
      }
      return this.setDataValue("lastDigest", JSON.stringify(value));
    },
    get() {
      return JSON.parse(this.getDataValue("lastDigest"));
    },
    defaultValue: "[\"N/A\"]"
  }
});