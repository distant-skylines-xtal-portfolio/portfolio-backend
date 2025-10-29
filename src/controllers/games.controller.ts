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


    getCover = async(req: Request, res: Response) => {
        try {
            const token = await this.igdbService.getAccessToken();

            if (!req.body || !req.body.gameId) {
                return res.status(400).json({
                    error: 'Please provide game Id in request body'
                });
            }
            console.log(`cover request with game id: ${req.body.gameId}`);
            const coverInfoResponse = await fetch('https://api.igdb.com/v4/covers', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Client-ID': process.env.IGDB_CLIENT_ID!,
                    'Authorization': `Bearer ${token}`,
                },
                body: 
                    `fields alpha_channel,animated,checksum,game,game_localization,height,image_id,url,width;
                    where game=${req.body.gameId};`
            });
            
            const coverInfoJson: coverInfoType[] = await coverInfoResponse.json() as coverInfoType[];

            if (!coverInfoJson || coverInfoJson.length === 0) {
                return res.status(404).json({
                    error: `Could not get cover associated with game ID ${req.body.gameId}`,
                });
            }
            
            // Construct and return the image URL to the frontend
            const imageUrl = `https://images.igdb.com/igdb/image/upload/t_cover_big/${coverInfoJson[0].image_id}.jpg`;
            
            return res.json({
                success: true,
                imageUrl: imageUrl,
                coverInfo: {
                    width: coverInfoJson[0].width,
                    height: coverInfoJson[0].height,
                    animated: coverInfoJson[0].animated
                }
            });
            
        } catch(error) {
            console.error(`Error getting game cover:`, error);
            return res.status(500).json({
                error: 'Failed to get game cover',
            });
        }
    
    }
}

interface coverInfoType {
        id: number,
        alpha_channel: boolean,
        animated: boolean,
        game: number,
        height: number,
        image_id: string,
        url: string,
        width: number,
        checksum: string,
}