import {Router} from 'express';
import { GamesController } from '../controllers/games.controller';

const router = Router();
const gamesController = new GamesController();

router.post('/api/games/recommend', gamesController.getRecommendations);
router.get('/api/games/genres', gamesController.getGenres);
router.get('/api/games/platforms', gamesController.getPlatforms);
router.get('/api/games/keywords', gamesController.getKeywords);
router.get('/api/games/fullinfo/:gameid', gamesController.getFullGameInfo);

router.post('/api/games/cover', gamesController.getCover);
router.post('/api/games/search', gamesController.searchByName);
router.post('/api/games/releasedates', gamesController.getReleaseDates);
router.post('/api/games/similar', gamesController.getSimilarGames);
export default router;