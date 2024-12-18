document.addEventListener('DOMContentLoaded', () => {
    const dropdownButton = document.querySelector('.relative.group button');
    const dropdownContent = document.querySelector('.relative.group div.absolute');
    let isDropdownOpen = false;

    // Toggle dropdown on click (for mobile)
    dropdownButton.addEventListener('click', (e) => {
        e.stopPropagation();
        isDropdownOpen = !isDropdownOpen;
        dropdownContent.classList.toggle('invisible');
        dropdownContent.classList.toggle('opacity-0');
        dropdownContent.classList.toggle('scale-95');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
        if (isDropdownOpen) {
            dropdownContent.classList.add('invisible', 'opacity-0', 'scale-95');
            isDropdownOpen = false;
        }
    });

    // Handle hover for desktop
    const dropdown = document.querySelector('.relative.group');
    dropdown.addEventListener('mouseenter', () => {
        if (window.innerWidth >= 768) { // md breakpoint
            dropdownContent.classList.remove('invisible', 'opacity-0', 'scale-95');
        }
    });

    dropdown.addEventListener('mouseleave', () => {
        if (window.innerWidth >= 768) {
            dropdownContent.classList.add('invisible', 'opacity-0', 'scale-95');
        }
    });
});