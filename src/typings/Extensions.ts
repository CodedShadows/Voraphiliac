import { Client, CommandInteraction, ModalSubmitFields, ModalSubmitInteraction, SlashCommandBuilder } from "discord.js";
import { Sequelize } from "sequelize";
import { Character, Digestion, Image, Item, Memento, Stats } from "./Models";

interface CustomProcess extends NodeJS.Process {
  Character?: Character;
  Digestion?: Digestion;
  Image?: Image;
  Item?: Item;
  Memento?: Memento;
  Stats?: Stats;
}
interface CustomClient extends Client {
  commands?: Map<string, {name: string, data: SlashCommandBuilder, run(client: Client, interaction: CommandInteraction, options: CommandInteraction["options"]): Promise<void>}>
  modals?: Map<string, {name: string, run(client: Client, interaction: ModalSubmitInteraction, fields: ModalSubmitFields): Promise<void>}>
  sequelize?: Sequelize;
  models?: Sequelize["models"];
}

export { CustomClient, CustomProcess }