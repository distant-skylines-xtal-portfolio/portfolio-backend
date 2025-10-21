import axios from 'axios';
import NodeCache from 'node-cache';

const gameCache = new NodeCache({stdTTL: 866400 });

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

    async searchGames(filters: any): Promise<any> {
        const cachekey = JSON.stringify(filters);
        const cachedData = gameCache.get(cachekey);

        if (cachedData) {
            return cachedData;
        }

        const token = await this.getAccessToken();

        //Create Query for IGDB
        const query = this.buildQuery(filters);

        const response = await axios.post('https://api.igdb.com/v4/games', query, {
            headers: {
                'Client-ID': process.env.IGDB_CLIENT_ID,
                'Authorization': `Bearer ${token}`,
            }
        });

        gameCache.set(cachekey, response.data);
        return response.data;

    }

    private buildQuery(filters: any): string {
        let query = 'fields name,cover,genres,summary,rating,first_release_date,platforms,language_supports;';

        query +=  ' where ';

        if (filters.platforms) {
            query += `platforms = (${filters.platforms.join(',')})`;
        }

        if (filters.genres) {
            query += ` & genres = (${filters.genres.join(',')})`
        }

        if (filters.rating) {
            if (filters.rating > 0 && filters.rating < 100) {
                query += ` & rating > ${filters.rating + 1};`;
            }
        }
        

        query += 'limit 50';
        console.log(`built query: ${query}`);
        return query;
    }
}