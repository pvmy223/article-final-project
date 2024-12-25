document.addEventListener('DOMContentLoaded', async () => {
    const articlesContainer = document.getElementById('articles-container');
    const paginationContainer = document.getElementById('pagination');
    const sortOrder = document.getElementById('sortOrder');
    let currentPage = 1;

    const createArticleCard = (article) => `
        <div class="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1">
            <a href="/pages/article.html?id=${article._id}" class="flex">
                <div class="w-1/3">
                    <img src="${formatImageUrl(article.featuredImage)}" 
                         alt="${article.title}"
                         class="w-full h-full object-cover"
                         onerror="this.onerror=null; this.src='/assets/images/placeholder.jpg'">
                </div>
                <div class="w-2/3 p-4">
                    <h3 class="text-xl font-semibold text-gray-900 mb-3 line-clamp-2">${article.title}</h3>
                    <p class="text-gray-600 text-sm mb-4 line-clamp-3">${article.abstract || ''}</p>
                    <div class="flex justify-between items-center text-sm text-gray-500 mt-auto">
                        <span>${new Date(article.createdAt).toLocaleDateString('vi-VN')}</span>
                        <span>${article.viewCount || 0} lượt xem</span>
                    </div>
                </div>
            </a>
        </div>
    `;

    const formatImageUrl = (imageUrl) => {
        if (!imageUrl) return '../../server/uploads/articles/1734685765080-158529008.jpg';
        return imageUrl.startsWith('http') ? imageUrl : `http://localhost:5000${imageUrl}`;
    };

    const loadArticles = async (page = 1, sort = 'newest') => {
        try {
            const response = await fetch(`http://localhost:5000/api/categories/6761f738a97637f7189603b8/articles?page=${page}&sort=${sort}`);
            if (!response.ok) throw new Error('Failed to fetch articles');
            
            const data = await response.json();
            
            articlesContainer.innerHTML = '';
            data.articles.forEach(article => {
                articlesContainer.innerHTML += createArticleCard(article);
            });

            // Update pagination
            updatePagination(data.currentPage, data.totalPages);
        } catch (error) {
            console.error('Error:', error);
            articlesContainer.innerHTML = '<p class="text-red-500">Error loading articles</p>';
        }
    };

    const updatePagination = (current, total) => {
        paginationContainer.innerHTML = '';
        for (let i = 1; i <= total; i++) {
            const button = document.createElement('button');
            button.className = `px-3 py-1 mx-1 rounded ${i === current ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`;
            button.textContent = i;
            button.onclick = () => loadArticles(i, sortOrder.value);
            paginationContainer.appendChild(button);
        }
    };

    // Event listeners
    sortOrder.addEventListener('change', () => loadArticles(1, sortOrder.value));

    // Initial load
    loadArticles(1, 'newest');
});