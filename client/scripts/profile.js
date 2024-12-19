document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/pages/login.html';
        return;
    }

    try {
        // Get user ID from token and debug
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userId = payload.id;
        console.log('Debug - Token payload:', payload);
        console.log('Debug - User ID:', userId);

        // Fix API endpoint path
        const response = await fetch(`http://localhost:5000/api/auth/users/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        // Debug response
        console.log('Debug - Response status:', response.status);
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Debug - Error response:', errorData);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const userData = await response.json();
        console.log('User data:', userData);

        // Update form fields
        const usernameInput = document.querySelector('input[name="username"]');
        const emailInput = document.querySelector('input[name="email"]');
        const passwordInput = document.querySelector('input[name="password"]');

        if (userData) {
            usernameInput.value = userData.username || '';
            emailInput.value = userData.email || '';
            passwordInput.value = '';
        }

        // Update role badge
        const roleBadge = document.getElementById('roleBadge');
        if (roleBadge && userData.role) {
            roleBadge.textContent = userData.role.charAt(0).toUpperCase() + userData.role.slice(1);
        }

        // Handle form submission
        const profileForm = document.getElementById('profileForm');
        // Fix PUT endpoint
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const updatedData = {
                username: usernameInput.value.trim(),
                email: emailInput.value.trim()
            };

            if (passwordInput.value.trim()) {
                updatedData.password = passwordInput.value.trim();
            }

            try {
                const updateResponse = await fetch(`http://localhost:5000/api/auth/users/${userId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(updatedData)
                });

                if (!updateResponse.ok) {
                    const errorData = await updateResponse.json();
                    throw new Error(errorData.message || 'Update failed');
                }

                alert('Cập nhật thành công');
                window.location.reload();
            } catch (error) {
                console.error('Update error:', error);
                alert('Cập nhật thất bại: ' + error.message);
            }
        });

        // Fix DELETE endpoint
        const deleteButton = document.getElementById('deleteAccount');
        deleteButton?.addEventListener('click', async () => {
            if (!confirm('Bạn có chắc muốn xóa tài khoản?')) return;

            try {
                const deleteResponse = await fetch(`http://localhost:5000/api/auth/users/${userId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!deleteResponse.ok) {
                    throw new Error('Delete failed');
                }

                localStorage.removeItem('token');
                window.location.href = '/pages/register.html';
            } catch (error) {
                console.error('Delete error:', error);
                alert('Xóa tài khoản thất bại: ' + error.message);
            }
        });

    } catch (error) {
        console.error('Profile error:', error);
        alert('Không thể tải thông tin người dùng: ' + error.message);
    }
});