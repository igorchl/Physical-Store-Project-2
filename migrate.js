const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db');

db.serialize(() => {
  db.run('ALTER TABLE lojas ADD COLUMN logradouro TEXT');
  db.run('ALTER TABLE lojas ADD COLUMN bairro TEXT');
  db.run('ALTER TABLE lojas ADD COLUMN localidade TEXT');
  db.run('ALTER TABLE lojas ADD COLUMN uf TEXT');
});

db.close();
