class SearchService {
    static API_BASE_URL = 'http://localhost:5000';

    static async searchArticles(query, page = 1, category = '', tags = []) {
        try {
            // Fix: Update endpoint from /api/article/search to /api/articles/search
            const url = new URL(`${this.API_BASE_URL}/api/article/search`);
            url.searchParams.append('query', query || '');
            url.searchParams.append('page', page);
            url.searchParams.append('category', category || '');
            url.searchParams.append('tags', tags.join(','));
            url.searchParams.append('limit', '10'); // Add limit parameter

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(response.status === 404 ? 'Search endpoint not found' : 'Search request failed');
            }

            const data = await response.json();
            return {
                articles: data.articles || [],
                total: data.total || 0,
                totalPages: data.totalPages || 0,
                error: false
            };
        } catch (error) {
            console.error('Search error:', error);
            return {
                articles: [],
                total: 0,
                totalPages: 0,
                error: true,
                message: error.message
            };
        }
    }

    static async getCategories() {
    try {
        const response = await fetch(`${this.API_BASE_URL}/api/categories/public/withsubs`);
        if (!response.ok) throw new Error('Failed to fetch categories');
        
        const categories = await response.json();
        console.log('Received categories:', categories); // Debug log
        
        return categories.map(category => ({
            _id: category._id,
            name: category.name,
            description: category.description,
            parent: category.parent,
            children: category.children || []
        }));
    } catch (error) {
        console.error('Category fetch error:', error);
        return [];
    }
}

    static async getTags() {
        try {
            const response = await fetch(`${this.API_BASE_URL}/api/tags/gettags`, {
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch tags');
            }

            const data = await response.json();
            return data || [];
        } catch (error) {
            console.error('Tags fetch error:', error);
            return [];
        }
    }
}