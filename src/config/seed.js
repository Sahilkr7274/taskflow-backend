require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const pool = require('../config/db');

const seed = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Default user
    const userRes = await client.query(`
      INSERT INTO users (id, name, email, avatar_color)
      VALUES ('00000000-0000-0000-0000-000000000001', 'Alex Johnson', 'alex@example.com', '#0052CC')
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `);
    const userId = userRes.rows[0].id;

    // Extra members
    await client.query(`
      INSERT INTO users (id, name, email, avatar_color) VALUES
        ('00000000-0000-0000-0000-000000000002', 'Sara Lee', 'sara@example.com', '#E6007A'),
        ('00000000-0000-0000-0000-000000000003', 'Mike Chen', 'mike@example.com', '#00875A')
      ON CONFLICT (id) DO NOTHING
    `);

    // Boards
    const b1 = await client.query(`
      INSERT INTO boards (title, background, owner_id)
      VALUES ('Product Roadmap', 'gradient-blue', $1) RETURNING id
    `, [userId]);
    const b2 = await client.query(`
      INSERT INTO boards (title, background, owner_id)
      VALUES ('Marketing Campaign', 'gradient-purple', $1) RETURNING id
    `, [userId]);

    const boardId = b1.rows[0].id;
    const board2Id = b2.rows[0].id;

    // Lists for board 1
    const lists = await client.query(`
      INSERT INTO lists (title, position, board_id) VALUES
        ('Backlog', 0, $1),
        ('In Progress', 1, $1),
        ('Review', 2, $1),
        ('Done', 3, $1)
      RETURNING id, title
    `, [boardId]);

    const [backlog, inProgress, review, done] = lists.rows;

    // Cards
    const cards = await client.query(`
      INSERT INTO cards (title, description, position, list_id) VALUES
        ('User Authentication', 'Implement JWT-based auth with refresh tokens', 0, $1),
        ('Dashboard UI', 'Design and build the main dashboard', 1, $1),
        ('API Integration', 'Connect frontend to REST APIs', 0, $2),
        ('Performance Audit', 'Run Lighthouse and fix issues', 1, $2),
        ('Code Review', 'Review PR #42', 0, $3),
        ('Deploy v1.0', 'Deploy to production on Render', 0, $4)
      RETURNING id
    `, [backlog.id, inProgress.id, review.id, done.id]);

    // Labels for board 1
    const labels = await client.query(`
      INSERT INTO labels (name, color, board_id) VALUES
        ('Feature', '#0052CC', $1),
        ('Bug', '#FF5630', $1),
        ('Design', '#6554C0', $1),
        ('Urgent', '#FF8B00', $1)
      RETURNING id
    `, [boardId]);

    // Assign labels to cards
    await client.query(`
      INSERT INTO card_labels (card_id, label_id) VALUES ($1, $2), ($3, $4)
    `, [cards.rows[0].id, labels.rows[0].id, cards.rows[1].id, labels.rows[2].id]);

    // Assign members
    await client.query(`
      INSERT INTO card_members (card_id, user_id) VALUES ($1, $2), ($1, $3)
    `, [cards.rows[0].id, userId, '00000000-0000-0000-0000-000000000002']);

    // Checklist items
    await client.query(`
      INSERT INTO checklist_items (text, completed, position, card_id) VALUES
        ('Set up JWT middleware', true, 0, $1),
        ('Create login endpoint', true, 1, $1),
        ('Add refresh token logic', false, 2, $1),
        ('Write unit tests', false, 3, $1)
    `, [cards.rows[0].id]);

    // Lists for board 2
    await client.query(`
      INSERT INTO lists (title, position, board_id) VALUES
        ('Ideas', 0, $1), ('Planned', 1, $1), ('Launched', 2, $1)
    `, [board2Id]);

    await client.query('COMMIT');
    console.log('✅ Seed completed successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
};

seed();
