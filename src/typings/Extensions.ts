import { ChatInputCommandInteraction, Client, SlashCommandBuilder } from 'discord.js';
import { Logger } from 'pino';
import { Sequelize } from 'sequelize';
import { initModels } from '../models/init-models.js';

export interface CustomClient<Ready extends boolean = boolean> extends Client {
  /** @desc Commands for the bot to handle */
  commands?: Map<string, CommandFile>;
  /** @desc Functions dynamically imported */
  functions?: Map<string, FunctionFile>;
  /** @desc Sequelize instance */
  sequelize?: Sequelize;
  /** @desc Sequelize models for the database */
  models?: ReturnType<typeof initModels>;
  /** @desc Whether the bot is ready to accept commands */
  ready?: boolean;
  /** @desc Logging ({@link Ready} determines type: true is {@link Logger}, false is {@link Console}) */
  logs?: Ready extends true ? Logger : Console;
}
// Various types of file that will be imported
export interface CommandFile {
  name?: string;
  ephemeral?: boolean;
  data?: SlashCommandBuilder;
  execute: ({ client, interaction, options }: CmdFileArgs) => Promise<void>;
}
export interface FunctionFile {
  name: string;
  execute: (client: CustomClient, ...args: unknown[]) => Promise<unknown>;
}
// Instatuts Metric Typings
export interface RawMetric {
  id: string;
  name: string;
  active: boolean;
  order: number;
  suffix: string;
  data: MetricData[];
}
export interface MetricData {
  timestamp: number;
  value: number;
}
export interface MetricPut {
  name: string;
  suffix: string;
}
export interface MetricDataPoint {
  id: string;
  value: number;
  timestamp: number;
}
export interface MetricDataPointPost {
  timestamp: number;
  value: number;
}
export const EventTypeArray = ['ready', 'init', 'events'] as const;
// Export EventTypes as any member of the array
export type EventTypes = 'ready' | 'init' | 'events';

export type CmdFileArgs = {
  client: CustomClient<true>;
  interaction: ChatInputCommandInteraction;
  options: ChatInputCommandInteraction['options'];
};
