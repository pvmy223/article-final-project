document.addEventListener('DOMContentLoaded', () => {
    // Get current page path
    const currentPath = window.location.pathname;
    
    // Update sidebar active states
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    sidebarLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (currentPath === href) {
            link.classList.add('bg-blue-50', 'text-blue-600');
            link.classList.remove('hover:bg-gray-100');
        }
    });
});