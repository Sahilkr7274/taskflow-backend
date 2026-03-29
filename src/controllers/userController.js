const db = require('../models');

exports.getUsers = async (req, res) => {
  try {
    const users = await db.getUsers();
    res.json(users);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.getBoardLabels = async (req, res) => {
  try {
    const labels = await db.getBoardLabels(req.params.boardId);
    res.json(labels);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.createLabel = async (req, res) => {
  try {
    const { name, color } = req.body;
    if (!color) return res.status(400).json({ error: 'Color is required' });
    const label = await db.createLabel(name, color, req.params.boardId);
    res.status(201).json(label);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
