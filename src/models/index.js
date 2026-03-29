const pool = require('../config/db');

const getCardDetails = async (cardId) => {
  const [card, labels, members, checklist] = await Promise.all([
    pool.query('SELECT * FROM cards WHERE id = $1', [cardId]),
    pool.query(`
      SELECT l.* FROM labels l
      JOIN card_labels cl ON cl.label_id = l.id
      WHERE cl.card_id = $1
    `, [cardId]),
    pool.query(`
      SELECT u.id, u.name, u.email, u.avatar_color FROM users u
      JOIN card_members cm ON cm.user_id = u.id
      WHERE cm.card_id = $1
    `, [cardId]),
    pool.query('SELECT * FROM checklist_items WHERE card_id = $1 ORDER BY position', [cardId]),
  ]);
  if (!card.rows[0]) return null;
  return { ...card.rows[0], labels: labels.rows, members: members.rows, checklist: checklist.rows };
};

module.exports = {
  // Boards
  getAllBoards: async (userId) => {
    const res = await pool.query('SELECT * FROM boards WHERE owner_id = $1 ORDER BY created_at DESC', [userId]);
    return res.rows;
  },

  getBoardById: async (boardId) => {
    const board = await pool.query('SELECT * FROM boards WHERE id = $1', [boardId]);
    if (!board.rows[0]) return null;

    const lists = await pool.query(
      'SELECT * FROM lists WHERE board_id = $1 ORDER BY position', [boardId]
    );

    const listIds = lists.rows.map(l => l.id);
    let cards = [];
    if (listIds.length > 0) {
      const cardRes = await pool.query(
        'SELECT * FROM cards WHERE list_id = ANY($1) ORDER BY position', [listIds]
      );
      cards = cardRes.rows;

      // Attach labels and members to each card
      if (cards.length > 0) {
        const cardIds = cards.map(c => c.id);
        const [labelsRes, membersRes] = await Promise.all([
          pool.query(`
            SELECT cl.card_id, l.* FROM labels l
            JOIN card_labels cl ON cl.label_id = l.id
            WHERE cl.card_id = ANY($1)
          `, [cardIds]),
          pool.query(`
            SELECT cm.card_id, u.id, u.name, u.avatar_color FROM users u
            JOIN card_members cm ON cm.user_id = u.id
            WHERE cm.card_id = ANY($1)
          `, [cardIds]),
        ]);

        const labelMap = {};
        labelsRes.rows.forEach(l => {
          if (!labelMap[l.card_id]) labelMap[l.card_id] = [];
          labelMap[l.card_id].push(l);
        });
        const memberMap = {};
        membersRes.rows.forEach(m => {
          if (!memberMap[m.card_id]) memberMap[m.card_id] = [];
          memberMap[m.card_id].push(m);
        });

        cards = cards.map(c => ({
          ...c,
          labels: labelMap[c.id] || [],
          members: memberMap[c.id] || [],
        }));
      }
    }

    const listsWithCards = lists.rows.map(l => ({
      ...l,
      cards: cards.filter(c => c.list_id === l.id),
    }));

    const boardLabels = await pool.query('SELECT * FROM labels WHERE board_id = $1', [boardId]);
    const boardMembers = await pool.query(`
      SELECT DISTINCT u.id, u.name, u.email, u.avatar_color FROM users u
      JOIN card_members cm ON cm.user_id = u.id
      JOIN cards c ON c.id = cm.card_id
      JOIN lists l ON l.id = c.list_id
      WHERE l.board_id = $1
      UNION
      SELECT id, name, email, avatar_color FROM users WHERE id = $2
    `, [boardId, board.rows[0].owner_id]);

    return { ...board.rows[0], lists: listsWithCards, labels: boardLabels.rows, members: boardMembers.rows };
  },

  createBoard: async (title, background, userId) => {
    const res = await pool.query(
      'INSERT INTO boards (title, background, owner_id) VALUES ($1, $2, $3) RETURNING *',
      [title, background || 'gradient-blue', userId]
    );
    return res.rows[0];
  },

  createBoardFromTemplate: async (title, background, userId, lists) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const boardRes = await client.query(
        'INSERT INTO boards (title, background, owner_id) VALUES ($1, $2, $3) RETURNING *',
        [title, background || 'gradient-blue', userId]
      );
      const board = boardRes.rows[0];
      for (let li = 0; li < lists.length; li++) {
        const listRes = await client.query(
          'INSERT INTO lists (title, position, board_id) VALUES ($1, $2, $3) RETURNING id',
          [lists[li].title, li, board.id]
        );
        const listId = listRes.rows[0].id;
        for (let ci = 0; ci < (lists[li].cards || []).length; ci++) {
          await client.query(
            'INSERT INTO cards (title, position, list_id) VALUES ($1, $2, $3)',
            [lists[li].cards[ci], ci, listId]
          );
        }
      }
      await client.query('COMMIT');
      return board;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  },

  updateBoard: async (boardId, title, background) => {
    const res = await pool.query(
      'UPDATE boards SET title = COALESCE($1, title), background = COALESCE($2, background) WHERE id = $3 RETURNING *',
      [title, background, boardId]
    );
    return res.rows[0];
  },

  deleteBoard: async (boardId) => {
    await pool.query('DELETE FROM boards WHERE id = $1', [boardId]);
  },

  // Lists
  createList: async (title, boardId) => {
    const pos = await pool.query('SELECT COALESCE(MAX(position), -1) + 1 AS pos FROM lists WHERE board_id = $1', [boardId]);
    const res = await pool.query(
      'INSERT INTO lists (title, position, board_id) VALUES ($1, $2, $3) RETURNING *',
      [title, pos.rows[0].pos, boardId]
    );
    return { ...res.rows[0], cards: [] };
  },

  updateList: async (listId, title) => {
    const res = await pool.query('UPDATE lists SET title = $1 WHERE id = $2 RETURNING *', [title, listId]);
    return res.rows[0];
  },

  deleteList: async (listId) => {
    await pool.query('DELETE FROM lists WHERE id = $1', [listId]);
  },

  reorderLists: async (boardId, orderedIds) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (let i = 0; i < orderedIds.length; i++) {
        await client.query('UPDATE lists SET position = $1 WHERE id = $2 AND board_id = $3', [i, orderedIds[i], boardId]);
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  },

  // Cards
  getCardById: getCardDetails,

  createCard: async (title, listId) => {
    const pos = await pool.query('SELECT COALESCE(MAX(position), -1) + 1 AS pos FROM cards WHERE list_id = $1', [listId]);
    const res = await pool.query(
      'INSERT INTO cards (title, position, list_id) VALUES ($1, $2, $3) RETURNING *',
      [title, pos.rows[0].pos, listId]
    );
    return { ...res.rows[0], labels: [], members: [] };
  },

  updateCard: async (cardId, updates) => {
    const fields = [];
    const values = [];
    let idx = 1;
    if ('title' in updates && updates.title) { fields.push(`title = $${idx++}`); values.push(updates.title); }
    if ('description' in updates) { fields.push(`description = $${idx++}`); values.push(updates.description ?? null); }
    if ('due_date' in updates) { fields.push(`due_date = $${idx++}`); values.push(updates.due_date ?? null); }
    if (fields.length === 0) return getCardDetails(cardId);
    values.push(cardId);
    await pool.query(`UPDATE cards SET ${fields.join(', ')} WHERE id = $${idx}`, values);
    return getCardDetails(cardId);
  },

  deleteCard: async (cardId) => {
    await pool.query('DELETE FROM cards WHERE id = $1', [cardId]);
  },

  moveCard: async (cardId, newListId, newPosition) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const card = await client.query('SELECT * FROM cards WHERE id = $1', [cardId]);
      const oldListId = card.rows[0].list_id;

      // Shift cards in old list
      await client.query(
        'UPDATE cards SET position = position - 1 WHERE list_id = $1 AND position > $2',
        [oldListId, card.rows[0].position]
      );
      // Make room in new list
      await client.query(
        'UPDATE cards SET position = position + 1 WHERE list_id = $1 AND position >= $2',
        [newListId, newPosition]
      );
      // Move card
      await client.query(
        'UPDATE cards SET list_id = $1, position = $2 WHERE id = $3',
        [newListId, newPosition, cardId]
      );
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  },

  // Labels
  getBoardLabels: async (boardId) => {
    const res = await pool.query('SELECT * FROM labels WHERE board_id = $1', [boardId]);
    return res.rows;
  },

  createLabel: async (name, color, boardId) => {
    const res = await pool.query(
      'INSERT INTO labels (name, color, board_id) VALUES ($1, $2, $3) RETURNING *',
      [name, color, boardId]
    );
    return res.rows[0];
  },

  toggleCardLabel: async (cardId, labelId) => {
    const exists = await pool.query(
      'SELECT 1 FROM card_labels WHERE card_id = $1 AND label_id = $2', [cardId, labelId]
    );
    if (exists.rows.length > 0) {
      await pool.query('DELETE FROM card_labels WHERE card_id = $1 AND label_id = $2', [cardId, labelId]);
      return { action: 'removed' };
    } else {
      await pool.query('INSERT INTO card_labels (card_id, label_id) VALUES ($1, $2)', [cardId, labelId]);
      return { action: 'added' };
    }
  },

  // Members
  getUsers: async () => {
    const res = await pool.query('SELECT id, name, email, avatar_color FROM users');
    return res.rows;
  },

  toggleCardMember: async (cardId, userId) => {
    const exists = await pool.query(
      'SELECT 1 FROM card_members WHERE card_id = $1 AND user_id = $2', [cardId, userId]
    );
    if (exists.rows.length > 0) {
      await pool.query('DELETE FROM card_members WHERE card_id = $1 AND user_id = $2', [cardId, userId]);
      return { action: 'removed' };
    } else {
      await pool.query('INSERT INTO card_members (card_id, user_id) VALUES ($1, $2)', [cardId, userId]);
      return { action: 'added' };
    }
  },

  // Checklist
  addChecklistItem: async (cardId, text) => {
    const pos = await pool.query('SELECT COALESCE(MAX(position), -1) + 1 AS pos FROM checklist_items WHERE card_id = $1', [cardId]);
    const res = await pool.query(
      'INSERT INTO checklist_items (text, position, card_id) VALUES ($1, $2, $3) RETURNING *',
      [text, pos.rows[0].pos, cardId]
    );
    return res.rows[0];
  },

  updateChecklistItem: async (itemId, updates) => {
    const { text, completed } = updates;
    const res = await pool.query(
      'UPDATE checklist_items SET text = COALESCE($1, text), completed = COALESCE($2, completed) WHERE id = $3 RETURNING *',
      [text, completed, itemId]
    );
    return res.rows[0];
  },

  deleteChecklistItem: async (itemId) => {
    await pool.query('DELETE FROM checklist_items WHERE id = $1', [itemId]);
  },

  // Search
  searchCards: async (boardId, query, labelIds, memberIds, dueDateFilter) => {
    let sql = `
      SELECT DISTINCT c.*, l.id as list_id_ref FROM cards c
      JOIN lists l ON l.id = c.list_id
      WHERE l.board_id = $1
    `;
    const params = [boardId];
    let idx = 2;

    if (query) {
      sql += ` AND c.title ILIKE $${idx}`;
      params.push(`%${query}%`);
      idx++;
    }
    if (labelIds && labelIds.length > 0) {
      sql += ` AND EXISTS (SELECT 1 FROM card_labels cl WHERE cl.card_id = c.id AND cl.label_id = ANY($${idx}))`;
      params.push(labelIds);
      idx++;
    }
    if (memberIds && memberIds.length > 0) {
      sql += ` AND EXISTS (SELECT 1 FROM card_members cm WHERE cm.card_id = c.id AND cm.user_id = ANY($${idx}))`;
      params.push(memberIds);
      idx++;
    }
    if (dueDateFilter === 'overdue') {
      // due_date exists AND the due date (date only, ignoring time) is strictly before today
      sql += ` AND c.due_date IS NOT NULL AND c.due_date::date < CURRENT_DATE`;
    } else if (dueDateFilter === 'due_soon') {
      // due_date exists AND due date is today or within the next 3 days (not already past)
      sql += ` AND c.due_date IS NOT NULL AND c.due_date::date >= CURRENT_DATE AND c.due_date::date <= CURRENT_DATE + INTERVAL '3 days'`;
    }

    const res = await pool.query(sql, params);
    return res.rows;
  },
};
