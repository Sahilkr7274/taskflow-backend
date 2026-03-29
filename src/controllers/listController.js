const db = require('../models');

exports.createList = async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });
    const list = await db.createList(title, req.params.boardId);
    res.status(201).json(list);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.updateList = async (req, res) => {
  try {
    const list = await db.updateList(req.params.id, req.body.title);
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.deleteList = async (req, res) => {
  try {
    await db.deleteList(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.reorderLists = async (req, res) => {
  try {
    const { orderedIds } = req.body;
    await db.reorderLists(req.params.boardId, orderedIds);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
