const pool = require('../db');
const slugify = require('../utils/slugify');
const { getAnimeById } = require('../services/animeService');

async function createThread(req, res, next) {
  try {
    const { forum_id, user_id, anime_id, title, content } = req.body;

    if (!forum_id || !user_id || !anime_id || !title || !content) {
      return res.status(400).json({
        message: 'forum_id, user_id, anime_id, title, and content are required',
      });
    }

    // Check anime from core backend
    const anime = await getAnimeById(anime_id);

    if (!anime) {
      return res.status(400).json({
        message: 'Invalid anime_id. Anime not found in core system.',
      });
    }

    const slug = slugify(title);

const query = `
  INSERT INTO threads (forum_id, user_id, anime_id, title, slug, content)
  VALUES ($1, $2, $3, $4, $5, $6)
  RETURNING *;
`;

const values = [forum_id, user_id, anime_id, title, slug, content];
const result = await pool.query(query, values);

    return res.status(201).json({
      message: 'Thread created successfully',
      thread: result.rows[0],
      anime,
    });
  } catch (error) {
    next(error);
  }
}

async function getThreadById(req, res, next) {
  try {
    const { id } = req.params;

    const query = `
      SELECT t.*, u.username, f.name AS forum_name
      FROM threads t
      JOIN users u ON t.user_id = u.id
      JOIN forums f ON t.forum_id = f.id
      WHERE t.id = $1 AND t.is_active = true
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Thread not found' });
    }

    const thread = result.rows[0];
    const anime = thread.anime_id ? await getAnimeById(thread.anime_id) : null;

    return res.json({
      thread,
      anime,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createThread,
  getThreadById,
};