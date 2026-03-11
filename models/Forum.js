const pool = require('../config/database');

class Forum {
  static async create({ name, description, slug, icon }) {
    const query = `
      INSERT INTO forums (name, description, slug, icon)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const result = await pool.query(query, [name, description, slug, icon]);
    return result.rows[0];
  }

  static async findAll() {
    const query = `
      SELECT f.*, 
             COUNT(DISTINCT t.id) as thread_count,
             COUNT(DISTINCT p.id) as post_count
      FROM forums f
      LEFT JOIN threads t ON f.id = t.forum_id AND t.is_active = true
      LEFT JOIN posts p ON t.id = p.thread_id AND p.is_active = true
      WHERE f.is_active = true
      GROUP BY f.id
      ORDER BY f.display_order, f.name
    `;
    
    const result = await pool.query(query);
    return result.rows;
  }

  static async findBySlug(slug) {
    const query = 'SELECT * FROM forums WHERE slug = $1 AND is_active = true';
    const result = await pool.query(query, [slug]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM forums WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async update(id, data) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (data.name) {
      fields.push(`name = $${paramCount++}`);
      values.push(data.name);
    }
    if (data.description) {
      fields.push(`description = $${paramCount++}`);
      values.push(data.description);
    }
    if (data.slug) {
      fields.push(`slug = $${paramCount++}`);
      values.push(data.slug);
    }
    if (data.icon) {
      fields.push(`icon = $${paramCount++}`);
      values.push(data.icon);
    }

    values.push(id);

    const query = `
      UPDATE forums 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'UPDATE forums SET is_active = false WHERE id = $1';
    await pool.query(query, [id]);
  }
}

module.exports = Forum;