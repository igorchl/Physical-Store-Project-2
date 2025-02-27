import { Knex } from "knex";

const config: Knex.Config = {
  client: "sqlite3",
  connection: {
    filename: "./database.sqlite", 
  },
  useNullAsDefault: true,
  migrations: {
    directory: "./migrations", 
    extension: "ts", 
  },
};

export default config;
