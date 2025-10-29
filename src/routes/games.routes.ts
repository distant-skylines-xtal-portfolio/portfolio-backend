import {Router} from 'express';
import { GamesController } from '../controllers/games.controller';

const router = Router();
const gamesController = new GamesController();

router.post('/api/games/recommend', gamesController.getRecommendations);
router.get('/api/games/genres', gamesController.getGenres);
router.get('/api/games/platforms', gamesController.getPlatforms);

router.post('/api/games/cover', gamesController.getCover);
router.post('/api/games/search', gamesController.searchByName);
export default router;