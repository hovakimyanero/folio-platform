import express from 'express';
import { LikesService } from './likes.service.js';
import { authMiddleware } from '../../common/auth.middleware.js';

const router = express.Router();

// Add like
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { projectId, commentId } = req.body;
    const userId = req.user.id;

    if (!projectId && !commentId) {
      return res.status(400).json({ error: 'projectId or commentId required' });
    }

    const like = await LikesService.addLike({ userId, projectId, commentId });

    res.status(201).json({ data: like });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Remove like
router.delete('/', authMiddleware, async (req, res) => {
  try {
    const { projectId, commentId } = req.body;
    const userId = req.user.id;

    if (!projectId && !commentId) {
      return res.status(400).json({ error: 'projectId or commentId required' });
    }

    await LikesService.removeLike({ userId, projectId, commentId });

    res.json({ message: 'Like removed' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get project likes
router.get('/projects/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const likes = await LikesService.getProjectLikes(projectId);
    const count = likes.length;

    res.json({ data: likes, count });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get comment likes
router.get('/comments/:commentId', async (req, res) => {
  try {
    const { commentId } = req.params;
    const likes = await LikesService.getCommentLikes(commentId);
    const count = likes.length;

    res.json({ data: likes, count });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
