const router = require('express').Router();
const bc = require('../controllers/boardController');
const lc = require('../controllers/listController');
const cc = require('../controllers/cardController');
const uc = require('../controllers/userController');

// Boards
router.get('/boards', bc.getBoards);
router.post('/boards', bc.createBoard);
router.post('/boards/template', bc.createBoardFromTemplate);
router.get('/boards/:id', bc.getBoard);
router.put('/boards/:id', bc.updateBoard);
router.delete('/boards/:id', bc.deleteBoard);
router.get('/boards/:id/search', bc.searchCards);

// Lists
router.post('/boards/:boardId/lists', lc.createList);
router.put('/lists/:id', lc.updateList);
router.delete('/lists/:id', lc.deleteList);
router.put('/boards/:boardId/lists/reorder', lc.reorderLists);

// Cards
router.post('/lists/:listId/cards', cc.createCard);
router.get('/cards/:id', cc.getCard);
router.put('/cards/:id', cc.updateCard);
router.delete('/cards/:id', cc.deleteCard);
router.put('/cards/:id/move', cc.moveCard);
router.post('/cards/:id/labels/:labelId', cc.toggleLabel);
router.post('/cards/:id/members/:userId', cc.toggleMember);
router.post('/cards/:id/checklist', cc.addChecklistItem);
router.put('/cards/:id/checklist/:itemId', cc.updateChecklistItem);
router.delete('/cards/:id/checklist/:itemId', cc.deleteChecklistItem);

// Users & Labels
router.get('/users', uc.getUsers);
router.get('/boards/:boardId/labels', uc.getBoardLabels);
router.post('/boards/:boardId/labels', uc.createLabel);

module.exports = router;
