document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/pages/login.html';
        return;
    }

    let users = [];
    let categories = [];
    let editingId = null;
    let filteredUsers = [];

    // Function declarations first
    const loadUsers = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/users', {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to load users');
            }
            
            const data = await response.json();
            users = data;
            filteredUsers = data;
            renderUsers(filteredUsers);
        } catch (error) {
            console.error('Error loading users:', error);
            throw error;
        }
    };

    const filterUsers = (roleFilter = '') => {
        if (!roleFilter) {
            filteredUsers = users;
        } else {
            filteredUsers = users.filter(user => user.role === roleFilter);
        }
        renderUsers(filteredUsers);
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
        if (!tbody) return;
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
                <td class="px-6 py-4 text-center">
                    <button onclick="editUser('${user._id}')"
                            class="text-blue-600 hover:text-blue-900">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                        </svg>
                    </button>
                </td>
                <td class="px-6 py-4 text-center">
                    ${user.role === 'editor' ? `
                        <button onclick="assignCategories('${user._id}')"
                                class="text-green-600 hover:text-green-900">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                            </svg>
                        </button>
                    ` : ''}
                </td>
                <td class="px-6 py-4 text-center">
                    <button onclick="deleteUser('${user._id}')"
                            class="text-red-600 hover:text-red-900">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                    </button>
                </td>
            </tr>
        `).join('');
    };

    const updateCategorySelect = (currentUser = null) => {
        const select = document.getElementById('managedCategories');
        if (!select) return;
        select.innerHTML = '';
        
        const addOption = (category, level = 0) => {
            const indent = '- '.repeat(level);
            const option = new Option(`${indent}${category.name}`, category._id);
            
            // Check if category is managed by current user
            if (currentUser && currentUser.managedCategories) {
                option.selected = currentUser.managedCategories.some(
                    managedCat => managedCat._id === category._id
                );
                if (option.selected) {
                    option.style.backgroundColor = '#e5e7eb';
                    option.style.fontWeight = 'bold';
                }
            }
            
            select.add(option);
            
            if (category.children && category.children.length > 0) {
                category.children.forEach(child => addOption(child, level + 1));
            }
        };
    
        categories
            .filter(category => !category.parent)
            .forEach(category => addOption(category));
    };

    // Add role filter event listener
    const roleFilterElement = document.getElementById('roleFilter');
    if (roleFilterElement) {
        roleFilterElement.addEventListener('change', (e) => {
            const roleFilter = e.target.value;
            filterUsers(roleFilter);
        });
    }

    const roleElement = document.getElementById('role');
    if (roleElement) {
        roleElement.addEventListener('change', (e) => {
            const categorySection = document.getElementById('categorySection');
            const subscriptionSection = document.getElementById('subscriptionSection');
            
            if (categorySection && subscriptionSection) {
                categorySection.classList.toggle('hidden', e.target.value !== 'editor');
                subscriptionSection.classList.toggle('hidden', e.target.value !== 'subscriber');
            }
        });
    }

    // Load initial data
    try {
        await Promise.all([loadUsers(), loadCategories()]);
    } catch (error) {
        console.error('Error initializing page:', error);
        alert('Không thể khởi tạo trang: ' + error.message);
    }

    window.closeModal = () => {
        const modal = document.getElementById('userModal');
        const form = document.getElementById('userForm');
        
        if (form) {
            form.reset();
        }
        if (modal) {
            modal.classList.add('hidden');
        }
        
        const usernameParent = document.getElementById('username')?.parentElement;
        const emailParent = document.getElementById('email')?.parentElement;
        const roleParent = document.getElementById('role')?.parentElement;

        if (usernameParent) usernameParent.classList.remove('hidden');
        if (emailParent) emailParent.classList.remove('hidden');
        if (roleParent) roleParent.classList.remove('hidden');
        
        editingId = null;
    };

    window.editUser = async (userId) => {
        const user = users.find(u => u._id === userId);
        if (!user) return;
    
        editingId = userId;
    
        const modal = document.getElementById('userModal');
        const modalTitle = document.getElementById('modalTitle');
        const usernameInput = document.getElementById('username');
        const emailInput = document.getElementById('email');
        const roleSelect = document.getElementById('role');
        const categorySection = document.getElementById('categorySection');
        const subscriptionSection = document.getElementById('subscriptionSection');
        
        if (modal) modal.classList.remove('hidden');
        if (modalTitle) modalTitle.textContent = 'Sửa thông tin người dùng';
        if (usernameInput) usernameInput.value = user.username;
        if (emailInput) emailInput.value = user.email;
        if (roleSelect) roleSelect.value = user.role;
    
        function roleChangeHandler(e) {
            const newRole = e.target.value;
            const oldRole = user.role;
        
            // Only update UI, don't save to server
            if (newRole === 'subscriber') {
                const now = new Date();
                const minutesInWeek = 7 * 24 * 60;
                const millisecondsToAdd = minutesInWeek * 60 * 1000;
                const defaultExpiry = new Date(now.getTime() + millisecondsToAdd);
                
                const expiryDateInput = document.getElementById('expiryDate');
                if (expiryDateInput) {
                    expiryDateInput.value = defaultExpiry.toISOString().split('T')[0];
                }
            }
        
            // Toggle sections visibility
            if (categorySection) categorySection.classList.toggle('hidden', newRole !== 'editor');
            if (subscriptionSection) subscriptionSection.classList.toggle('hidden', newRole !== 'subscriber');
        }
    
        // Remove old handler if exists
        if (roleSelect && roleSelect.dataset.currentHandler) {
            roleSelect.removeEventListener('change', window[roleSelect.dataset.currentHandler]);
            delete window[roleSelect.dataset.currentHandler];
        }
    
        // Store handler with unique name
        const handlerName = `roleChangeHandler_${userId}`;
        window[handlerName] = roleChangeHandler;
        if (roleSelect) roleSelect.dataset.currentHandler = handlerName;
    
        // Add new handler
        if (roleSelect) roleSelect.addEventListener('change', roleChangeHandler);
    
        // Update close modal
        window.closeModal = () => {
            if (roleSelect && roleSelect.dataset.currentHandler) {
                const handlerName = roleSelect.dataset.currentHandler;
                roleSelect.removeEventListener('change', window[handlerName]);
                delete window[handlerName];
                delete roleSelect.dataset.currentHandler;
            }
    
            const modal = document.getElementById('userModal');
            const form = document.getElementById('userForm');
            
            if (form) form.reset();
            if (modal) modal.classList.add('hidden');
            
            const usernameParent = document.getElementById('username')?.parentElement;
            const emailParent = document.getElementById('email')?.parentElement;
            const roleParent = document.getElementById('role')?.parentElement;

            if (usernameParent) usernameParent.classList.remove('hidden');
            if (emailParent) emailParent.classList.remove('hidden');
            if (roleParent) roleParent.classList.remove('hidden');
            
            editingId = null;
        };
    
        // Show/hide sections based on current role
        if (categorySection) categorySection.classList.toggle('hidden', user.role !== 'editor');
        if (subscriptionSection) subscriptionSection.classList.toggle('hidden', user.role !== 'subscriber');
    };

    // Update form submit handler
    document.getElementById('userForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Skip if this is a category assignment form
        const categorySection = document.getElementById('categorySection');
        const usernameParent = document.getElementById('username')?.parentElement;
        if (categorySection && !categorySection.classList.contains('hidden') && 
            usernameParent && usernameParent.classList.contains('hidden')) {
            return;
        }
        
        try {
            const roleSelect = document.getElementById('role');
            if (!roleSelect) {
                console.error('Role select element not found');
                throw new Error('Không tìm thấy trường chọn vai trò. Vui lòng tải lại trang.');
            }

            const role = roleSelect.value?.trim();
            const validRoles = ["guest", "subscriber", "writer", "editor", "administrator"];
            
            if (!role) {
                throw new Error('Vui lòng chọn vai trò người dùng');
            }

            if (!validRoles.includes(role)) {
                console.error(`Invalid role selected: ${role}`);
                throw new Error(`Vai trò không hợp lệ: ${role}`);
            }

            const url = editingId 
                ? `http://localhost:5000/api/users/${editingId}/role`
                : 'http://localhost:5000/api/users';
            
            const formData = {
                username: document.getElementById('username')?.value?.trim(),
                email: document.getElementById('email')?.value?.trim(),
                role: role
            };

            // Add role-specific data
            if (role === 'editor') {
                const managedCategoriesSelect = document.getElementById('managedCategories');
                formData.managedCategories = Array.from(managedCategoriesSelect?.selectedOptions || [])
                    .map(option => option.value);
            }

            if (role === 'subscriber') {
                const expiryDate = document.getElementById('expiryDate')?.value;
                if (expiryDate) {
                    formData.subscriberExpiryDate = expiryDate;
                }
            }

            const response = await fetch(url, {
                method: editingId ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Operation failed');
            }

            window.closeModal();
            await loadUsers();
            alert('Cập nhật thành công');
        } catch (error) {
            console.error('Form submission error:', error);
            alert('Không thể cập nhật: ' + error.message);
        }
    });

    window.assignCategories = async (userId) => {
        const user = users.find(u => u._id === userId);
        if (!user) return;
    
        editingId = userId;
    
        const modal = document.getElementById('userModal');
        const modalTitle = document.getElementById('modalTitle');
        const categorySection = document.getElementById('categorySection');
        const usernameParent = document.getElementById('username')?.parentElement;
        const emailParent = document.getElementById('email')?.parentElement;
        const roleParent = document.getElementById('role')?.parentElement;
        const subscriptionSection = document.getElementById('subscriptionSection');
        
        if (modal) modal.classList.remove('hidden');
        if (modalTitle) modalTitle.textContent = `Phân công chuyên mục cho ${user.username}`;
        if (categorySection) categorySection.classList.remove('hidden');
        if (usernameParent) usernameParent.classList.add('hidden');
        if (emailParent) emailParent.classList.add('hidden');
        if (roleParent) roleParent.classList.add('hidden');
        if (subscriptionSection) subscriptionSection.classList.add('hidden');
    
        // Pre-select managed categories and update select
        updateCategorySelect(user);
    
        // Handle form submission
        const form = document.getElementById('userForm');
        
        // Remove existing handlers
        form.onsubmit = null;
        const oldHandlers = form.getAttribute('data-handlers') || '';
        oldHandlers.split(',').forEach(handler => {
            if (handler) form.removeEventListener('submit', window[handler]);
        });
    
        // Create new handler
        async function submitHandler(e) {
            e.preventDefault();
            
            try {
                const select = document.getElementById('managedCategories');
                const response = await fetch(`http://localhost:5000/api/users/${editingId}/assign-categories`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        categories: Array.from(select?.selectedOptions || []).map(opt => opt.value)
                    })
                });
    
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message);
                }
    
                await loadUsers();
                window.closeModal();
                alert('Phân công chuyên mục thành công');
    
                // Cleanup
                form.removeEventListener('submit', submitHandler);
                form.setAttribute('data-handlers', '');
    
            } catch (error) {
                console.error('Error:', error);
                alert('Không thể phân công chuyên mục: ' + error.message);
            }
        }
    
        // Add new handler
        form.addEventListener('submit', submitHandler);
        form.setAttribute('data-handlers', submitHandler.name);
    };

    // Initialize page
    await Promise.all([loadUsers(), loadCategories()]);
    if (roleFilterElement) roleFilterElement.value = ''; // Reset filter on load
});