const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async create({ username, email, password }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const query = `
      INSERT INTO users (username, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id, username, email, avatar_url, bio, role, created_at
    `;
    
    const result = await pool.query(query, [username, email, hashedPassword]);
    return result.rows[0];
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = `
      SELECT id, username, email, avatar_url, bio, role, created_at
      FROM users WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async update(id, data) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (data.username) {
      fields.push(`username = $${paramCount++}`);
      values.push(data.username);
    }
    if (data.email) {
      fields.push(`email = $${paramCount++}`);
      values.push(data.email);
    }
    if (data.bio) {
      fields.push(`bio = $${paramCount++}`);
      values.push(data.bio);
    }
    if (data.avatar_url) {
      fields.push(`avatar_url = $${paramCount++}`);
      values.push(data.avatar_url);
    }

    values.push(id);

    const query = `
      UPDATE users 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, username, email, avatar_url, bio, role, created_at
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = User;