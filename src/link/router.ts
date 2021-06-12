import { Router } from 'express';
import { authenticateToken } from '../utils/hash';
import {
  addLink,
  getLink,
  // getAllLinks,
  deleteLink,
  patchLink,
} from './methods';

const router = Router();

// router.get('/', authenticateToken, getAllLinks);
router.get('/:hash', authenticateToken, getLink);

router.put('/', authenticateToken, addLink);
router.delete('/:hash', authenticateToken, deleteLink);
router.patch('/:hash', authenticateToken, patchLink);

export default router;
