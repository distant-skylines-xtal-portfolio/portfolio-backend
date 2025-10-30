import { igdbService } from "./igdb.service";

interface Keyword {
    id: number;
    name: string;
    slug: string;
}

class KeywordService {
    private keywords: Keyword[] = [];
    private lastFetch: number = 0;

    // 7 days
    private CACHE_DURATION = 7 * 24 * 60 * 60 * 1000;
    private readonly IGDB_LIMIT = 500;
    private isFetching: boolean = false;

    async getAllKeywords(): Promise<Keyword[]> {
        if (this.keywords.length > 0 && Date.now() - this.lastFetch < this.CACHE_DURATION) {
            console.log(`Returning cached keywords: ${this.keywords.length} items`);
            return this.keywords;
        }

        if (this.isFetching) {
            console.log('Keyword fetch already in progress...');
            await this.waitForFetch();
            return this.keywords;
        }

        this.isFetching = true;

        try {
            const allKeywords: Keyword[] = [];
            let offset = 0;
            let hasMore = true;

            while (hasMore) {
                console.log(`Fetching keywords: offset=${offset}, limit=${this.IGDB_LIMIT}`);

                const batch = await igdbService.fetchKeywords(offset, this.IGDB_LIMIT);
                if (batch.length === 0) {
                    hasMore = false;
                    break;
                }
                console.log(batch[0]);
                allKeywords.push(...batch);

                if (batch.length < this.IGDB_LIMIT) {
                    hasMore = false;
                } else {
                    offset += this.IGDB_LIMIT;
                }

                await this.sleep(100);
            }

            this.keywords = allKeywords.sort((a, b) => a.name.localeCompare(b.name));
            this.lastFetch = Date.now();
            
            console.log(`Successfully cached ${this.keywords.length} keywords from IGDB`);
            return this.keywords;
        } catch (error) {
            console.error('Failed to fetch keywords', error);

            if (this.keywords.length > 0) {
                console.log('Returning stale cache due to error...');
                return this.keywords;
            }

            throw error;
        } finally {
            this.isFetching = false;
        }
    }

    async searchKeywords(query: string, limit: number = 20): Promise<Keyword[]> {
        const allKeywords = await this.getAllKeywords();
        const lowerQuery = query.toLowerCase();
        return allKeywords
        .filter(keyword => keyword.name.toLowerCase().includes(lowerQuery))
        .slice(0, limit);
    }

    async refreshCache(): Promise<void> {
        this.lastFetch = 0;
        await this.getAllKeywords();
    }

    private async waitForFetch(): Promise<void> {
        const maxWait = 30000;
        const startTime = Date.now();

        while (this.isFetching && Date.now() - startTime < maxWait) {
            await this.sleep(100);
        }
    }

    private sleep(ms: number):Promise<void> { 
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

export const keywordService = new KeywordService();