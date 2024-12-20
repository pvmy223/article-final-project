document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/pages/login.html';
        return;
    }

    let currentPage = 1;
    const limit = 10;
    let articles = [];

    // Add renderPagination function
    const renderPagination = (totalPages, currentPage) => {
        const pagination = document.getElementById('pagination');
        let html = '<div class="flex justify-center space-x-2">';
        
        // Previous button
        html += `<button class="px-3 py-1 ${currentPage === 1 ? 'bg-gray-100 text-gray-400' : 'bg-white hover:bg-gray-100'} border rounded" 
                         onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
                    Previous
                </button>`;

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            html += `<button class="px-3 py-1 ${i === currentPage ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-100'} border rounded"
                             onclick="changePage(${i})">
                        ${i}
                    </button>`;
        }

        // Next button
        html += `<button class="px-3 py-1 ${currentPage === totalPages ? 'bg-gray-100 text-gray-400' : 'bg-white hover:bg-gray-100'} border rounded"
                         onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
                    Next
                </button>`;
        html += '</div>';
        
        pagination.innerHTML = html;
    };

    // Add changePage function to window scope
    window.changePage = async (page) => {
        if (page < 1) return;
        currentPage = page;
        await fetchArticles(page);
    };

    // Make reviewArticle available globally
    window.reviewArticle = async (articleId) => {
        const article = articles.find(a => a._id === articleId);
        if (!article) return;

        const modal = document.getElementById('reviewModal');
        document.getElementById('modalTitle').textContent = article.title;
        document.getElementById('modalAuthor').textContent = `Tác giả: ${article.author.username}`;
        
        document.getElementById('approveArticle').onclick = () => handleApproval(articleId, true);
        document.getElementById('rejectArticle').onclick = () => handleApproval(articleId, false);
        document.getElementById('closeModal').onclick = () => modal.classList.add('hidden');

        modal.classList.remove('hidden');
    };

    const handleApproval = async (articleId, isApproved) => {
        try {
            const feedback = document.getElementById('feedback').value;
            const publishDate = isApproved ? new Date().toISOString() : null;
            const category = document.getElementById('modalCategory').value;
            const tags = Array.from(document.getElementById('modalTags').selectedOptions)
                .map(option => option.value);
    
            const response = await fetch(`http://localhost:5000/api/article/review/${articleId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    approved: isApproved,
                    feedback,
                    publishDate,
                    category,
                    tags
                })
            });
    
            if (!response.ok) throw new Error('Failed to update article');
    
            document.getElementById('reviewModal').classList.add('hidden');
            await fetchArticles(currentPage);
        } catch (error) {
            console.error('Error:', error);
            alert('Không thể cập nhật bài viết');
        }
    };

    const fetchArticles = async (page = 1) => {
        try {
            const response = await fetch(`http://localhost:5000/api/article/pending?page=${page}&limit=${limit}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to retrieve article');
            }

            const data = await response.json();
            articles = data.articles;
            renderArticles(articles);
            renderPagination(data.totalPages, data.currentPage);
        } catch (error) {
            console.error('Error fetching articles:', error);
            showError('Không thể tải bài viết');
        }
    };

    const renderArticles = (articles) => {
        const tbody = document.getElementById('articlesTableBody');
        if (!articles?.length) {
            tbody.innerHTML = `
                <tr><td colspan="5" class="px-6 py-4 text-center">Không có bài viết nào</td></tr>
            `;
            return;
        }

        tbody.innerHTML = articles.map(article => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4">${article.title}</td>
                <td class="px-6 py-4">${article.author.username}</td>
                <td class="px-6 py-4">${article.category.name}</td>
                <td class="px-6 py-4">${new Date(article.createdAt).toLocaleDateString('vi-VN')}</td>
                <td class="px-6 py-4 text-right">
                    <button onclick="reviewArticle('${article._id}')" 
                            class="text-blue-600 hover:text-blue-900">
                        Duyệt
                    </button>
                </td>
            </tr>
        `).join('');
    };

    const reviewArticle = async (articleId) => {
        const article = articles.find(a => a._id === articleId);
        if (!article) return;

        // Show modal and populate data
        const modal = document.getElementById('reviewModal');
        document.getElementById('modalTitle').textContent = article.title;
        document.getElementById('modalAuthor').textContent = `Tác giả: ${article.author.username}`;
        
        // Set up event listeners for modal actions
        document.getElementById('approveArticle').onclick = () => handleApproval(articleId, true);
        document.getElementById('rejectArticle').onclick = () => handleApproval(articleId, false);
        document.getElementById('closeModal').onclick = () => modal.classList.add('hidden');

        modal.classList.remove('hidden');
    };

    // Add loadCategories function
    const loadCategories = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/categories/getallwithsubs', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const categories = await response.json();
            const select = document.getElementById('modalCategory');
            select.innerHTML = '<option value="">Chọn chuyên mục</option>';
            categories.forEach(cat => {
                const option = new Option(cat.name, cat._id);
                select.add(option);
                if (cat.children?.length > 0) {
                    cat.children.forEach(child => {
                        const childOption = new Option(`-- ${child.name}`, child._id);
                        select.add(childOption);
                    });
                }
            });
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    };

    // Add loadTags function
    const loadTags = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/tags/gettags', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const tags = await response.json();
            const select = document.getElementById('modalTags');
            select.innerHTML = '';
            tags.forEach(tag => {
                const option = new Option(tag.name, tag._id);
                select.add(option);
            });
        } catch (error) {
            console.error('Error loading tags:', error);
        }
    };

    // Update reviewArticle function
    window.reviewArticle = async (articleId) => {
        const article = articles.find(a => a._id === articleId);
        if (!article) return;

        // Load categories and tags
        await Promise.all([loadCategories(), loadTags()]);

        const modal = document.getElementById('reviewModal');
        
        // Populate basic info
        document.getElementById('modalTitle').textContent = article.title;
        document.getElementById('modalAuthor').textContent = `Tác giả: ${article.author.username}`;
        
        // Set category
        const categorySelect = document.getElementById('modalCategory');
        categorySelect.value = article.category._id;

        // Set tags
        const tagSelect = document.getElementById('modalTags');
        article.tags?.forEach(tag => {
            Array.from(tagSelect.options).forEach(option => {
                if (option.value === tag._id) {
                    option.selected = true;
                }
            });
        });

        // Add article content preview
        const contentPreview = document.createElement('div');
        contentPreview.className = 'mt-4 border p-4 rounded max-h-96 overflow-y-auto';
        contentPreview.innerHTML = `
            <h3 class="font-bold mb-2">Nội dung bài viết:</h3>
            <p class="text-gray-600 mb-4">${article.abstract || ''}</p>
            <div class="prose">${article.content || ''}</div>
        `;
        
        // Find or create content container
        let previewContainer = document.getElementById('articlePreviewContent');
        if (!previewContainer) {
            previewContainer = document.createElement('div');
            previewContainer.id = 'articlePreviewContent';
            document.querySelector('#reviewModal .flex.flex-col').insertBefore(
                previewContainer,
                document.getElementById('modalTags').parentElement.parentElement
            );
        }
        previewContainer.innerHTML = '';
        previewContainer.appendChild(contentPreview);

        // Set default publish date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        document.getElementById('publishDate').value = tomorrow.toISOString().split('T')[0];

        // Set up modal actions
        document.getElementById('approveArticle').onclick = () => handleApproval(articleId, true);
        document.getElementById('rejectArticle').onclick = () => handleApproval(articleId, false);
        document.getElementById('closeModal').onclick = () => modal.classList.add('hidden');

        modal.classList.remove('hidden');
    };
    // Initialize
    await fetchArticles();
});