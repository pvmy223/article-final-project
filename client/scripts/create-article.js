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

    let categoryData = [];
    
    const loadCategories = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/categories/getallwithsubs', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
    
            if (!response.ok) {
                if (response.status === 401) {
                    alert("Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.");
                    window.location.href = "/pages/login.html";
                    return;
                }
                throw new Error('Failed to load categories');
            }
    
            const data = await response.json();
            if (!Array.isArray(data)) {
                console.error('Invalid category data:', data);
                throw new Error('Invalid category data format');
            }
            
            categoryData = data;
            const mainSelect = document.getElementById('category');
            mainSelect.innerHTML = '<option value="">Chọn danh mục</option>';
            
            categoryData
                .filter(category => !category.parent)
                .forEach(category => {
                    const option = new Option(category.name, category._id);
                    mainSelect.add(option);
                });
    
            mainSelect.addEventListener('change', handleCategoryChange);
        } catch (error) {
            console.error('Error loading categories:', error);
            alert('Không thể tải danh sách chuyên mục');
        }
    };

    const handleCategoryChange = (event) => {
        const selectedId = event.target.value;
        const categoryContainer = document.getElementById('category').parentElement;
        
        // Remove existing subcategory select if exists
        const existingSubSelect = document.getElementById('subcategory');
        if (existingSubSelect) {
            existingSubSelect.parentElement.remove();
        }
    
        if (selectedId) {
            // Find selected category and its children
            const selectedCategory = categoryData.find(cat => cat._id === selectedId);
            
            if (selectedCategory?.children?.length > 0) {
                // Create subcategory select
                const subCategoryDiv = document.createElement('div');
                subCategoryDiv.className = 'mt-4';
                
                const label = document.createElement('label');
                label.className = 'block text-sm font-medium text-gray-700';
                label.textContent = 'Danh mục con';
                
                const select = document.createElement('select');
                select.id = 'subcategory';
                select.className = 'mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500';
                
                select.innerHTML = '<option value="">Chọn danh mục con</option>';
                selectedCategory.children.forEach(subCat => {
                    const option = new Option(subCat.name, subCat._id);
                    select.add(option);
                });
    
                subCategoryDiv.appendChild(label);
                subCategoryDiv.appendChild(select);
                categoryContainer.insertAdjacentElement('afterend', subCategoryDiv);
                
                // Update form data when subcategory changes
                select.addEventListener('change', (e) => {
                    // Keep parent category selected, just store subcategory value
                    if (e.target.value) {
                        select.dataset.selectedValue = e.target.value;
                    } else {
                        delete select.dataset.selectedValue;
                    }
                });
            }
        }
    };

    const loadTags = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/tags/gettags', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
    
            if (!response.ok) {
                throw new Error('Failed to load tags');
            }
    
            const tags = await response.json();
            
            if (!Array.isArray(tags)) {
                console.error('Tags data is not an array:', tags);
                return;
            }
    
            // Transform tags data for Select2
            const tagData = tags.map(tag => ({
                id: tag._id,
                text: tag.name
            }));
    
            // Initialize Select2
            jQuery('#tags').select2({
                placeholder: 'Chọn tags',
                allowClear: true,
                multiple: true,
                width: '100%',
                data: tagData
            });
    
        } catch (error) {
            console.error('Error loading tags:', error);
            alert('Không thể tải danh sách tags');
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

            const subCategorySelect = document.getElementById('subcategory');
            const categoryId = subCategorySelect?.dataset.selectedValue || document.getElementById('category').value;
    

            const formData = {
                title: document.getElementById('title').value,
                abstract: document.getElementById('abstract').value,
                content: tinymce.get('content').getContent(),
                category: categoryId,
                tags: jQuery('#tags').val(),
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