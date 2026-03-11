const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || "http://152.42.220.220/";

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'anime_forum',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Database connected successfully');
  }
});

// ============= ANIME ROUTES =============

// GET all anime
app.get('/api/anime', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM anime ORDER BY created_at DESC'
    );
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching anime:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET single anime by UUID
app.get('/api/anime/:uuid', async (req, res) => {
  try {
    const { uuid } = req.params;
    const result = await pool.query(
      'SELECT * FROM anime WHERE uuid = $1',
      [uuid]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Anime not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching anime:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST create new anime
app.post('/api/anime', async (req, res) => {
  try {
    const { uuid, title, poster_url, status } = req.body;
    
    const result = await pool.query(
      `INSERT INTO anime (uuid, title, poster_url, status) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [uuid, title, poster_url, status]
    );
    
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error creating anime:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT update anime
app.put('/api/anime/:uuid', async (req, res) => {
  try {
    const { uuid } = req.params;
    const { title, poster_url, status } = req.body;
    
    const result = await pool.query(
      `UPDATE anime 
       SET title = COALESCE($1, title), 
           poster_url = COALESCE($2, poster_url), 
           status = COALESCE($3, status),
           updated_at = NOW()
       WHERE uuid = $4 
       RETURNING *`,
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

// DELETE anime
app.delete('/api/anime/:uuid', async (req, res) => {
  try {
    const { uuid } = req.params;
    const result = await pool.query(
      'DELETE FROM anime WHERE uuid = $1 RETURNING *',
      [uuid]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Anime not found' });
    }
    
    res.json({ success: true, message: 'Anime deleted successfully' });
  } catch (error) {
    console.error('Error deleting anime:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============= USER ROUTES =============

// GET all users
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, email, avatar_url, bio, role, is_active, created_at 
       FROM users ORDER BY created_at DESC`
    );
    res.json({ success: true, data: result.rows, count: result.rows.length });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET single user
app.get('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT id, username, email, avatar_url, bio, role, is_active, created_at 
       FROM users WHERE id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST create user
app.post('/api/users', async (req, res) => {
  try {
    const { username, email, password_hash, avatar_url, bio, role } = req.body;
    
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, avatar_url, bio, role) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, username, email, avatar_url, bio, role, is_active, created_at`,
      [username, email, password_hash, avatar_url, bio, role || 'user']
    );
    
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============= FORUM ROUTES =============

// GET all forums
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

// GET single forum with thread count
app.get('/api/forums/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT f.*, COUNT(t.id) as thread_count
       FROM forums f
       LEFT JOIN threads t ON f.id = t.forum_id
       WHERE f.id = $1
       GROUP BY f.id`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Forum not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching forum:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============= THREAD ROUTES =============

// GET all threads with filters
app.get('/api/threads', async (req, res) => {
  try {
    const { forum_id, anime_uuid, user_id, is_pinned } = req.query;
    
    let query = `
      SELECT t.*, 
             u.username as author_username,
             u.avatar_url as author_avatar,
             a.title as anime_title,
             f.name as forum_name,
             COUNT(DISTINCT p.id) as post_count
      FROM threads t
      JOIN users u ON t.user_id = u.id
      JOIN anime a ON t.anime_uuid = a.uuid
      JOIN forums f ON t.forum_id = f.id
      LEFT JOIN posts p ON t.id = p.thread_id
      WHERE t.is_active = true
    `;
    
    const params = [];
    let paramCount = 1;
    
    if (forum_id) {
      query += ` AND t.forum_id = $${paramCount}`;
      params.push(forum_id);
      paramCount++;
    }
    
    if (anime_uuid) {
      query += ` AND t.anime_uuid = $${paramCount}`;
      params.push(anime_uuid);
      paramCount++;
    }
    
    if (user_id) {
      query += ` AND t.user_id = $${paramCount}`;
      params.push(user_id);
      paramCount++;
    }
    
    if (is_pinned !== undefined) {
      query += ` AND t.is_pinned = $${paramCount}`;
      params.push(is_pinned);
      paramCount++;
    }
    
    query += `
      GROUP BY t.id, u.username, u.avatar_url, a.title, f.name
      ORDER BY t.is_pinned DESC, t.created_at DESC
    `;
    
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows, count: result.rows.length });
  } catch (error) {
    console.error('Error fetching threads:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET single thread with details
app.get('/api/threads/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT t.*, 
              u.username as author_username,
              u.avatar_url as author_avatar,
              u.bio as author_bio,
              a.title as anime_title,
              a.poster_url as anime_poster,
              f.name as forum_name,
              COUNT(DISTINCT p.id) as post_count
       FROM threads t
       JOIN users u ON t.user_id = u.id
       JOIN anime a ON t.anime_uuid = a.uuid
       JOIN forums f ON t.forum_id = f.id
       LEFT JOIN posts p ON t.id = p.thread_id
       WHERE t.id = $1
       GROUP BY t.id, u.username, u.avatar_url, u.bio, a.title, a.poster_url, f.name`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Thread not found' });
    }
    
    // Increment view count
    await pool.query(
      'UPDATE threads SET views = views + 1 WHERE id = $1',
      [id]
    );
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching thread:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST create thread
app.get('/api/threads', async (req, res) => {
  try {
    const { forum_id, anime_uuid, user_id, is_pinned } = req.query;

    let query = `
      SELECT t.*, 
             u.username as author_username,
             u.avatar_url as author_avatar,
             a.title as anime_title,
             f.name as forum_name,
             COUNT(DISTINCT p.id) as post_count,
             COUNT(DISTINCT pl.id) as like_count
      FROM threads t
      JOIN users u ON t.user_id = u.id
      JOIN anime a ON t.anime_uuid = a.uuid
      JOIN forums f ON t.forum_id = f.id
      LEFT JOIN posts p ON t.id = p.thread_id
      LEFT JOIN post_likes pl ON p.id = pl.post_id
      WHERE t.is_active = true
    `;

    const params = [];
    let paramCount = 1;

    if (forum_id) {
      query += ` AND t.forum_id = $${paramCount}`;
      params.push(forum_id);
      paramCount++;
    }

    if (anime_uuid) {
      query += ` AND t.anime_uuid = $${paramCount}`;
      params.push(anime_uuid);
      paramCount++;
    }

    if (user_id) {
      query += ` AND t.user_id = $${paramCount}`;
      params.push(user_id);
      paramCount++;
    }

    if (is_pinned !== undefined) {
      query += ` AND t.is_pinned = $${paramCount}`;
      params.push(is_pinned);
      paramCount++;
    }

    query += `
      GROUP BY t.id, u.username, u.avatar_url, a.title, f.name
      ORDER BY t.is_pinned DESC, t.created_at DESC
    `;

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows, count: result.rows.length });
  } catch (error) {
    console.error('Error fetching threads:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT update thread
app.put('/api/threads/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, is_pinned, is_locked } = req.body;
    
    const result = await pool.query(
      `UPDATE threads 
       SET title = COALESCE($1, title),
           content = COALESCE($2, content),
           is_pinned = COALESCE($3, is_pinned),
           is_locked = COALESCE($4, is_locked),
           updated_at = NOW()
       WHERE id = $5 
       RETURNING *`,
      [title, content, is_pinned, is_locked, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Thread not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error updating thread:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE thread
app.delete('/api/threads/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'UPDATE threads SET is_active = false WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Thread not found' });
    }
    
    res.json({ success: true, message: 'Thread deleted successfully' });
  } catch (error) {
    console.error('Error deleting thread:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============= POST ROUTES =============

// GET posts for a thread
app.get('/api/threads/:threadId/posts', async (req, res) => {
  try {
    const { threadId } = req.params;
    const result = await pool.query(
      `SELECT p.*, 
              u.username as author_username,
              u.avatar_url as author_avatar,
              u.role as author_role,
              COUNT(pl.id) as like_count
       FROM posts p
       JOIN users u ON p.user_id = u.id
       LEFT JOIN post_likes pl ON p.id = pl.post_id
       WHERE p.thread_id = $1 AND p.is_active = true
       GROUP BY p.id, u.username, u.avatar_url, u.role
       ORDER BY p.created_at ASC`,
      [threadId]
    );
    
    res.json({ success: true, data: result.rows, count: result.rows.length });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST create post
app.post('/api/posts', async (req, res) => {
  try {
    const { thread_id, user_id, content } = req.body;
    
    const result = await pool.query(
      `INSERT INTO posts (thread_id, user_id, content) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [thread_id, user_id, content]
    );
    
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT update post
app.put('/api/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    
    const result = await pool.query(
      `UPDATE posts 
       SET content = $1, updated_at = NOW()
       WHERE id = $2 
       RETURNING *`,
      [content, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE post
app.delete('/api/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'UPDATE posts SET is_active = false WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }
    
    res.json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============= POST LIKES ROUTES =============

// POST like a post
app.post('/api/posts/:postId/like', async (req, res) => {
  try {
    const { postId } = req.params;
    const { user_id } = req.body;

    const result = await pool.query(
      `INSERT INTO post_likes (post_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (post_id, user_id) DO NOTHING
       RETURNING *`,
      [postId, user_id]
    );

    if (result.rows.length === 0) {
      return res.json({ success: true, message: 'Already liked' });
    }

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error liking post:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE unlike a post
app.delete('/api/posts/:postId/like', async (req, res) => {
  try {
    const { postId } = req.params;
    const { user_id } = req.body;
    
    const result = await pool.query(
      'DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2 RETURNING *',
      [postId, user_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Like not found' });
    }
    
    res.json({ success: true, message: 'Post unliked successfully' });
  } catch (error) {
    console.error('Error unliking post:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============= DASHBOARD REPORT =============

app.get('/api/dashboard/report', async (req, res) => {
  try {
    // Get overall statistics
    const statsResult = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE is_active = true) as total_users,
        (SELECT COUNT(*) FROM anime) as total_anime,
        (SELECT COUNT(*) FROM forums WHERE is_active = true) as total_forums,
        (SELECT COUNT(*) FROM threads WHERE is_active = true) as total_threads,
        (SELECT COUNT(*) FROM posts WHERE is_active = true) as total_posts,
        (SELECT COUNT(*) FROM post_likes) as total_likes
    `);
    
    // Get most active users
    const activeUsersResult = await pool.query(`
      SELECT 
        u.id, 
        u.username, 
        u.avatar_url,
        COUNT(DISTINCT p.id) as post_count,
        COUNT(DISTINCT t.id) as thread_count
      FROM users u
      LEFT JOIN posts p ON u.id = p.user_id
      LEFT JOIN threads t ON u.id = t.user_id
      WHERE u.is_active = true
      GROUP BY u.id, u.username, u.avatar_url
      ORDER BY post_count DESC, thread_count DESC
      LIMIT 10
    `);
    
    // Get most popular anime
    const popularAnimeResult = await pool.query(`
      SELECT 
        a.uuid,
        a.title,
        a.poster_url,
        a.status,
        COUNT(DISTINCT t.id) as thread_count,
        SUM(t.views) as total_views
      FROM anime a
      LEFT JOIN threads t ON a.uuid = t.anime_uuid
      GROUP BY a.uuid, a.title, a.poster_url, a.status
      ORDER BY thread_count DESC, total_views DESC
      LIMIT 10
    `);
    
    // Get most active forums
    const activeForumsResult = await pool.query(`
      SELECT 
        f.id,
        f.name,
        f.slug,
        f.icon,
        COUNT(DISTINCT t.id) as thread_count,
        COUNT(DISTINCT p.id) as post_count
      FROM forums f
      LEFT JOIN threads t ON f.id = t.forum_id
      LEFT JOIN posts p ON t.id = p.thread_id
      WHERE f.is_active = true
      GROUP BY f.id, f.name, f.slug, f.icon
      ORDER BY thread_count DESC, post_count DESC
    `);
    
    // Get recent activity
    const recentActivityResult = await pool.query(`
      SELECT 
        'thread' as activity_type,
        t.id,
        t.title,
        t.created_at,
        u.username,
        u.avatar_url,
        a.title as anime_title
      FROM threads t
      JOIN users u ON t.user_id = u.id
      JOIN anime a ON t.anime_uuid = a.uuid
      WHERE t.is_active = true
      ORDER BY t.created_at DESC
      LIMIT 5
    `);
    
    // Get thread engagement statistics
    const threadEngagementResult = await pool.query(`
      SELECT 
        t.id,
        t.title,
        t.views,
        COUNT(DISTINCT p.id) as reply_count,
        COUNT(DISTINCT pl.id) as like_count,
        a.title as anime_title,
        f.name as forum_name
      FROM threads t
      JOIN anime a ON t.anime_uuid = a.uuid
      JOIN forums f ON t.forum_id = f.id
      LEFT JOIN posts p ON t.id = p.thread_id
      LEFT JOIN post_likes pl ON p.id = pl.post_id
      WHERE t.is_active = true
      GROUP BY t.id, t.title, t.views, a.title, f.name
      ORDER BY t.views DESC, reply_count DESC
      LIMIT 10
    `);
    
    // Get user role distribution
    const userRolesResult = await pool.query(`
      SELECT 
        role,
        COUNT(*) as count
      FROM users
      WHERE is_active = true
      GROUP BY role
      ORDER BY count DESC
    `);
    
    // Get anime status distribution
    const animeStatusResult = await pool.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM anime
      GROUP BY status
      ORDER BY count DESC
    `);
    
    const report = {
      success: true,
      generated_at: new Date().toISOString(),
      statistics: statsResult.rows[0],
      most_active_users: activeUsersResult.rows,
      most_popular_anime: popularAnimeResult.rows,
      most_active_forums: activeForumsResult.rows,
      recent_activity: recentActivityResult.rows,
      top_threads_by_engagement: threadEngagementResult.rows,
      user_role_distribution: userRolesResult.rows,
      anime_status_distribution: animeStatusResult.rows
    };
    
    res.json(report);
  } catch (error) {
    console.error('Error generating dashboard report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============= SEARCH ROUTES =============


app.get('/api/search', async (req, res) => {
  try {
    const { q, type } = req.query;
    
    if (!q) {
      return res.status(400).json({ success: false, error: 'Search query required' });
    }
    
    const searchTerm = `%${q}%`;
    let results = {};
    
    if (!type || type === 'threads') {
      const threadsResult = await pool.query(
        `SELECT t.*, u.username, a.title as anime_title
         FROM threads t
         JOIN users u ON t.user_id = u.id
         JOIN anime a ON t.anime_uuid = a.uuid
         WHERE (t.title ILIKE $1 OR t.content ILIKE $1) AND t.is_active = true
         LIMIT 20`,
        [searchTerm]
      );
      results.threads = threadsResult.rows;
    }
    
    if (!type || type === 'anime') {
      const animeResult = await pool.query(
        'SELECT * FROM anime WHERE title ILIKE $1 LIMIT 20',
        [searchTerm]
      );
      results.anime = animeResult.rows;
    }
    
    if (!type || type === 'users') {
      const usersResult = await pool.query(
        `SELECT id, username, avatar_url, bio, role 
         FROM users 
         WHERE (username ILIKE $1 OR bio ILIKE $1) AND is_active = true
         LIMIT 20`,
        [searchTerm]
      );
      results.users = usersResult.rows;
    }
    
    res.json({ success: true, query: q, results });
  } catch (error) {
    console.error('Error searching:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});



// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Dashboard report: http://localhost:${PORT}/api/dashboard/report`);
});

module.exports = app;