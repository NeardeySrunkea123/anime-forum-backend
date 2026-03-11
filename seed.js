import pkg from "pg";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "anime_forum",
  password: process.env.DB_PASSWORD || "password",
  port: process.env.DB_PORT || 5432,
});

async function seed() {
  try {
    console.log("Seeding database...");

    const passwordHash = await bcrypt.hash("password123", 10);

    await pool.query(
      `
      INSERT INTO users (username, email, password_hash, role)
      VALUES
        ('admin', 'admin@anime.com', $1, 'admin'),
        ('naruto', 'naruto@anime.com', $1, 'user'),
        ('luffy', 'luffy@anime.com', $1, 'user')
      ON CONFLICT (email) DO NOTHING
      `,
      [passwordHash]
    );

    await pool.query(`
      INSERT INTO forums (name, description, slug)
      VALUES
        ('General Discussion', 'Talk about anime', 'general'),
        ('Recommendations', 'Recommend anime', 'recommendations'),
        ('News', 'Anime news', 'news')
      ON CONFLICT (slug) DO NOTHING
    `);

    console.log("Seed completed");
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

seed();