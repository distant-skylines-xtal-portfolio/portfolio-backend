import axios from 'axios';
import NodeCache from 'node-cache';

const gameCache = new NodeCache({
    stdTTL: 604800,
    checkperiod: 86400
});

const imageCache = new NodeCache({
    stdTTL: 604800,
    checkperiod: 86400
})

interface IGDBKeyword {
    id: number;
    name: string;
    slug: string;
}

interface genreFilter {
    type: 'genreTag';
    formattedType: 'Genre';
    id: number;
    name: string;
}

interface platformFilter {
    type: 'platformTag';
    formattedType: 'Platform';
    abbreviation: string;
    alternative_name: string;
    id: number;
    name: string;
    platform_type: number;    
}

interface keywordFilter {
    type: 'keywordTag';
    formattedType: 'Keyword';
    id: number;
    name: string;
}

interface recFilters {
    genres: genreFilter[];
    platforms: platformFilter[];
    keywords: keywordFilter[]; 
    offset: number;
}


export class IGDBService {
    private accessToken: string = '';
    private tokenExpiry: number = 0;

    async getAccessToken(): Promise<string> {
        if (this.accessToken && Date.now() < this.tokenExpiry) {
            return this.accessToken;
        }

        const response = await axios.post('https://id.twitch.tv/oauth2/token', {
            client_id: process.env.IGDB_CLIENT_ID,
            client_secret: process.env.IGDB_CLIENT_SECRET,
            grant_type: 'client_credentials'
        });

        this.accessToken = response.data.access_token;
        this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);

        return this.accessToken;
    }

    async searchGames(filters: recFilters): Promise<any> {
        const cachekey = JSON.stringify(filters);
        const cachedData = gameCache.get(cachekey);

        if (cachedData) {
            return cachedData;
        }

        const token = await this.getAccessToken();

        //Create Query for IGDB
        const query = this.buildQuery(filters);

        const countResponse = await axios.post('https://api.igdb.com/v4/games/count', query, {
            headers: {
                'Client-ID': process.env.IGDB_CLIENT_ID,
                'Authorization': `Bearer ${token}`,
            }
        });

        

        const response = await axios.post('https://api.igdb.com/v4/games', query, {
            headers: {
                'Client-ID': process.env.IGDB_CLIENT_ID,
                'Authorization': `Bearer ${token}`,
            }
        });

        const combinedResponse = {
            count: countResponse.data.count,
            games: response.data,
        }
        gameCache.set(cachekey, combinedResponse);
        return combinedResponse;

    }

    async searchGameByName(search:string): Promise<any> {
        const cacheKey = search;
        const cachedData = gameCache.get(cacheKey);

        if (cachedData) {
            return cachedData;
        }
        
        const token = await this.getAccessToken();
        let query = ` search "${search}";`;
        query += ` fields name,cover,genres,summary,rating,first_release_date,platforms,language_supports;`;
        query += ` limit 50;`
        const response = await fetch('https://api.igdb.com/v4/games', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Client-ID': process.env.IGDB_CLIENT_ID,
                    'Authorization': `Bearer ${token}`,
                },
                body: query
                
            })
        const searchResults = await response.json();

        gameCache.set(cacheKey, searchResults);
        return searchResults;
    }

    async fetchKeywords(offset: number, requestLimit: number):Promise<IGDBKeyword[]> {
        const token = await this.getAccessToken();

        const response = await axios.post(
            `https://api.igdb.com/v4/keywords`,
            `fields id, name, slug; limit ${requestLimit}; offset ${offset};`,
            {
                headers: {
                    'Client-ID': process.env.IGDB_CLIENT_ID,
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'text/plain' 
                }
                
            }
        );
        return response.data;
    }

    private buildQuery(filters: recFilters): string {
        let finalQuery = 'fields name,cover,genres,summary,rating,first_release_date,platforms,language_supports;';
        
        let queryParams: string[] = [];

        if (filters.platforms?.length > 0) {
            let platformsString = ''
            for (let platform of filters.platforms) {
                platformsString += platform.id + ',';
            }

            if (platformsString.endsWith(',')) {
                platformsString = platformsString.slice(0, -1);
            }

            if (filters.platforms.length === 1) {
                queryParams.push(`platforms = ${platformsString}`);
            } else {
                queryParams.push(`platforms = [${platformsString}]`);
            }
        }

        

        if (filters.genres?.length > 0) {
            let genresString = ''
            for (let genre of filters.genres) {
                genresString += genre.id + ',';
            }

            if (genresString.endsWith(',')) {
                genresString = genresString.slice(0, -1);
            }

            if (filters.genres.length === 1) {
                queryParams.push(`genres = ${genresString}`);
            } else {
                queryParams.push(`genres = [${genresString}]`);
            }
            
        }

        if (filters.keywords?.length > 0) {
            let keywordsString = '';
            for (let keyword of filters.keywords) {
                keywordsString += keyword.id + ',';
            }

            if (keywordsString.endsWith(',')) {
                keywordsString = keywordsString.slice(0, -1);
            }
            console.log(keywordsString);

            if (filters.keywords.length === 1) {
                queryParams.push(`keywords = ${keywordsString}`);
            } else {
                queryParams.push(`keywords = [${keywordsString}]`);
            }
        }

        // if (filters.rating) {
        //     if (filters.rating > 0 && filters.rating < 100) {
        //         query += ` & rating > ${filters.rating + 1}`;
        //     }
        // }

        for (let i = 0; i < queryParams.length; i++) {
            if (i === 0) {
                finalQuery += ' where ';
                finalQuery += queryParams[i];
                continue;
            }

            finalQuery += ' & ' + queryParams[i];
        }


        if (!finalQuery.endsWith(";")) {
            finalQuery += ';'
        }

        finalQuery += ' limit 50;';
        finalQuery += ` offset ${filters.offset};`;
        console.log(`built query: ${finalQuery}`);
        return finalQuery;
    }
}

export const igdbService = new IGDBService(); 
