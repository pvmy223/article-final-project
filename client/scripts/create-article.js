document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/pages/login.html';
        return;
    }

    // Initialize TinyMCE
    tinymce.init({
        selector: '#content',
        height: 500,
        plugins: 'lists link image table code help wordcount',
        toolbar: 'undo redo | formatselect | bold italic | alignleft aligncenter alignright | bullist numlist | link image | code'
    });

    // Load categories and tags
    const loadCategories = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/categories/getcategories');
            const categories = await response.json();
            const select = document.getElementById('category');
            categories.forEach(category => {
                const option = new Option(category.name, category._id);
                select.add(option);
            });
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    };

    const loadTags = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/tags/gettags');
            const tags = await response.json();
            const select = document.getElementById('tags');
            tags.forEach(tag => {
                const option = new Option(tag.name, tag._id);
                select.add(option);
            });
        } catch (error) {
            console.error('Error loading tags:', error);
        }
    };

    // Handle form submission
    const uploadImage = async (file) => {
        try {
            const formData = new FormData();
            formData.append('image', file);
    
            console.log('Preparing upload for file:', file);
            console.log('File details:', {
                name: file.name,
                type: file.type,
                size: file.size
            });
    
            const response = await fetch('http://localhost:5000/api/upload/article-image', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
    
            console.log('Upload response:', {
                status: response.status,
                statusText: response.statusText
            });
    
            const data = await response.json();
            console.log('Response data:', data);
    
            if (!response.ok) {
                throw new Error(data.message || 'Upload failed');
            }
    
            return data;
        } catch (error) {
            console.error('Upload error details:', {
                message: error.message,
                stack: error.stack
            });
            throw error;
        }
    };
    document.getElementById('articleForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            let imagePath = null;
            const imageFile = document.getElementById('featuredImage').files[0];
            
            if (imageFile) {
                const uploadResult = await uploadImage(imageFile);
                imagePath = uploadResult.imagePath;
                console.log('Uploaded image path:', imagePath);
            }

            const formData = {
                title: document.getElementById('title').value,
                abstract: document.getElementById('abstract').value,
                content: tinymce.get('content').getContent(),
                category: document.getElementById('category').value,
                tags: Array.from(document.getElementById('tags').selectedOptions).map(option => option.value),
                isPremium: document.getElementById('isPremium').checked,
                status: document.getElementById('status').checked ? 'published' : 'draft',
                featuredImage: imagePath
            };

            const response = await fetch('http://localhost:5000/api/article/create', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error('Failed to create article');
            window.location.href = '/pages/my-articles.html';
        } catch (error) {
            console.error('Error:', error);
            alert('Không thể tạo bài viết. Vui lòng thử lại.');
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