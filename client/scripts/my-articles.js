document.addEventListener('DOMContentLoaded', async () => {
    // Auth check
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/pages/login.html';
        return;
    }

    // State management
    let currentPage = 1;
    const limit = 10;
    let currentFilter = '';
    let searchQuery = '';

    // Fetch articles function
    const fetchArticles = async (page = 1) => {
        try {
            const queryParams = new URLSearchParams({
                page,
                limit,
                ...(currentFilter && { status: currentFilter }),
                ...(searchQuery && { search: searchQuery })
            });
    
            const response = await fetch(`http://localhost:5000/api/article/my-articles?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
    
            if (!response.ok) throw new Error('Failed to fetch articles');
    
            const data = await response.json();
            renderArticles(data.articles);
            renderPagination(data.totalPages, data.currentPage);
        } catch (error) {
            console.error('Error fetching articles:', error);
            showError('Không thể tải bài viết. Vui lòng thử lại sau.');
        }
    };

    // Render articles function
    const renderArticles = (articles) => {
        const tbody = document.getElementById('articlesTableBody');
        if (!articles?.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="px-6 py-4 text-center text-gray-500">
                        Không có bài viết nào
                    </td>
                </tr>`;
            return;
        }

        tbody.innerHTML = articles.map(article => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4">
                    <div class="text-sm font-medium text-gray-900">${article.title}</div>
                </td>
                <td class="px-6 py-4">
                    <span class="px-2 py-1 text-xs font-medium ${
                        article.status === 'published' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                    } rounded-full">
                        ${article.status === 'published' ? 'Đã xuất bản' : 'Bản nháp'}
                    </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-500">
                    ${new Date(article.createdAt).toLocaleDateString('vi-VN')}
                </td>
                <td class="px-6 py-4 text-sm text-gray-500">
                    ${article.viewCount || 0}
                </td>
                <td class="px-6 py-4 text-right text-sm font-medium">
                    <button onclick="editArticle('${article._id}')" 
                        class="text-blue-600 hover:text-blue-900 mr-3">
                        Sửa
                    </button>
                    <button onclick="deleteArticle('${article._id}')" 
                        class="text-red-600 hover:text-red-900">
                        Xóa
                    </button>
                </td>
            </tr>
        `).join('');
    };

    // Render pagination controls
    const renderPagination = (totalPages, currentPage) => {
        const pagination = document.getElementById('pagination');
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        pagination.innerHTML = `
            <div class="flex justify-between items-center">
                <button 
                    onclick="changePage(${currentPage - 1})"
                    class="px-3 py-1 text-blue-500 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}"
                    ${currentPage === 1 ? 'disabled' : ''}>
                    Trước
                </button>
                <div class="flex space-x-2">
                    ${Array.from({length: totalPages}, (_, i) => i + 1)
                        .map(page => `
                            <button 
                                onclick="changePage(${page})"
                                class="px-3 py-1 ${currentPage === page 
                                    ? 'bg-blue-500 text-white' 
                                    : 'text-blue-500'} rounded">
                                ${page}
                            </button>
                        `).join('')}
                </div>
                <button 
                    onclick="changePage(${currentPage + 1})"
                    class="px-3 py-1 text-blue-500 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}"
                    ${currentPage === totalPages ? 'disabled' : ''}>
                    Sau
                </button>
            </div>
        `;
    };

    // Error display helper
    const showError = (message) => {
        document.getElementById('articlesTableBody').innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-4 text-center text-red-600">
                    ${message}
                </td>
            </tr>`;
    };

    // Article actions
    window.editArticle = (id) => {
        window.location.href = `/pages/edit-article.html?id=${id}`;
    };

    window.deleteArticle = async (id) => {
        if (!confirm('Bạn có chắc muốn xóa bài viết này?')) return;

        try {
            const response = await fetch(`http://localhost:5000/api/article/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to delete article');
            await fetchArticles(currentPage);
        } catch (error) {
            console.error('Delete error:', error);
            alert('Không thể xóa bài viết');
        }
    };

    window.changePage = (page) => {
        if (page < 1) return;
        currentPage = page;
        fetchArticles(page);
    };

    // Update event listeners
    document.getElementById('statusFilter').addEventListener('change', (e) => {
        currentFilter = e.target.value;
        currentPage = 1;
        fetchArticles(1);
    });

    document.getElementById('searchInput').addEventListener('input', 
        debounce((e) => {
            searchQuery = e.target.value.trim();
            currentPage = 1;
            fetchArticles(1);
        }, 300)
    );

    // Debounce helper
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Initial fetch
    await fetchArticles();
});