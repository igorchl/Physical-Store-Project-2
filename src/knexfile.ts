import type { Knex } from "knex";

const config: Knex.Config = {
  client: "sqlite3",
  connection: {
    filename: "./src/database.sqlite", 
  },
  migrations: {
    directory: "./src/migrations", 
    extension: "ts", 
  },
  useNullAsDefault: true,
};

export default config;
