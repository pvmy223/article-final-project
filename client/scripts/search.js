document.addEventListener('DOMContentLoaded', async () => {
    // Update container selection - target the correct results container in the main content
    const resultsContainer = document.querySelector('.article-list') || document.querySelector('#searchResults.space-y-6');
    const searchDropdown = document.querySelector('#searchResults.absolute');
    
    if (!resultsContainer) {
        console.error('Results container not found');
        return;
    }

    const categoryFilter = document.getElementById('categoryFilter');
    const loadingTemplate = `
        <div class="animate-pulse space-y-4">
            <div class="h-4 bg-gray-200 rounded w-3/4"></div>
            <div class="h-4 bg-gray-200 rounded"></div>
            <div class="h-4 bg-gray-200 rounded"></div>
        </div>
    `;

    async function performSearch() {
        try {
            resultsContainer.innerHTML = loadingTemplate;
            
            const urlParams = new URLSearchParams(window.location.search);
            const query = urlParams.get('query');
            const page = parseInt(urlParams.get('page')) || 1;
            const category = categoryFilter?.value || '';
            
            const searchQuery = document.getElementById('searchQuery');
            if (searchQuery) {
                searchQuery.textContent = query || 'tất cả';
            }
            
            const result = await SearchService.searchArticles(query, page, category);

            const resultCount = document.getElementById('resultCount');
            if (resultCount) {
                resultCount.textContent = result.total || 0;
            }

            if (result.error) {
                resultsContainer.innerHTML = `
                    <div class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                        ${result.message || 'Có lỗi xảy ra khi tìm kiếm'}
                    </div>`;
                return;
            }

            if (!result.articles?.length) {
                resultsContainer.innerHTML = `
                    <div class="bg-gray-50 border border-gray-200 text-gray-600 px-4 py-3 rounded">
                        Không tìm thấy kết quả phù hợp
                    </div>`;
                return;
            }

                        // Add image URL formatter function
            function formatImageUrl(imageUrl) {
                if (!imageUrl) {
                    return 'https://via.placeholder.com/400x300';
                }
                
                // If already a full URL, return as is
                if (imageUrl.startsWith('http')) {
                    return imageUrl;
                }
                
                // If relative path, append server URL
                return `http://localhost:5000${imageUrl}`;
            }
            
            // Update article rendering
            const renderedHTML = result.articles.map(article => `
                <article class="bg-white rounded-lg shadow-md overflow-hidden flex flex-col md:flex-row">
                    <div class="w-full md:w-48 h-48 flex-shrink-0">
                        <img 
                            src="${formatImageUrl(article.featuredImage)}" 
                            alt="${article.title}"
                            class="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                            onerror="this.onerror=null; this.src='/assets/images/default-article.jpg'"
                        >
                    </div>
                    <div class="p-4 flex-1">
                        <h3 class="text-xl font-semibold mb-2">
                            <a href="article.html?id=${article._id}" class="hover:text-blue-600">
                                ${article.title}
                            </a>
                        </h3>
                        <p class="text-gray-600 mb-4 line-clamp-2">${article.abstract || ''}</p>
                        <div class="flex items-center text-sm text-gray-500">
                            <span>${new Date(article.createdAt).toLocaleDateString('vi-VN')}</span>
                            <span class="mx-2">•</span>
                            <span>${article.category?.name || 'Chưa phân loại'}</span>
                        </div>
                    </div>
                </article>
            `).join('');

            resultsContainer.innerHTML = renderedHTML;
            
        } catch (error) {
            console.error('Search error:', error);
            resultsContainer.innerHTML = `
                <div class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                    Có lỗi xảy ra khi tìm kiếm. Vui lòng thử lại sau.
                </div>`;
        }
    }
    
    function renderCategoryOptions(categories, level = 0) {
        return categories.map(category => `
            <option value="${category._id}">
                ${'\u00A0\u00A0'.repeat(level)}${category.name}
            </option>
            ${category.children ? renderCategoryOptions(category.children, level + 1) : ''}
        `).join('');
    }
    
    // Initialize filters
    async function initializeFilters() {
        try {
            // Load categories
            const categories = await SearchService.getCategories();
            if (categoryFilter && categories.length) {
                console.log('Categories:', categories);
                categoryFilter.innerHTML = `
                    <option value="">Tất cả danh mục</option>
                    ${renderCategoryOptions(categories)}
                `;
            }

            // Load tags
            const tags = await SearchService.getTags();
            const tagsContainer = document.getElementById('tagsList');
            if (tagsContainer && tags.length) {
                tagsContainer.innerHTML = tags.map(tag => `
                    <label class="inline-flex items-center">
                        <input type="checkbox" name="tags" value="${tag._id}" 
                               class="form-checkbox text-blue-600">
                        <span class="ml-2">${tag.name}</span>
                    </label>
                `).join('');
            }
        } catch (error) {
            console.error('Error initializing filters:', error);
        }
    }

    // Initialize filters before search
    await initializeFilters();
    await performSearch();

    if (categoryFilter) {
        categoryFilter.addEventListener('change', performSearch);
    }
});