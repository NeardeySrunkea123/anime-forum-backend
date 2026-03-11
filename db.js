import "dotenv/config";
import pg from "pg";

const pool = new pg.Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || "", // empty allowed
});

async function main() {
  try {
    const r = await pool.query(
      "SELECT NOW() as now, current_database() as db, current_user as user"
    );
    console.log("✅ DB connected!");
    console.table(r.rows);
  } catch (err) {
    console.error("❌ DB connection failed!");
    console.error(err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
