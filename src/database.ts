import sqlite3 from 'sqlite3';

export const db = new sqlite3.Database('./database.db');

export const initializeDatabase = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(
        `
        CREATE TABLE IF NOT EXISTS lojas (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nome TEXT,
          cep TEXT,
          latitude REAL,
          longitude REAL
        );
        `,
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  });
};

