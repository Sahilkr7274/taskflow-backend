const db = require('../models');

exports.getCard = async (req, res) => {
  try {
    const card = await db.getCardById(req.params.id);
    if (!card) return res.status(404).json({ error: 'Card not found' });
    res.json(card);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.createCard = async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });
    const card = await db.createCard(title, req.params.listId);
    res.status(201).json(card);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.updateCard = async (req, res) => {
  try {
    const card = await db.updateCard(req.params.id, req.body);
    res.json(card);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.deleteCard = async (req, res) => {
  try {
    await db.deleteCard(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.moveCard = async (req, res) => {
  try {
    const { listId, position } = req.body;
    await db.moveCard(req.params.id, listId, position);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.toggleLabel = async (req, res) => {
  try {
    const result = await db.toggleCardLabel(req.params.id, req.params.labelId);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.toggleMember = async (req, res) => {
  try {
    const result = await db.toggleCardMember(req.params.id, req.params.userId);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.addChecklistItem = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });
    const item = await db.addChecklistItem(req.params.id, text);
    res.status(201).json(item);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.updateChecklistItem = async (req, res) => {
  try {
    const item = await db.updateChecklistItem(req.params.itemId, req.body);
    res.json(item);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.deleteChecklistItem = async (req, res) => {
  try {
    await db.deleteChecklistItem(req.params.itemId);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
