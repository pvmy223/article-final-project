document.addEventListener('DOMContentLoaded', async () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Vui lòng đăng nhập để tiếp tục');
            setTimeout(() => {
                window.location.href = '/pages/login.html';
            }, 2000); // 10 second delay
            return;
        }

        // Debug token
        console.log('Raw token:', token);

        let tokenPayload;
        try {
            tokenPayload = JSON.parse(atob(token.split('.')[1]));
            console.log('Decoded token:', tokenPayload);
        } catch (e) {
            console.error('Token parsing error:', e);
            localStorage.removeItem('token');
            alert('Phiên làm việc không hợp lệ, vui lòng đăng nhập lại');
            setTimeout(() => {
                window.location.href = '/pages/login.html';
            }, 2000);
            return;
        }

        // Verify admin role
        const response = await fetch(`http://localhost:5000/api/auth/users/${tokenPayload.id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to verify user role');
        }

        const userData = await response.json();
        console.log('User data:', userData);

        if (userData.role !== 'administrator') {
            alert('Bạn không có quyền truy cập trang này.');
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
            return;
        }

        // Dashboard functions
        const loadDashboardStats = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/admin/stats', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (!response.ok) throw new Error('Failed to load stats');
                
                const stats = await response.json();
                document.getElementById('totalArticles').textContent = stats.totalArticles || 0;
                document.getElementById('totalUsers').textContent = stats.totalUsers || 0;
                document.getElementById('newUsers').textContent = stats.newUsers || 0;
            } catch (error) {
                console.error('Stats loading error:', error);
                document.getElementById('totalArticles').textContent = 'Error';
                document.getElementById('totalUsers').textContent = 'Error';
                document.getElementById('newUsers').textContent = 'Error';
            }
        };

        const loadRecentActivity = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/admin/activity', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (!response.ok) throw new Error('Failed to load activity');
                
                const activities = await response.json();
                const tbody = document.querySelector('#recentActivityTable tbody');
                tbody.innerHTML = activities.length ? activities.map(activity => `
                    <tr class="hover:bg-gray-50">
                        <td class="px-6 py-4 whitespace-nowrap">${activity.action}</td>
                        <td class="px-6 py-4 whitespace-nowrap">${activity.user}</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            ${new Date(activity.timestamp).toLocaleString('vi-VN')}
                        </td>
                    </tr>
                `).join('') : '<tr><td colspan="3" class="text-center py-4">Không có hoạt động nào</td></tr>';
            } catch (error) {
                console.error('Activity loading error:', error);
                const tbody = document.querySelector('#recentActivityTable tbody');
                tbody.innerHTML = '<tr><td colspan="3" class="text-center py-4 text-red-500">Lỗi tải dữ liệu</td></tr>';
            }
        };

        // Initialize dashboard
        await Promise.all([
            loadDashboardStats(),
            loadRecentActivity()
        ]);

    } catch (error) {
        console.error('Admin dashboard error:', error);
        alert('Có lỗi xảy ra, vui lòng thử lại sau');
    }
});