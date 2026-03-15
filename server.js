import express from 'express';
import cors from 'cors';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from 'bcrypt';
import { logToCore } from "./lib/coreLogger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

const app = express();
const PORT = 3003;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.set("views", "views");

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'anime_forum',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

pool.query('SELECT NOW()', (err) => {
  if (err) console.error('Database connection error:', err);
  else console.log('Database connected successfully');
});


// ============= ANIME ROUTES =============

app.post('/api/anime/sync', async (req, res) => {
  try {
    const response = await fetch('http://152.42.220.220/api/anime');
    if (!response.ok) {
      return res.status(500).json({ success: false, error: `Failed to fetch from core system. Status: ${response.status}` });
    }
    const coreData = await response.json();
    const animeList = Array.isArray(coreData) ? coreData : coreData.data || [];

    for (const item of animeList) {
      await pool.query(
        `INSERT INTO anime (uuid, title, poster_url, status, core_anime_id)
         VALUES (gen_random_uuid(), $1, $2, $3, $4)
         ON CONFLICT (core_anime_id)
         DO UPDATE SET title = EXCLUDED.title, poster_url = EXCLUDED.poster_url, status = EXCLUDED.status, updated_at = NOW()`,
        [item.title, item.large_image_url || item.image_url || null, item.status || null, item.id]
      );
    }

    res.json({ success: true, message: 'Anime synced successfully', count: animeList.length });
  } catch (error) {
    console.error('Error syncing anime:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/anime', async (req, res) => {
  try {
    const response = await fetch('http://152.42.220.220/api/anime');
    if (!response.ok) {
      return res.status(500).json({ success: false, error: `Failed to fetch from core system. Status: ${response.status}` });
    }
    const coreData = await response.json();
    const animeList = Array.isArray(coreData) ? coreData : coreData.data || [];

    const localResult = await pool.query('SELECT uuid, core_anime_id FROM anime');
    const localAnime = localResult.rows;

    const merged = animeList.map((item) => {
      const match = localAnime.find((a) => a.core_anime_id === item.id) || null;
      return { ...item, uuid: match?.uuid || null, poster_url: item.large_image_url || item.image_url || null };
    });

    res.json({ success: true, data: merged, count: merged.length });
  } catch (error) {
    console.error('Error fetching anime:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/anime/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await fetch('http://152.42.220.220/api/anime');
    if (!response.ok) {
      return res.status(500).json({ success: false, error: 'Failed to fetch anime list from core system' });
    }
    const coreData = await response.json();
    const animeList = Array.isArray(coreData) ? coreData : coreData.data || [];
    const anime = animeList.find((item) => Number(item.id) === Number(id));

    if (!anime) {
      return res.status(404).json({ success: false, error: 'Anime not found' });
    }

    let localResult = await pool.query('SELECT uuid FROM anime WHERE core_anime_id = $1 LIMIT 1', [id]);

    if (localResult.rows.length === 0) {
      localResult = await pool.query(
        `INSERT INTO anime (uuid, title, poster_url, status, core_anime_id)
         VALUES (gen_random_uuid(), $1, $2, $3, $4) RETURNING uuid`,
        [anime.title, anime.large_image_url || anime.image_url || null, anime.status || null, id]
      );
    }

    res.json({ success: true, data: { ...anime, uuid: localResult.rows[0].uuid } });
  } catch (error) {
    console.error('Error fetching anime detail:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/anime/uuid/:uuid', async (req, res) => {
  try {
    const { uuid } = req.params;
    const { title, poster_url, status } = req.body;
    const result = await pool.query(
      `UPDATE anime SET title = COALESCE($1, title), poster_url = COALESCE($2, poster_url), status = COALESCE($3, status), updated_at = NOW()
       WHERE uuid = $4 RETURNING *`,
      [title, poster_url, status, uuid]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Anime not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error updating anime:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/anime/:uuid', async (req, res) => {
  try {
    const { uuid } = req.params;
    const result = await pool.query('DELETE FROM anime WHERE uuid = $1 RETURNING *', [uuid]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Anime not found' });
    }
    res.json({ success: true, message: 'Anime deleted successfully' });
  } catch (error) {
    console.error('Error deleting anime:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false });
    }

    const user = result.rows[0];

    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      return res.status(401).json({ success: false });
    }

    // 🔹 send log to core
    await logToCore(user.id, "LOGIN", `User ${user.username} logged in`);

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
  }
});

// POST create thread
app.post('/api/threads', async (req, res) => {
  const { user_id, title, content, anime_uuid, forum_id } = req.body;

  try {
    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [user_id]);

    if (userCheck.rows.length === 0) {
      const coreRes = await fetch(`http://152.42.220.220/api/users/${user_id}`);
      const coreData = await coreRes.json();
      const coreUser = coreData.data || coreData;

      await pool.query(
        `INSERT INTO users (id, username, email, password_hash, role, created_at, updated_at)
         VALUES ($1, $2, $3, 'core_managed', $4, $5, $6)
         ON CONFLICT (id) DO NOTHING`,
        [coreUser.id, coreUser.username, coreUser.email, coreUser.role || 'user',
         coreUser.created_at || new Date(), coreUser.updated_at || new Date()]
      );
    }

    // Generate slug from title + timestamp
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')   // remove special chars
      .replace(/\s+/g, '-')            // spaces to dashes
      .substring(0, 80)                // max 80 chars
      + '-' + Date.now();              // add timestamp to ensure uniqueness

    const result = await pool.query(
      `INSERT INTO threads (user_id, title, slug, content, anime_uuid, forum_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING *`,
      [user_id, title, slug, content, anime_uuid, forum_id]
    );

    res.status(201).json({ success: true, data: result.rows[0] });

  } catch (error) {
    console.error('Error creating thread:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});
// ============= USER ROUTES =============

app.get("/users", async (req, res) => {
  try {
    const subsystem = "anime_forum";

    const response = await fetch("http://152.42.220.220/api/users", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Subsystem": subsystem,
      },
    });

    const text = await response.text();
    console.log("Core status:", response.status);
    console.log("Core response:", text);

    let result;
    try {
      result = text ? JSON.parse(text) : [];
    } catch (e) {
      throw new Error(`Core returned invalid JSON: ${text}`);
    }

    if (!response.ok) {
      throw new Error(`Core request failed with status ${response.status}`);
    }

    const users = Array.isArray(result) ? result : (result.data || []);

    res.render("user", { users });
  } catch (err) {
    console.error("Fetch users error:", err);
    res.status(500).send(`Failed to load users: ${err.message}`);
  }
});


// ============= FORUM ROUTES =============

app.get('/api/forums', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM forums WHERE is_active = true ORDER BY display_order'
    );
    res.json({ success: true, data: result.rows, count: result.rows.length });
  } catch (error) {
    console.error('Error fetching forums:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/forums/:id", async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM forums WHERE id = $1 AND is_active = true',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Forum not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Error fetching forum:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});


// ============= THREAD ROUTES =============

app.get("/api/threads", async (req, res) => {
  try {
    const { anime_uuid } = req.query;

    const result = await pool.query(
      `
      SELECT 
        t.*,
        u.username AS author_username,
        f.name AS forum_name,
        a.title AS anime_title,
        COUNT(p.id) AS post_count
      FROM threads t
      JOIN users u ON t.user_id = u.id
      JOIN forums f ON t.forum_id = f.id
      LEFT JOIN anime a ON t.anime_uuid = a.uuid
      LEFT JOIN posts p ON p.thread_id = t.id
      WHERE t.is_active = true
        AND ($1::uuid IS NULL OR t.anime_uuid = $1)
      GROUP BY t.id, u.username, f.name, a.title
      ORDER BY t.created_at DESC
      `,
      [anime_uuid || null]
    );

    res.json({
      success: true,
      data: result.rows.map((row) => ({
        ...row,
        post_count: Number(row.post_count),
      })),
    });
  } catch (error) {
    console.error("Error fetching threads:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/threads/:id", async (req, res) => {
  try {
    await pool.query(
      `UPDATE threads SET views = views + 1 WHERE id = $1`,
      [req.params.id]
    );

    const result = await pool.query(
      `
      SELECT t.*, u.username AS author_username, f.name AS forum_name
      FROM threads t
      JOIN users u ON t.user_id = u.id
      JOIN forums f ON t.forum_id = f.id
      WHERE t.id = $1 AND t.is_active = true
      `,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Thread not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Error fetching thread:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});
app.get('/api/threads/:id/posts', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = 1;

    const result = await pool.query(
      `
      SELECT 
        p.id,
        p.thread_id,
        p.user_id,
        p.content,
        p.created_at,
        u.username AS author_username,
        u.avatar_url,
        COUNT(pl.id) AS like_count,
        EXISTS (
          SELECT 1
          FROM post_likes pl2
          WHERE pl2.post_id = p.id AND pl2.user_id = $2
        ) AS liked
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN post_likes pl ON pl.post_id = p.id
      WHERE p.thread_id = $1
      GROUP BY p.id, p.thread_id, p.user_id, p.content, p.created_at, u.username, u.avatar_url
      ORDER BY p.created_at ASC
      `,
      [id, userId]
    );

    res.json({
      success: true,
      data: result.rows.map((row) => ({
        ...row,
        like_count: Number(row.like_count),
        liked: row.liked,
      })),
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/posts', async (req, res) => {
  try {
    const { thread_id, user_id, content } = req.body;

    // Sync user from core if not exists locally
    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [user_id]);
    if (userCheck.rows.length === 0) {
      const coreRes = await fetch(`http://152.42.220.220/api/users/${user_id}`);
      const coreData = await coreRes.json();
      const coreUser = coreData.data || coreData;

      await pool.query(
        `INSERT INTO users (id, username, email, password_hash, role, created_at, updated_at)
         VALUES ($1, $2, $3, 'core_managed', $4, $5, $6)
         ON CONFLICT (id) DO NOTHING`,
        [coreUser.id, coreUser.username, coreUser.email, coreUser.role || 'user',
         coreUser.created_at || new Date(), coreUser.updated_at || new Date()]
      );
    }

    // Now insert post
    const result = await pool.query(
      `INSERT INTO posts (thread_id, user_id, content) VALUES ($1, $2, $3) RETURNING *`,
      [thread_id, user_id, content]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============= POST LIKES ROUTES =============
app.post('/api/posts/:postId/like', async (req, res) => {
  try {
    const { postId } = req.params;
    const { user_id } = req.body;

    const existing = await pool.query(
      'SELECT * FROM post_likes WHERE post_id = $1 AND user_id = $2',
      [postId, user_id]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'Already liked' });
    }

    await pool.query(
      'INSERT INTO post_likes (post_id, user_id) VALUES ($1, $2)',
      [postId, user_id]
    );

    res.json({ success: true, message: 'Post liked successfully' });
  } catch (error) {
    console.error('Error liking post:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE unlike a post
app.delete('/api/posts/:postId/like/:userId', async (req, res) => {
  try {
    const { postId, userId } = req.params;

    await pool.query(
      'DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2',
      [postId, userId]
    );

    res.json({ success: true, message: 'Like removed successfully' });
  } catch (error) {
    console.error('Error unliking post:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/posts/:postId/likes', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT COUNT(*) AS like_count FROM post_likes WHERE post_id = $1',
      [req.params.postId]
    );
    res.json({ success: true, data: { post_id: req.params.postId, like_count: Number(result.rows[0].like_count) } });
  } catch (error) {
    console.error('Error fetching post likes:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/posts/:postId/like/:userId', async (req, res) => {
  try {
    const { postId, userId } = req.params;
    const result = await pool.query(
      'SELECT * FROM post_likes WHERE post_id = $1 AND user_id = $2',
      [postId, userId]
    );
    res.json({ success: true, liked: result.rows.length > 0 });
  } catch (error) {
    console.error('Error checking like:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/posts/:postId/likes/users', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.username, u.avatar_url FROM post_likes pl
       JOIN users u ON pl.user_id = u.id WHERE pl.post_id = $1`,
      [req.params.postId]
    );
    res.json({ success: true, data: result.rows, count: result.rows.length });
  } catch (error) {
    console.error('Error fetching likes users:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});


// ============= SEARCH =============

app.get('/api/search', async (req, res) => {
  try {
    const { q, type } = req.query;
    if (!q) return res.status(400).json({ success: false, error: 'Search query required' });

    const searchTerm = `%${q}%`;
    let results = {};

    if (!type || type === 'threads') {
      const r = await pool.query(
        `SELECT t.*, u.username FROM threads t
         JOIN users u ON t.user_id = u.id
         WHERE (t.title ILIKE $1 OR t.content ILIKE $1) AND t.is_active = true LIMIT 20`,
        [searchTerm]
      );
      results.threads = r.rows;
    }

    if (!type || type === 'anime') {
      const r = await pool.query('SELECT * FROM anime WHERE title ILIKE $1 LIMIT 20', [searchTerm]);
      results.anime = r.rows;
    }

    if (!type || type === 'users') {
      const r = await pool.query(
        `SELECT id, username, avatar_url, bio, role FROM users
         WHERE (username ILIKE $1 OR bio ILIKE $1) AND is_active = true LIMIT 20`,
        [searchTerm]
      );
      results.users = r.rows;
    }

    res.json({ success: true, query: q, results });
  } catch (error) {
    console.error('Error searching:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});


// ============= DASHBOARD REPORT =============

app.get('/api/dashboard/report', async (req, res) => {
  try {
    const statsResult = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE is_active = true) as total_users,
        (SELECT COUNT(*) FROM anime) as total_anime,
        (SELECT COUNT(*) FROM forums WHERE is_active = true) as total_forums,
        (SELECT COUNT(*) FROM threads WHERE is_active = true) as total_threads,
        (SELECT COUNT(*) FROM posts WHERE is_active = true) as total_posts,
        (SELECT COUNT(*) FROM post_likes) as total_likes
    `);

    const activeUsersResult = await pool.query(`
      SELECT u.id, u.username, u.avatar_url,
        COUNT(DISTINCT p.id) as post_count, COUNT(DISTINCT t.id) as thread_count
      FROM users u
      LEFT JOIN posts p ON u.id = p.user_id
      LEFT JOIN threads t ON u.id = t.user_id
      WHERE u.is_active = true
      GROUP BY u.id, u.username, u.avatar_url
      ORDER BY post_count DESC LIMIT 10
    `);

    const popularAnimeResult = await pool.query(`
      SELECT a.uuid, a.title, a.poster_url, a.status,
        COUNT(DISTINCT t.id) as thread_count, SUM(t.views) as total_views
      FROM anime a
      LEFT JOIN threads t ON a.uuid = t.anime_uuid
      GROUP BY a.uuid, a.title, a.poster_url, a.status
      ORDER BY thread_count DESC LIMIT 10
    `);

    const activeForumsResult = await pool.query(`
      SELECT f.id, f.name, f.slug, f.icon,
        COUNT(DISTINCT t.id) as thread_count, COUNT(DISTINCT p.id) as post_count
      FROM forums f
      LEFT JOIN threads t ON f.id = t.forum_id
      LEFT JOIN posts p ON t.id = p.thread_id
      WHERE f.is_active = true
      GROUP BY f.id, f.name, f.slug, f.icon
      ORDER BY thread_count DESC
    `);

    const userRolesResult = await pool.query(`
      SELECT role, COUNT(*) as count FROM users WHERE is_active = true GROUP BY role ORDER BY count DESC
    `);

    const animeStatusResult = await pool.query(`
      SELECT status, COUNT(*) as count FROM anime GROUP BY status ORDER BY count DESC
    `);

    res.json({
      success: true,
      generated_at: new Date().toISOString(),
      statistics: statsResult.rows[0],
      most_active_users: activeUsersResult.rows,
      most_popular_anime: popularAnimeResult.rows,
      most_active_forums: activeForumsResult.rows,
      user_role_distribution: userRolesResult.rows,
      anime_status_distribution: animeStatusResult.rows,
    });
  } catch (error) {
    console.error('Error generating dashboard report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});


// ============= VIEWS / ADMIN =============

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get("/", (req, res) => res.render("login"));
app.get("/dashboard", (req, res) => res.render("dashboard"));

app.get("/dashboard/anime", async (req, res) => {
  try {
    const response = await fetch("http://152.42.220.220/api/anime");
    const result = await response.json();
    res.render("anime", { anime: result.success ? result.data || [] : [] });
  } catch (err) {
    console.error("Failed to load anime page:", err);
    res.render("anime", { anime: [] });
  }
});

app.get("/users", async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email, avatar_url, bio, role, is_active FROM users WHERE is_active = true'
    );
    res.render("user", { users: result.rows });
  } catch (error) {
    console.error("Failed to load users page:", error);
    res.render("user", { users: [] });
  }
});

app.get("/admin/users/create", (req, res) => {
  res.render("user-create", { error: null, success: null });
});

app.post("/admin/users/create", async (req, res) => {
  try {
    const { username, email, password, avatar_url, bio, role } = req.body;
    const is_active = req.body.is_active ? true : false;

    if (!username || !email || !password) {
      return res.status(400).render("user-create", { error: "Missing required fields.", success: null });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, avatar_url, bio, role, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, username, email, role`,
      [username, email, password_hash, avatar_url || null, bio || null, role || "user", is_active]
    );

    res.render("user-create", { error: null, success: `User created successfully (ID: ${result.rows[0].id})` });
  } catch (error) {
    console.error("Create user error:", error);
    const msg = String(error.message).includes("users_email_key") ? "Email already exists." : error.message;
    res.status(500).render("user-create", { error: msg, success: null });
  }
});


// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Dashboard report: http://localhost:${PORT}/api/dashboard/report`);
});

export default app;