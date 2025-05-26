import { Sequelize } from 'sequelize';
import { default as config } from '../../configs/config.json' with { type: 'json' };
import { CustomClient } from '../../typings/Extensions.js';
const { database } = config;

export const name = 'sequelize';
export async function execute(client: CustomClient, _ready: boolean): Promise<void> {
  // Login to Sequelize
  const sequelize = new Sequelize(database.database, database.username, database.password, {
    host: database.host,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? (sql, ms) => client.logs.debug({ sql, ms }) : false,
    benchmark: true,
    port: database.port
  });
  // Load models
  const loader = await import('../../models/init-models.js');
  try {
    await sequelize.authenticate();
    if (loader.initModels) client.models = loader.initModels(sequelize);
    await sequelize.sync();
    console.info(`F | ✓ Database connection established`);
  } catch (err) {
    client.logs.warn({ err }, `F | ✘ Failed to create database connection`);
  }
  // Add Sequelize
  client.sequelize = sequelize;
  return;
}
