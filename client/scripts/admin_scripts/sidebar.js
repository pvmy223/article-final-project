document.addEventListener('DOMContentLoaded', () => {
    // Get current page path
    const currentPath = window.location.pathname;
    
    // Get all sidebar links
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    
    // Remove active class from all links
    sidebarLinks.forEach(link => {
        link.classList.remove('bg-blue-50', 'text-blue-600');
        
        // Check if this link matches current page
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('bg-blue-50', 'text-blue-600');
            link.classList.remove('hover:bg-gray-100');
        }
    });
});