document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/pages/login.html';
        return;
    }

    // Get article ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('id');

    // Initialize TinyMCE with init callback
    await tinymce.init({
        selector: '#content',
        height: 500,
        plugins: 'lists link image table code help wordcount',
        toolbar: 'undo redo | formatselect | bold italic | alignleft aligncenter alignright | bullist numlist | link image | code',
        setup: function(editor) {
            editor.on('init', async () => {
                console.log('TinyMCE initialized');
                if (articleId) {
                    try {
                        const response = await fetch(`http://localhost:5000/api/article/${articleId}`, {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });
                        const article = await response.json();
                        
                        // Set form values
                        document.getElementById('title').value = article.title;
                        document.getElementById('abstract').value = article.abstract;
                        editor.setContent(article.content);
                        document.getElementById('category').value = article.category._id;
                        document.getElementById('isPremium').checked = article.isPremium;
                        document.getElementById('status').checked = article.status === 'published';

                        if (article.featuredImage) {
                            const imageUrl = `http://localhost:5000${article.featuredImage}`;
                            document.getElementById('imagePreview').src = imageUrl;
                            document.getElementById('imagePreview').classList.remove('hidden');
                        }
                    } catch (error) {
                        console.error('Error loading article:', error);
                    }
                }
            });
        }
    });
    // Load categories and tags
    const loadCategories = async () => {
        const response = await fetch('http://localhost:5000/api/categories/getcategories');
        const categories = await response.json();
        const select = document.getElementById('category');
        categories.forEach(category => {
            const option = new Option(category.name, category._id);
            select.add(option);
        });
    };

    const loadTags = async () => {
        const response = await fetch('http://localhost:5000/api/tags/gettags');
        const tags = await response.json();
        const select = document.getElementById('tags');
        tags.forEach(tag => {
            const option = new Option(tag.name, tag._id);
            select.add(option);
        });
    };

    // Handle form submission
    document.getElementById('articleForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = {
            title: document.getElementById('title').value,
            abstract: document.getElementById('abstract').value,
            content: tinymce.get('content').getContent(),
            category: document.getElementById('category').value,
            tags: Array.from(document.getElementById('tags').selectedOptions).map(option => option.value),
            isPremium: document.getElementById('isPremium').checked,
            status: document.getElementById('status').checked ? 'published' : 'draft'
        };

        try {
            const url = articleId 
                ? `http://localhost:5000/api/article/${articleId}`
                : 'http://localhost:5000/api/article/create';
            
            const response = await fetch(url, {
                method: articleId ? 'PUT' : 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error('Failed to save article');

            window.location.href = '/pages/my-articles.html';
        } catch (error) {
            console.error('Error saving article:', error);
            alert('Không thể lưu bài viết. Vui lòng thử lại.');
        }
    });

    // Handle image preview
    document.getElementById('featuredImage').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const preview = document.getElementById('imagePreview');
                preview.src = e.target.result;
                preview.classList.remove('hidden');
            }
            reader.readAsDataURL(file);
        }
    });

    // Load initial data
    await Promise.all([loadCategories(), loadTags()]);
});