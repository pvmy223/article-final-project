document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/pages/login.html';
        return;
    }

    let tags = [];
    let editingId = null;

    const loadTags = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/tags/gettags', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!response.ok) throw new Error('Failed to load tags');
            
            tags = await response.json();
            renderTags();
        } catch (error) {
            console.error('Error:', error);
            alert('Không thể tải danh sách tags');
        }
    };

    const renderTags = () => {
        const tbody = document.getElementById('tagsTableBody');
        tbody.innerHTML = tags.map(tag => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">${tag.name}</td>
                <td class="px-6 py-4 whitespace-nowrap">${tag.articleCount || 0}</td>
                <td class="px-6 py-4 text-center">
                    <button onclick="viewArticles('${tag._id}')"
                            class="text-green-600 hover:text-green-900">
                        <svg class="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                    </button>
                </td>
                <td class="px-6 py-4 text-center">
                    <button onclick="editTag('${tag._id}')"
                            class="text-blue-600 hover:text-blue-900">
                        <svg class="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                </td>
                <td class="px-6 py-4 text-center">
                    <button onclick="deleteTag('${tag._id}')"
                            class="text-red-600 hover:text-red-900">
                        <svg class="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </td>
            </tr>
        `).join('');
    };

    window.openCreateModal = () => {
        editingId = null;
        document.getElementById('modalTitle').textContent = 'Thêm Tag mới';
        document.getElementById('tagForm').reset();
        document.getElementById('tagModal').classList.remove('hidden');
    };

    window.editTag = (id) => {
        const tag = tags.find(t => t._id === id);
        if (!tag) return;

        editingId = id;
        document.getElementById('modalTitle').textContent = 'Sửa Tag';
        document.getElementById('tagName').value = tag.name;
        document.getElementById('tagModal').classList.remove('hidden');
    };

    window.closeModal = () => {
        document.getElementById('tagModal').classList.add('hidden');
        document.getElementById('tagForm').reset();
    };

    document.getElementById('tagForm').onsubmit = async (e) => {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('tagName').value
        };

        try {
            const url = editingId 
                ? `http://localhost:5000/api/tags/${editingId}`
                : 'http://localhost:5000/api/tags/create';

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
                throw new Error(error.message || 'Failed to save tag');
            }

            closeModal();
            await loadTags();
        } catch (error) {
            console.error('Error:', error);
            alert(error.message || 'Không thể lưu tag');
        }
    };

    window.deleteTag = async (id) => {
        if (!confirm('Bạn có chắc chắn muốn xóa tag này?')) return;

        try {
            const response = await fetch(`http://localhost:5000/api/tags/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to delete tag');
            }

            await loadTags();
        } catch (error) {
            console.error('Error:', error);
            alert(error.message || 'Không thể xóa tag');
        }
    };

        // Add viewArticles function
        window.viewArticles = async (id, page = 1) => {
        const tag = tags.find(t => t._id === id);
        if (!tag) return;
    
        try {
            const response = await fetch(`http://localhost:5000/api/tags/${id}/articles?page=${page}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
    
            if (!response.ok) throw new Error('Failed to fetch articles');
            const data = await response.json();
    
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full';
            modal.id = 'articlesModal';
            
            modal.innerHTML = `
                <div class="relative top-20 mx-auto p-5 border w-4/5 shadow-lg rounded-md bg-white">
                    <h3 class="text-xl font-bold mb-4">Bài viết với tag: ${tag.name}</h3>
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tiêu đề
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tác giả
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tóm tắt
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Ngày đăng
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Trạng thái
                                    </th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                ${data.articles.map(article => `
                                    <tr>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <a href="/pages/article.html?id=${article._id}" class="text-blue-600 hover:text-blue-900">
                                                ${article.title}
                                            </a>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">${article.author.username}</td>
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
                    
                    <div class="flex justify-between items-center mt-4">
                        <p class="text-sm text-gray-700">
                            Hiển thị ${data.articles.length} / ${data.totalArticles} bài viết
                        </p>
                        <div class="flex space-x-2">
                            ${Array.from({length: data.totalPages}, (_, i) => i + 1).map(pageNum => `
                                <button onclick="viewArticles('${id}', ${pageNum})"
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
    
    // Add render function for tag articles
    const renderTagArticles = (data, tagName) => {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full';
        modal.id = 'articlesModal';
        
        modal.innerHTML = `
            <div class="relative top-20 mx-auto p-5 border w-4/5 shadow-lg rounded-md bg-white">
                <div class="mt-3">
                    <h3 class="text-lg font-medium leading-6 text-gray-900 mb-4">
                        Bài viết với tag: ${tagName}
                    </h3>
                    <div class="overflow-x-auto">
                        <table class="min-w-full">
                            <thead>
                                <tr class="bg-gray-50">
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tiêu đề</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tác giả</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày tạo</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.articles.map(article => `
                                    <tr class="hover:bg-gray-50">
                                        <td class="px-6 py-4">${article.title}</td>
                                        <td class="px-6 py-4">${article.author.username}</td>
                                        <td class="px-6 py-4">${new Date(article.createdAt).toLocaleDateString('vi-VN')}</td>
                                        <td class="px-6 py-4">${article.status}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    <div class="mt-4 flex justify-end">
                        <button onclick="closeArticlesModal()" 
                                class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                            Đóng
                        </button>
                    </div>
                </div>
            </div>
        `;
    
        document.body.appendChild(modal);
    };
    
    // Add close modal function
    window.closeArticlesModal = () => {
        const modal = document.getElementById('articlesModal');
        if (modal) {
            modal.remove();
        }
    };

    // Initialize
    await loadTags();
});