document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/pages/login.html';
        return;
    }

    let editors = [];
    let categories = [];
    let editingId = null;

    const loadEditors = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/users/editors', {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to load editors');
            }
            
            editors = await response.json();
            renderEditors();
        } catch (error) {
            console.error('Error:', error);
            alert('Không thể tải danh sách biên tập viên');
        }
    };

    const loadCategories = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/categories/getallwithsubs', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!response.ok) {
                throw new Error('Failed to load categories');
            }
            
            categories = await response.json();
        } catch (error) {
            console.error('Error:', error);
            alert('Không thể tải danh sách chuyên mục');
        }
    };

    const renderEditors = () => {
        const tbody = document.getElementById('editorsTableBody');
        tbody.innerHTML = editors.map(editor => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4">${editor.username}</td>
                <td class="px-6 py-4">${editor.email}</td>
                <td class="px-6 py-4">
                    ${editor.managedCategories?.map(cat => cat.name).join(', ') || 'Chưa được phân công'}
                </td>
                <td class="px-6 py-4 text-center">
                    <button onclick="assignCategories('${editor._id}')"
                            class="text-blue-600 hover:text-blue-900">
                        <svg class="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5"/>
                        </svg>
                        Phân công
                    </button>
                </td>
            </tr>
        `).join('');
    };

    window.assignCategories = async (editorId) => {
        const editor = editors.find(e => e._id === editorId);
        if (!editor) {
            alert('Không tìm thấy biên tập viên');
            return;
        }
    
        editingId = editorId;
        
        const modal = document.getElementById('assignmentModal');
        const select = document.getElementById('categories');
        const modalTitle = document.getElementById('modalTitle');
        
        if (!modal || !select || !modalTitle) {
            console.error('Required DOM elements not found');
            alert('Lỗi: Không thể mở modal phân công');
            return;
        }
    
        // Show modal
        modal.classList.remove('hidden');
        modalTitle.textContent = `Phân công chuyên mục cho ${editor.username}`;
    
        // Build nested category options
        const buildOptions = (category, level = 0) => {
            const indent = '- '.repeat(level);
            const option = new Option(`${indent}${category.name}`, category._id);
            option.selected = editor.managedCategories?.some(m => m._id === category._id);
            
            if (option.selected) {
                option.style.backgroundColor = '#e5e7eb';
                option.style.fontWeight = 'bold';
            }
            
            select.add(option);
    
            if (category.children?.length > 0) {
                category.children.forEach(child => buildOptions(child, level + 1));
            }
        };
    
        // Clear and rebuild select options
        select.innerHTML = '';
        categories
            .filter(cat => !cat.parent)
            .forEach(cat => buildOptions(cat));
    };

    window.closeModal = () => {
        document.getElementById('assignmentModal').classList.add('hidden');
        editingId = null;
    };

    document.getElementById('assignmentForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            const response = await fetch(`http://localhost:5000/api/users/${editingId}/assign-categories`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    categories: Array.from(document.getElementById('categories').selectedOptions)
                        .map(opt => opt.value)
                })
            });

            if (!response.ok) {
                throw new Error('Failed to assign categories');
            }

            await loadEditors();
            closeModal();
            alert('Phân công chuyên mục thành công');
        } catch (error) {
            console.error('Error:', error);
            alert('Không thể phân công chuyên mục: ' + error.message);
        }
    });

    // Initialize page
    await Promise.all([loadEditors(), loadCategories()]);
});