import {Request, Response} from 'express';
import { IGDBService } from '../services/igdb.service';

export class GamesController {
    private igdbService: IGDBService;

    constructor() {
        this.igdbService = new IGDBService();
    }

    getRecommendations = async (req: Request, res: Response) => {
        try {
            const filters = req.body;

            if (!filters || Object.keys(filters).length === 0) {
                return res.status(400).json({
                    error: 'Please provide at least one filter'
                });
            }

            console.log(filters);

            const games = await this.igdbService.searchGames(filters);

            return res.json({
                success: true,
                count: games.length,
                games: games,
            });
        } catch (error) {
            console.error('Error getting recommendations:', error);
            return res.status(500).json({
                error: 'Failed to get game recommendations'
            })
        }
    }

    getGenres = async (req: Request, res: Response) => {
        try {
            const token = await this.igdbService.getAccessToken();

            const response = await fetch('https://api.igdb.com/v4/genres', {
                method: 'POST',
                headers: {
                    'Client-ID': process.env.IGDB_CLIENT_ID!,
                    'Authorization': `Bearer ${token}`
                },
                body: 'fields id,name; limit 50; sort name desc;'
            });

            const genres = await response.json();

            return res.json({
                success: true,
                genres: genres
            });
        } catch (error) {
            console.error('Error getting genres:', error);
            return res.status(500).json({
                error: 'Failed to get genres'
            })
        }
    }

    getPlatforms = async(req: Request, res: Response) => {
        try {
            const token = await this.igdbService.getAccessToken();

            const response = await fetch('https://api.igdb.com/v4/platforms', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Client-ID': process.env.IGDB_CLIENT_ID,
                    'Authorization': `Bearer ${token}`,
                },
                body: `fields alternative_name,name,abbreviation,platform_type;
                        where platform_type = (1,6) & generation > 2;
                        limit 75;
                        sort name asc;`
            })

            const platforms = await response.json();

            return res.json({
                success: true,
                platforms: platforms,
            });


        } catch (error) {       
            console.error('Error getting platforms:', error);
            return res.status(500).json({
                error: 'Failed to get platforms'
            })
        }
    }

    searchByName = async(req: Request, res: Response) => {
        try {
            const searchBody = req.body;
            const searchResult = await this.igdbService.searchGameByName(searchBody.search);

            return res.json({
                success: true,
                result: searchResult,
            });

        } catch (error) {
            console.error(`Error searching game by name:`, error);
            return res.status(500).json({
                error: 'Failed to search game by name',
            })
        }
    }
}