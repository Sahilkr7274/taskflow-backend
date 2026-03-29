const db = require('../models');

const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001';

exports.getBoards = async (req, res) => {
  try {
    const boards = await db.getAllBoards(DEFAULT_USER_ID);
    res.json(boards);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.getBoard = async (req, res) => {
  try {
    const board = await db.getBoardById(req.params.id);
    if (!board) return res.status(404).json({ error: 'Board not found' });
    res.json(board);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.createBoard = async (req, res) => {
  try {
    const { title, background } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });
    const board = await db.createBoard(title, background, DEFAULT_USER_ID);
    res.status(201).json(board);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.createBoardFromTemplate = async (req, res) => {
  try {
    const { title, background, lists } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });
    if (!lists || !Array.isArray(lists)) return res.status(400).json({ error: 'Lists are required' });
    const board = await db.createBoardFromTemplate(title, background, DEFAULT_USER_ID, lists);
    res.status(201).json(board);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.updateBoard = async (req, res) => {
  try {
    const board = await db.updateBoard(req.params.id, req.body.title, req.body.background);
    res.json(board);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.deleteBoard = async (req, res) => {
  try {
    await db.deleteBoard(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.searchCards = async (req, res) => {
  try {
    const { q, labels, members, due } = req.query;
    const labelIds = labels ? labels.split(',') : [];
    const memberIds = members ? members.split(',') : [];
    const cards = await db.searchCards(req.params.id, q, labelIds, memberIds, due);
    res.json(cards);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
