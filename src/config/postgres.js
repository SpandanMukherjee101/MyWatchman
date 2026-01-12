const { Pool } = require("pg");

const useSSL = process.env.POSTGRES_SSL === "true";

const pgPool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST.trim(), 
  database: process.env.POSTGRES_DATABASE,
  password: process.env.POSTGRES_PASSWORD,
  port: Number(process.env.POSTGRES_PORT),
  ssl: useSSL ? { rejectUnauthorized: false } : false,
});

pgPool.connect()
  .then(() => console.log("Postgres connected"))
  .catch(err => console.error("Postgres connection error:", err));

module.exports = pgPool;
