document.addEventListener('DOMContentLoaded', async () => {
    const categorySlug = window.location.pathname.split('/').pop().replace('.html', '');
    
    const articlesContainer = document.getElementById('articles-container');
    const categoryTitle = document.getElementById('category-title');
    const categoryDescription = document.getElementById('category-description');
    const paginationContainer = document.getElementById('pagination');
    const sortOrder = document.getElementById('sortOrder');
    let currentPage = 1;

    // Loading template
    const loadingTemplate = `
        <div class="animate-pulse space-y-8">
            ${Array(3).fill().map(() => `
                <div class="bg-white rounded-lg shadow-md overflow-hidden flex">
                    <div class="w-1/3 bg-gray-200 h-48"></div>
                    <div class="w-2/3 p-4 space-y-4">
                        <div class="h-6 bg-gray-200 rounded w-3/4"></div>
                        <div class="space-y-2">
                            <div class="h-4 bg-gray-200 rounded"></div>
                            <div class="h-4 bg-gray-200 rounded w-5/6"></div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    const formatImageUrl = (imageUrl) => {
        if (!imageUrl) return '/assets/images/default-article.jpg';
        return imageUrl.startsWith('http') ? imageUrl : `http://localhost:5000${imageUrl}`;
    };

    const createArticleCard = (article) => `
        <article class="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl">
            <a href="/pages/article.html?id=${article._id}" class="flex flex-col md:flex-row">
                <div class="w-full md:w-1/3 h-48">
                    <img src="${formatImageUrl(article.featuredImage)}" 
                         alt="${article.title}"
                         class="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                         onerror="this.onerror=null; this.src='/assets/images/default-article.jpg'">
                </div>
                <div class="w-full md:w-2/3 p-4 flex flex-col justify-between">
                    <div>
                        <h3 class="text-xl font-semibold text-gray-900 mb-3 line-clamp-2 hover:text-blue-600">
                            ${article.title}
                        </h3>
                        <p class="text-gray-600 text-sm mb-4 line-clamp-3">${article.abstract || ''}</p>
                    </div>
                    <div class="flex justify-between items-center text-sm text-gray-500">
                        <span>${new Date(article.createdAt).toLocaleDateString('vi-VN')}</span>
                        <span>${article.viewCount || 0} lượt xem</span>
                    </div>
                </div>
            </a>
        </article>
    `;

    const loadArticles = async (page = 1, sort = 'newest') => {
        try {
            articlesContainer.innerHTML = loadingTemplate;
            
            const response = await fetch(
                `http://localhost:5000/api/categories/public/${categorySlug}/articles?page=${page}&sort=${sort}`,
                {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            if (!response.ok) {
                throw new Error(await response.text());
            }
            
            const data = await response.json();
            
            // Update category info if elements exist
            if (categoryTitle && data.category?.name) {
                categoryTitle.textContent = data.category.name;
                document.title = `${data.category.name} - VietnamNet`;
            }
            
            if (categoryDescription && data.category?.description) {
                categoryDescription.textContent = data.category.description;
            }

            // Render articles
            if (data.articles?.length) {
                articlesContainer.innerHTML = data.articles.map(article => createArticleCard(article)).join('');
            } else {
                articlesContainer.innerHTML = '<div class="text-center py-8 text-gray-600">Chưa có bài viết nào trong danh mục này</div>';
            }

            // Update pagination if container exists
            if (paginationContainer && data.pagination) {
                updatePagination(data.pagination.page, data.pagination.totalPages);
            }
            
            currentPage = page;

        } catch (error) {
            console.error('Error:', error);
            articlesContainer.innerHTML = `
                <div class="bg-red-50 border border-red-200 text-red-600 p-4 rounded">
                    Có lỗi xảy ra khi tải bài viết. Vui lòng thử lại sau.
                </div>
            `;
        }
    };

    const updatePagination = (current, total) => {
        if (total <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        const createPageButton = (pageNum, text, isActive = false) => `
            <button 
                onclick="loadArticles(${pageNum}, '${sortOrder.value}')"
                class="px-3 py-1 mx-1 rounded ${
                    isActive 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                }"
            >
                ${text}
            </button>
        `;

        let paginationHTML = '';
        
        // Previous button
        if (current > 1) {
            paginationHTML += createPageButton(current - 1, '←');
        }

        // Page numbers
        for (let i = 1; i <= total; i++) {
            if (i === 1 || i === total || (i >= current - 2 && i <= current + 2)) {
                paginationHTML += createPageButton(i, i, i === current);
            } else if (i === current - 3 || i === current + 3) {
                paginationHTML += '<span class="px-2">...</span>';
            }
        }

        // Next button
        if (current < total) {
            paginationHTML += createPageButton(current + 1, '→');
        }

        paginationContainer.innerHTML = paginationHTML;
    };

    // Event listeners
    if (sortOrder) {
        sortOrder.addEventListener('change', () => loadArticles(1, sortOrder.value));
    }

    // Initial load
    await loadArticles(1, 'newest');
});