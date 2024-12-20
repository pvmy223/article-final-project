document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/pages/login.html';
        return;
    }

    let categories = [];
    let editingId = null;

    const loadCategories = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/categories/getallwithsubs', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!response.ok) throw new Error('Failed to load categories');
            
            categories = await response.json();

            renderCategories();
            updateParentCategorySelect();
        } catch (error) {
            console.error('Error:', error);
            alert('Không thể tải danh sách chuyên mục');
        }
    };

    const renderCategories = () => {
        const tbody = document.getElementById('categoriesTableBody');
        
        
        const renderCategoryRow = (category, level = 0) => {
            const indent = '&nbsp;'.repeat(level * 4);
            let html = `
                <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap">
                        ${indent}${level > 0 ? '└─ ' : ''}${category.name}
                    </td>
                    <td class="px-6 py-4">${category.description || ''}</td>
                    <td class="px-6 py-4 text-center">
                        <button onclick="viewCategoryArticles('${category._id}')"
                                title="Xem bài viết"
                                class="text-green-600 hover:text-green-900">
                            <svg class="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        </button>
                    </td>
                    <td class="px-6 py-4 text-center">
                        <button onclick="editCategory('${category._id}')"
                                title="Sửa chuyên mục"
                                class="text-blue-600 hover:text-blue-900">
                            <svg class="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                    </td>
                    <td class="px-6 py-4 text-center">
                        <button onclick="deleteCategory('${category._id}')"
                                title="Xóa chuyên mục"
                                class="text-red-600 hover:text-red-900">
                            <svg class="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </td>
                </tr>
            `;
        
            if (category.children && category.children.length > 0) {
                category.children.forEach(child => {
                    html += renderCategoryRow(child, level + 1);
                });
            }
            return html;
        };

        tbody.innerHTML = categories
            .filter(category => !category.parent) // Get only root categories
            .map(category => renderCategoryRow(category))
            .join('');
    };

    const updateParentCategorySelect = (currentCategoryId = null) => {
        const select = document.getElementById('parentCategory');
        select.innerHTML = '<option value="">Không có</option>';
        
        const addOption = (category, level = 0) => {
            // Skip current category and its children to prevent circular reference
            if (category._id === currentCategoryId) return;
            
            const indent = '- '.repeat(level);
            const option = new Option(`${indent}${category.name}`, category._id);
            select.add(option);
            
            if (category.children && category.children.length > 0) {
                category.children.forEach(child => {
                    if (child._id !== currentCategoryId) {
                        addOption(child, level + 1);
                    }
                });
            }
        };
    
        categories
            .filter(category => !category.parent)
            .forEach(category => addOption(category));
    };
    

    window.openCreateModal = () => {
        editingId = null;
        document.getElementById('modalTitle').textContent = 'Thêm chuyên mục mới';
        document.getElementById('categoryForm').reset();
        document.getElementById('categoryModal').classList.remove('hidden');
    };

    const findCategoryById = (id, categoryList) => {
        for (const category of categoryList) {
            if (category._id === id) return category;
            if (category.children && category.children.length > 0) {
                const found = findCategoryById(id, category.children);
                if (found) return found;
            }
        }
        return null;
    };

    window.editCategory = (id) => {
        const category = findCategoryById(id, categories);
        if (!category) return;
    
        editingId = id;
        updateParentCategorySelect(id);

        document.getElementById('modalTitle').textContent = 'Sửa chuyên mục';
        document.getElementById('categoryName').value = category.name;
        document.getElementById('categoryDescription').value = category.description || '';
        
        // Update parent select options excluding current category
        
        // Set parent value after options are updated
        document.getElementById('parentCategory').value = category.parent?._id || '';
        
        document.getElementById('categoryModal').classList.remove('hidden');
    };

    window.closeModal = () => {
        document.getElementById('categoryModal').classList.add('hidden');
        document.getElementById('categoryForm').reset();
    };

    document.getElementById('categoryForm').onsubmit = async (e) => {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('categoryName').value,
            parent: document.getElementById('parentCategory').value || null,
            description: document.getElementById('categoryDescription').value
        };
    
        try {
            const url = editingId 
                ? `http://localhost:5000/api/categories/${editingId}`
                : 'http://localhost:5000/api/categories/create';
    
            const response = await fetch(url, {
                method: editingId ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
    
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to save category');
            }
    
            closeModal();
            await loadCategories();
        } catch (error) {
            console.error('Error:', error);
            alert(error.message || 'Không thể lưu chuyên mục');
        }
    };

    window.deleteCategory = async (id) => {
        const category = findCategoryById(id, categories);
        if (!category) return;
    
        try {
            const response = await fetch(`http://localhost:5000/api/categories/delete/${category._id}`, {
                method: 'DELETE',
                headers: { 
                    'Authorization': `Bearer ${token}`
                }
            });
    
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to delete category');
            }
    
            await loadCategories();
            alert('Xóa chuyên mục thành công');
        } catch (error) {
            console.error('Error:', error);
            alert(error.message || 'Không thể xóa chuyên mục');
        }
    };

    window.viewCategoryArticles = async (id, page = 1) => {
        const category = findCategoryById(id, categories);
        if (!category) return;
    
        try {
            const response = await fetch(`http://localhost:5000/api/categories/${category._id}/articles?page=${page}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
    
            if (!response.ok) throw new Error('Failed to fetch articles');
            const data = await response.json();
    
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full';
            modal.id = 'articlesModal';
            
            modal.innerHTML = `
                <div class="relative top-20 mx-auto p-5 border w-4/5 shadow-lg rounded-md bg-white">
                    <h3 class="text-xl font-bold mb-4">Bài viết thuộc chuyên mục: ${category.name}</h3>
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tiêu đề</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tác giả</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nội dung</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày đăng</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                ${data.articles.map(article => `
                                    <tr>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <a href="/pages/article.html?id=${article._id}" 
                                               class="text-blue-600 hover:text-blue-900">
                                                ${article.title}
                                            </a>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            ${article.author?.username || 'Không xác định'}
                                        </td>
                                        <td class="px-6 py-4">
                                            <div class="max-h-32 overflow-y-auto prose prose-sm">
                                                ${article.abstract ? article.abstract.substring(0, 200) + '...' : ''}
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            ${new Date(article.createdAt).toLocaleDateString('vi-VN')}
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                ${article.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                                                ${article.status === 'published' ? 'Đã xuất bản' : 'Chờ duyệt'}
                                            </span>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
    
                    <!-- Pagination -->
                    <div class="flex justify-between items-center mt-4">
                        <p class="text-sm text-gray-700">
                            Hiển thị ${data.articles.length} / ${data.totalArticles} bài viết
                        </p>
                        <div class="flex space-x-2">
                            ${Array.from({length: data.totalPages}, (_, i) => i + 1).map(pageNum => `
                                <button onclick="viewCategoryArticles('${id}', ${pageNum})"
                                        class="px-3 py-1 ${pageNum === data.currentPage ? 
                                            'bg-blue-500 text-white' : 
                                            'bg-white text-blue-500'} border rounded">
                                    ${pageNum}
                                </button>
                            `).join('')}
                        </div>
                    </div>
    
                    <div class="mt-4 text-right">
                        <button onclick="closeArticlesModal()" 
                                class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
                            Đóng
                        </button>
                    </div>
                </div>
            `;
    
            document.body.appendChild(modal);
        } catch (error) {
            console.error('Error:', error);
            alert('Không thể tải danh sách bài viết');
        }
    };
    
    window.closeArticlesModal = () => {
        const modal = document.getElementById('articlesModal');
        if (modal) modal.remove();
    };

    // Initialize page
    await loadCategories();
});