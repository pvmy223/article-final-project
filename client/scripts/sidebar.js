document.addEventListener('DOMContentLoaded', () => {
    // Get current page path
    const currentPath = window.location.pathname;
    
    // Get user role from token
    const token = localStorage.getItem('token');
    let userRole = 'guest';
    
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            userRole = payload.role;
        } catch (error) {
            console.error('Error parsing token:', error);
        }
    }

    // Hide/show sidebar items based on role
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    sidebarLinks.forEach(link => {
        const href = link.getAttribute('href');
        
        // Hide review articles link for non-editor/admin users
        if (href === '/pages/editor.html' && !['editor', 'admin'].includes(userRole)) {
            link.style.display = 'none';
        }
        
        // Hide my articles link for guest/subscriber
        if (href === '/pages/my-articles.html' && ['guest', 'subscriber'].includes(userRole)) {
            link.style.display = 'none';
        }

        // Add active state for current page
        if (currentPath === href) {
            link.classList.add('bg-blue-50', 'text-blue-600');
            link.classList.remove('hover:bg-gray-100');
        }
    });
});