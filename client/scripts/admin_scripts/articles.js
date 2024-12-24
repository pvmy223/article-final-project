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
                    ${article.title}
                </td>
                <td class="px-6 py-4">${article.author?.username || 'N/A'}</td>
                <td class="px-6 py-4">${article.category?.name || 'N/A'}</td>
                <td class="px-6 py-4">
                    ${new Date(article.createdAt).toLocaleDateString('vi-VN')}
                </td>
                <td class="px-6 py-4">
                    <span class="px-2 py-1 rounded-full text-xs 
                        ${article.status === 'published' ? 'bg-green-100 text-green-800' : 
                          article.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                          'bg-yellow-100 text-yellow-800'}">
                        ${article.status === 'published' ? 'Đã xuất bản' : 
                          article.status === 'rejected' ? 'Đã từ chối' : 
                          'Chờ duyệt'}
                    </span>
                    ${article.status === 'rejected' && article.rejectReason ? 
                        `<div class="text-xs text-red-600 mt-1">
                            Lý do: ${article.rejectReason}
                        </div>` : 
                        ''}
                </td>
                <td class="px-6 py-4 text-center">
                    <div class="flex justify-center space-x-2">
                        ${article.status === 'draft' ? `
                            <button onclick="rejectArticle('${article._id}')"
                                    class="text-red-600 hover:text-red-900 px-2 py-1 rounded">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                        d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                            <button onclick="approveArticle('${article._id}')"
                                    class="text-green-600 hover:text-green-900 px-2 py-1 rounded">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                        d="M5 13l4 4L19 7" />
                                </svg>
                            </button>
                        ` : ''}
                    </div>
                </td>
                <td class="px-6 py-4 text-center">
                    <button onclick="deleteArticle('${article._id}')"
                            class="text-red-600 hover:text-red-900 px-2 py-1 rounded">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </td>
                <td class="px-6 py-4 text-center">
                    <a href="/pages/article.html?id=${article._id}"
                       class="text-blue-600 hover:text-blue-900 px-2 py-1 rounded">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                d="M2 12s3-9 10-9 10 9 10 9-3 9-10 9-10-9-10-9z" />
                        </svg>
                    </a>
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

    window.deleteArticle = async (articleId) => {
        if (!confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
            return;
        }
    
        try {
            const response = await fetch(
                `http://localhost:5000/api/article/${articleId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
    
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to delete article');
            }
    
            await loadArticles(currentPage);
            alert('Bài viết đã được xóa thành công');
        } catch (error) {
            console.error('Error:', error);
            alert('Không thể xóa bài viết: ' + error.message);
        }
    };

    window.rejectArticle = async (articleId) => {
        const reason = prompt('Nhập lý do từ chối:');
        if (!reason?.trim()) {
            alert('Vui lòng nhập lý do từ chối');
            return;
        }
    
        try {
            const response = await fetch(
                `http://localhost:5000/api/article/review/${articleId}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        approved: false,
                        feedback: reason.trim()
                    })
                }
            );
    
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to reject article');
            }
    
            await loadArticles(currentPage);
            alert('Bài viết đã bị từ chối');
        } catch (error) {
            console.error('Error:', error);
            alert('Không thể từ chối bài viết: ' + error.message);
        }
    };
    
    window.approveArticle = async (articleId) => {
        try {
            const response = await fetch(
                `http://localhost:5000/api/article/review/${articleId}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        approved: true
                    })
                }
            );
    
            if (!response.ok) throw new Error('Failed to approve article');
    
            await loadArticles(currentPage);
            alert('Bài viết đã được duyệt');
        } catch (error) {
            console.error('Error:', error);
            alert('Không thể duyệt bài viết');
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