import {Request, Response} from 'express';
import { igdbService } from '../services/igdb.service';
import type { IGDBService } from '../services/igdb.service';
import { keywordService } from '../services/keywords.service';

export class GamesController {
    private igdbService: IGDBService;

    constructor() {
        this.igdbService = igdbService;
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
                count: games.count,
                games: games.games,
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

    getKeywords = async(req: Request, res: Response) => {
        try {
            const keywords = await keywordService.getAllKeywords();
            res.json({
                keywords,
                count: keywords.length
            });
        } catch(error) {
            console.error('Error fetching keywords:', error);
            res.status(500).json({error: 'Failed to fetch keywords'});
        }
    }

    getFullGameInfo = async(req: Request, res: Response) => {
        try {
            if (!req.params.gameid) {
                return res.status(400).json({
                    error: 'Please provide a gameid in the request params'
                });
            }
            const token = await this.igdbService.getAccessToken();

            const response = await fetch('https://api.igdb.com/v4/games', {
                method: 'POST',
                headers: {
                    'Client-ID': process.env.IGDB_CLIENT_ID!,
                    'Authorization': `Bearer ${token}`
                },
                body: `fields age_ratings,aggregated_rating,aggregated_rating_count,alternative_names,artworks,bundles,category,checksum,collection,collections,cover,created_at,dlcs,expanded_games,expansions,external_games,first_release_date,follows,forks,franchise,franchises,game_engines,game_localizations,game_modes,game_status,game_type,genres,hypes,involved_companies,keywords,language_supports,multiplayer_modes,name,parent_game,platforms,player_perspectives,ports,rating,rating_count,release_dates,remakes,remasters,screenshots,similar_games,slug,standalone_expansions,status,storyline,summary,tags,themes,total_rating,total_rating_count,updated_at,url,version_parent,version_title,websites;` + 
                    `where id = ${req.params.gameid};`
            });

            const responseJson = await response.json();

            res.json({
                success: true,
                game: responseJson
            })
        } catch(error) {
            console.error('Error getting full game info: ', error);
            res.status(500).json({error: 'Failed to get full game info'});
        }
    }

    getReleaseDates = async(req: Request, res: Response) => {
        try {
            if (!req.body.gameId) {
                return res.status(400).json({
                    error: 'Please provide a gameid in the request body'
                });
            }
            const token = await this.igdbService.getAccessToken();

            const response = await fetch('https://api.igdb.com/v4/release_dates', {
                method: 'POST',
                headers: {
                    'Client-ID': process.env.IGDB_CLIENT_ID!,
                    'Authorization': `Bearer ${token}`
                },
                body: `fields category,checksum,created_at,date,date_format,game,human,m,platform,region,release_region,status,updated_at,y;` + 
                    `where game = ${req.body.gameId};`
            });
            
            const responseJson = await response.json();
            res.json({
                success: true,
                releaseDates: responseJson
            })
        } catch(error) {
            console.error('Error getting release dates: ', error);
            res.status(500).json({error: 'Failed to get release dates'});
        }
    }

    getSimilarGames = async(req: Request, res: Response) => {
        try {
            if (!req.body || !req.body.gameIds || req.body.gameIds.length === 0) {
                return res.status(400).json({
                    error: 'Please provide a number array called gameIds in the request body!'
                });
            }

            const token = await this.igdbService.getAccessToken();
            let idFilter:string = req.body.gameIds.reduce((acc:string, current:number) => {
                return acc += `${current}, `;
            }, "");
            idFilter = idFilter.slice(0, idFilter.length - 2);
                    
            const response = await fetch('https://api.igdb.com/v4/games', {
                method: 'POST',
                headers: {
                    'Client-ID': process.env.IGDB_CLIENT_ID!,
                    'Authorization': `Bearer ${token}`
                },
                body: `fields id,name,cover;` + 
                    `where id = (${idFilter});`
            });
            
            const responseJson = await response.json();
            res.json({
                success: true,
                games: responseJson,
            })

        } catch(error) {
            console.error('Error getting similar games: ', error);
            res.status(500).json({error: 'Failed to get full game info'});
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