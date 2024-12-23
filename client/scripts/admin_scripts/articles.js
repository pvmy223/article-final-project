document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/pages/login.html';
        return;
    }

    let articles = [];
    let currentArticleId = null;
    let currentPage = 1;
    let totalPages = 1;

        const loadArticles = async (page = 1, filters = {}) => {
        try {
            const queryParams = new URLSearchParams({
                page,
                ...filters
            });
    
            // Fix API endpoint path and authorization header
            const response = await fetch(`http://localhost:5000/api/article/all?${queryParams}`, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
    
            if (response.status === 403) {
                console.log('Token:', token); // Debug token
                const errorData = await response.json();
                console.log('Error response:', errorData); // Debug error
                throw new Error(errorData.message || 'Access denied');
            }
    
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to load articles');
            }
    
            const data = await response.json();
            articles = data.articles;
            currentPage = data.currentPage;
            totalPages = data.totalPages;
    
            renderArticles();
            updatePagination();
        } catch (error) {
            console.error('Error:', error);
            if (error.message === 'No token provided') {
                alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                window.location.href = '/pages/login.html';
            } else {
                alert('Không thể tải danh sách bài viết: ' + error.message);
            }
        }
    };
    
    const renderArticles = () => {
        const tbody = document.getElementById('articlesTableBody');
        tbody.innerHTML = articles.map(article => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4">
                    <a href="/pages/article.html?id=${article._id}" 
                       class="text-blue-600 hover:text-blue-900">
                        ${article.title}
                    </a>
                </td>
                <td class="px-6 py-4">${article.author?.username || 'N/A'}</td>
                <td class="px-6 py-4">${article.category?.name || 'N/A'}</td>
                <td class="px-6 py-4">
                    ${new Date(article.createdAt).toLocaleDateString('vi-VN')}
                </td>
                <td class="px-6 py-4">
                    <span class="px-2 py-1 rounded-full text-xs 
                        ${article.status === 'published' ? 
                          'bg-green-100 text-green-800' : 
                          'bg-yellow-100 text-yellow-800'}">
                        ${article.status === 'published' ? 'Đã xuất bản' : 'Chờ duyệt'}
                    </span>
                </td>
                <td class="px-6 py-4 text-center">
                    ${article.status === 'draft' ? `
                        <button onclick="openReviewModal('${article._id}')"
                                class="text-blue-600 hover:text-blue-900">
                            Duyệt
                        </button>
                    ` : ''}
                </td>
            </tr>
        `).join('');
    };

    const updatePagination = () => {
        const pageInfo = document.getElementById('pageInfo');
        const pageButtons = document.getElementById('pageButtons');

        pageInfo.textContent = `Trang ${currentPage} / ${totalPages}`;
        
        pageButtons.innerHTML = Array.from(
            { length: totalPages }, 
            (_, i) => i + 1
        ).map(page => `
            <button onclick="changePage(${page})"
                    class="px-3 py-1 ${page === currentPage ? 
                        'bg-blue-500 text-white' : 
                        'bg-white text-blue-500'} border rounded">
                ${page}
            </button>
        `).join('');
    };

    window.openReviewModal = (articleId) => {
        currentArticleId = articleId;
        document.getElementById('reviewModal').classList.remove('hidden');
    };

    window.closeReviewModal = () => {
        currentArticleId = null;
        document.getElementById('reviewModal').classList.add('hidden');
        document.getElementById('reviewFeedback').value = '';
    };

    window.approveArticle = async (approved) => {
        if (!currentArticleId) return;

        try {
            const response = await fetch(
                `http://localhost:5000/api/article/review/${currentArticleId}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        approved,
                        feedback: document.getElementById('reviewFeedback').value
                    })
                }
            );

            if (!response.ok) throw new Error('Failed to update article status');

            closeReviewModal();
            await loadArticles(currentPage);
            alert(approved ? 'Bài viết đã được duyệt' : 'Bài viết đã bị từ chối');
        } catch (error) {
            console.error('Error:', error);
            alert('Không thể cập nhật trạng thái bài viết');
        }
    };

    window.changePage = (page) => {
        loadArticles(page, {
            status: document.getElementById('statusFilter').value,
            category: document.getElementById('categoryFilter').value,
            search: document.getElementById('searchInput').value
        });
    };

    const loadCategories = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/categories/getallwithsubs', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!response.ok) throw new Error('Failed to load categories');
            
            const categories = await response.json();
            const select = document.getElementById('categoryFilter');
            
            // Recursive function to add options with proper indentation
            const addOption = (category, level = 0) => {
                const indent = '- '.repeat(level);
                const option = new Option(`${indent}${category.name}`, category._id);
                select.add(option);
                
                if (category.children && category.children.length > 0) {
                    category.children.forEach(child => addOption(child, level + 1));
                }
            };
            
            categories
                .filter(category => !category.parent)
                .forEach(category => addOption(category));

        } catch (error) {
            console.error('Error:', error);
            alert('Không thể tải danh sách chuyên mục');
        }
    };

    // Initialize
    await loadCategories();
    await loadArticles();

    // Add filter event listeners
    // Update filter event listeners
    ['statusFilter', 'categoryFilter'].forEach(id => {
        document.getElementById(id).addEventListener('change', () => {
            currentPage = 1; // Reset to first page when filter changes
            loadArticles(1, {
                status: document.getElementById('statusFilter').value,
                category: document.getElementById('categoryFilter').value,
                search: document.getElementById('searchInput').value
            });
        });
    });

    document.getElementById('searchInput').addEventListener('input', 
        debounce(() => changePage(1), 500)
    );
});

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