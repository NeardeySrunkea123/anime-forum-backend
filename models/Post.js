const pool = require('../config/database');

class Post {
  static async create({ thread_id, user_id, content }) {
    const query = `
      INSERT INTO posts (thread_id, user_id, content)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const result = await pool.query(query, [thread_id, user_id, content]);
    return result.rows[0];
  }

  static async findByThread(threadId, limit = 20, offset = 0) {
    const query = `
      SELECT p.*, 
             u.username as author_username,
             u.avatar_url as author_avatar,
             u.role as author_role,
             COUNT(DISTINCT pl.id) as like_count
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN post_likes pl ON p.id = pl.post_id
      WHERE p.thread_id = $1 AND p.is_active = true
      GROUP BY p.id, u.username, u.avatar_url, u.role
      ORDER BY p.created_at ASC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await pool.query(query, [threadId, limit, offset]);
    return result.rows;
  }

  static async findById(id) {
    const query = 'SELECT * FROM posts WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async update(id, content) {
    const query = `
      UPDATE posts 
      SET content = $1
      WHERE id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [content, id]);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'UPDATE posts SET is_active = false WHERE id = $1';
    await pool.query(query, [id]);
  }

  static async like(postId, userId) {
    const query = `
      INSERT INTO post_likes (post_id, user_id)
      VALUES ($1, $2)
      ON CONFLICT (post_id, user_id) DO NOTHING
      RETURNING *
    `;
    
    const result = await pool.query(query, [postId, userId]);
    return result.rows[0];
  }

  static async unlike(postId, userId) {
    const query = 'DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2';
    await pool.query(query, [postId, userId]);
  }
}

module.exports = Post;