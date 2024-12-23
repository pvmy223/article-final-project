document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/pages/login.html';
        return;
    }

    let users = [];
    let categories = [];
    let editingId = null;

    const loadUsers = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/auth/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!response.ok) throw new Error('Failed to load users');
            
            users = await response.json();
            renderUsers(users);
        } catch (error) {
            console.error('Error:', error);
            alert('Không thể tải danh sách người dùng');
        }
    };

    const loadCategories = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/categories/getallwithsubs', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!response.ok) throw new Error('Failed to load categories');
            
            categories = await response.json();
            updateCategorySelect();
        } catch (error) {
            console.error('Error:', error);
            alert('Không thể tải danh sách chuyên mục');
        }
    };

    const renderUsers = (userList) => {
        const tbody = document.getElementById('usersTableBody');
        tbody.innerHTML = userList.map(user => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4">${user.username}</td>
                <td class="px-6 py-4">${user.email}</td>
                <td class="px-6 py-4">${user.role}</td>
                <td class="px-6 py-4">
                    ${user.role === 'subscriber' ? 
                        new Date(user.subscriberExpiryDate).toLocaleDateString('vi-VN') : 
                        'N/A'}
                </td>
                <td class="px-6 py-4 space-x-2">
                    <button onclick="editUser('${user._id}')"
                            class="text-blue-600 hover:text-blue-900">
                        Sửa
                    </button>
                    ${user.role === 'editor' ? `
                        <button onclick="assignCategories('${user._id}')"
                                class="text-green-600 hover:text-green-900">
                            Phân công
                        </button>
                    ` : ''}
                    ${user.role === 'subscriber' ? `
                        <button onclick="extendSubscription('${user._id}')"
                                class="text-purple-600 hover:text-purple-900">
                            Gia hạn
                        </button>
                    ` : ''}
                    <button onclick="deleteUser('${user._id}')"
                            class="text-red-600 hover:text-red-900">
                        Xóa
                    </button>
                </td>
            </tr>
        `).join('');
    };
    const updateCategorySelect = () => {
        const select = document.getElementById('managedCategories');
        select.innerHTML = '';
        
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
    };

    // Add role change handler to show/hide category section
    document.getElementById('role').addEventListener('change', (e) => {
        const categorySection = document.getElementById('categorySection');
        const subscriptionSection = document.getElementById('subscriptionSection');
        
        categorySection.classList.toggle('hidden', e.target.value !== 'editor');
        subscriptionSection.classList.toggle('hidden', e.target.value !== 'subscriber');
    });

    window.closeModal = () => {
        const modal = document.getElementById('userModal');
        const form = document.getElementById('userForm');
        
        // Reset form and hide all sections
        form.reset();
        modal.classList.add('hidden');
        
        // Show all form elements (they might be hidden from category assignment)
        document.getElementById('username').parentElement.classList.remove('hidden');
        document.getElementById('email').parentElement.classList.remove('hidden');
        document.getElementById('role').parentElement.classList.remove('hidden');
        
        // Reset editing state
        editingId = null;
    };
    document.getElementById('userForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            username: document.getElementById('username').value,
            email: document.getElementById('email').value,
            role: document.getElementById('role').value,
        };
    
        if (formData.role === 'editor') {
            formData.managedCategories = Array.from(
                document.getElementById('managedCategories').selectedOptions
            ).map(option => option.value);
        }
    
        if (formData.role === 'subscriber') {
            formData.expiryDate = document.getElementById('expiryDate').value;
        }
    
        try {
            const url = editingId 
                ? `http://localhost:5000/api/auth/users/update/${editingId}`
                : 'http://localhost:5000/api/auth/register';
    
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
                throw new Error(error.message || 'Failed to save user');
            }
    
            window.closeModal();
            await loadUsers();
            alert('Lưu thông tin người dùng thành công');
        } catch (error) {
            console.error('Error:', error);
            alert('Không thể lưu thông tin người dùng: ' + error.message);
        }
    });

    window.assignCategories = async (userId) => {
        const user = users.find(u => u._id === userId);
        if (!user) return;
    
        // Show category modal
        document.getElementById('userModal').classList.remove('hidden');
        document.getElementById('modalTitle').textContent = `Phân công chuyên mục cho ${user.username}`;
        
        // Show only category section
        document.getElementById('categorySection').classList.remove('hidden');
        document.getElementById('username').parentElement.classList.add('hidden');
        document.getElementById('email').parentElement.classList.add('hidden');
        document.getElementById('role').parentElement.classList.add('hidden');
        document.getElementById('subscriptionSection').classList.add('hidden');
    
        // Pre-select managed categories
        const select = document.getElementById('managedCategories');
        Array.from(select.options).forEach(option => {
            option.selected = user.managedCategories?.includes(option.value);
        });
    
        // Update form submit handler for category assignment
        const form = document.getElementById('userForm');
        const originalSubmit = form.onsubmit;
        
        form.onsubmit = async (e) => {
            e.preventDefault();
            try {
                const response = await fetch(`http://localhost:5000/api/auth/users/${userId}/assign-categories`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        categories: Array.from(select.selectedOptions).map(opt => opt.value)
                    })
                });
    
                if (!response.ok) throw new Error('Failed to assign categories');
    
                closeModal();
                await loadUsers();
                alert('Phân công chuyên mục thành công');
            } catch (error) {
                console.error('Error:', error);
                alert('Không thể phân công chuyên mục');
            }
            
            form.onsubmit = originalSubmit;
        };
    };
    // Initialize page
    await Promise.all([loadUsers(), loadCategories()]);
});