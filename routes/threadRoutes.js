const express = require('express');
const router = express.Router();
const pool = require('../db');

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

router.post('/threads', async (req, res) => {
  try {
    const { forum_id, user_id, core_anime_id, title, content } = req.body;

    if (!forum_id || !user_id || !core_anime_id || !title || !content) {
      return res.status(400).json({
        success: false,
        error: 'forum_id, user_id, core_anime_id, title, and content are required',
      });
    }

    // 1) Validate anime from core system
    const animeListRes = await fetch('http://152.42.177.225/api/anime');

    if (!animeListRes.ok) {
      return res.status(500).json({
        success: false,
        error: 'Failed to validate anime from core system',
      });
    }

    const animeList = await animeListRes.json();
    const foundAnime = Array.isArray(animeList)
      ? animeList.find((a) => Number(a.id) === Number(core_anime_id))
      : animeList.data?.find((a) => Number(a.id) === Number(core_anime_id));

    if (!foundAnime) {
      return res.status(400).json({
        success: false,
        error: 'Selected anime not found in core system',
      });
    }

    // 2) Save thread
    const slug = slugify(title);

    const query = `
      INSERT INTO threads (
        forum_id,
        user_id,
        title,
        slug,
        content,
        core_anime_id,
        anime_title_snapshot,
        anime_description_snapshot,
        anime_image_snapshot
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *;
    `;

    const values = [
      forum_id,
      user_id,
      title,
      slug,
      content,
      core_anime_id,
      foundAnime.title,
      foundAnime.description,
      foundAnime.image_url,
    ];

    const result = await pool.query(query, values);

    return res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Create thread error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

module.exports = router;