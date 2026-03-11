const pool = require('../config/database');

class Thread {
  static async create({ forum_id, user_id, title, slug, content }) {
    const query = `
      INSERT INTO threads (forum_id, user_id, title, slug, content)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const result = await pool.query(query, [forum_id, user_id, title, slug, content]);
    return result.rows[0];
  }

  static async findByForum(forumId, limit = 20, offset = 0) {
    const query = `
      SELECT t.*, 
             u.username as author_username,
             u.avatar_url as author_avatar,
             COUNT(DISTINCT p.id) as reply_count,
             MAX(COALESCE(p.created_at, t.created_at)) as last_activity
      FROM threads t
      JOIN users u ON t.user_id = u.id
      LEFT JOIN posts p ON t.id = p.thread_id AND p.is_active = true
      WHERE t.forum_id = $1 AND t.is_active = true
      GROUP BY t.id, u.username, u.avatar_url
      ORDER BY t.is_pinned DESC, last_activity DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await pool.query(query, [forumId, limit, offset]);
    return result.rows;
  }

  static async findBySlug(slug) {
    const query = `
      SELECT t.*, 
             u.username as author_username,
             u.avatar_url as author_avatar,
             f.name as forum_name,
             f.slug as forum_slug
      FROM threads t
      JOIN users u ON t.user_id = u.id
      JOIN forums f ON t.forum_id = f.id
      WHERE t.slug = $1 AND t.is_active = true
    `;
    
    const result = await pool.query(query, [slug]);
    return result.rows[0];
  }

  static async incrementViews(id) {
    const query = 'UPDATE threads SET views = views + 1 WHERE id = $1';
    await pool.query(query, [id]);
  }

  static async update(id, data) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (data.title) {
      fields.push(`title = $${paramCount++}`);
      values.push(data.title);
    }
    if (data.content) {
      fields.push(`content = $${paramCount++}`);
      values.push(data.content);
    }
    if (typeof data.is_pinned !== 'undefined') {
      fields.push(`is_pinned = $${paramCount++}`);
      values.push(data.is_pinned);
    }
    if (typeof data.is_locked !== 'undefined') {
      fields.push(`is_locked = $${paramCount++}`);
      values.push(data.is_locked);
    }

    values.push(id);

    const query = `
      UPDATE threads 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'UPDATE threads SET is_active = false WHERE id = $1';
    await pool.query(query, [id]);
  }
}

module.exports = Thread;