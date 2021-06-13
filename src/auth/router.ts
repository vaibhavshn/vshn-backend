import { Router } from 'express';
import { registerUser, logIn } from './methods';
import { authenticateToken } from '../utils/hash';

const router = Router();

// verify token
router.head('/token', authenticateToken, (req, res) => {
  res.status(200);
  res.send();
});

router.post('/register', registerUser);
router.post('/login', logIn);

export default router;
