import { Router } from 'express';
import { registerUser, logIn } from './methods';
import { authenticateToken } from '../utils/hash';

const router = Router();

router.post('/register', registerUser);
router.post('/login', logIn);
router.post('/', authenticateToken, (req, res) => {
  res.send('You are authenticated!');
});

export default router;
