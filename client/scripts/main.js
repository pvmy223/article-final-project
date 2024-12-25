document.addEventListener('DOMContentLoaded', () => {
    // Debug token persistence
    const token = localStorage.getItem("token");

    if (token) {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) {
                console.error("Invalid token structure");
                return;
            }

            const payload = JSON.parse(atob(parts[1]));
            
            // Check token expiration
            const currentTime = Math.floor(Date.now() / 1000);
            if (payload.exp && payload.exp < currentTime) {
                console.log("Token expired:", {
                    expiry: new Date(payload.exp * 1000),
                    current: new Date(),
                });
                return;
            }

            // Valid token, update UI
            const authSection = document.getElementById("authSection") || 
                              document.querySelector('.hidden.md\\:flex.items-center');

            if (!authSection) {
                console.error("Auth section not found");
                return;
            }

            authSection.innerHTML = `
                <div x-data="{ isOpen: false }" class="relative">
                    <button @click="isOpen = !isOpen" 
                            class="relative z-10 flex items-center p-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none">
                        <span class="mx-1">${payload.username || payload.role || 'Guest'}</span>
                        <svg class="w-5 h-5 mx-1" viewBox="0 0 24 24" fill="none">
                            <path d="M12 15.713L18.01 9.70299L16.597 8.28799L12 12.888L7.40399 8.28799L5.98999 9.70199L12 15.713Z" fill="currentColor"></path>
                        </svg>
                    </button>

                    <div x-show="isOpen" 
                        @click.away="isOpen = false"
                        x-transition:enter="transition ease-out duration-100"
                        x-transition:enter-start="transform opacity-0 scale-95"
                        x-transition:enter-end="transform opacity-100 scale-100"
                        x-transition:leave="transition ease-in duration-75"
                        x-transition:leave-start="transform opacity-100 scale-100"
                        x-transition:leave-end="transform opacity-0 scale-95"
                        class="absolute right-0 z-50 w-48 py-1 mt-2 origin-top-right bg-white rounded-md shadow-lg"
                        style="display: none;">
                        <a href="/pages/profile.html" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            <div class="flex items-center">
                                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path d="M7 8C7 5.23858 9.23858 3 12 3C14.7614 3 17 5.23858 17 8C17 10.7614 14.7614 13 12 13C9.23858 13 7 10.7614 7 8Z"></path>
                                </svg>
                                Thông tin cá nhân
                            </div>
                        </a>
                        <a href="/pages/my-articles.html" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            <div class="flex items-center">
                                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2H9a2 2 0 00-2 2v9a2 2 0 002 2h9z"></path>
                                </svg>
                                Bài viết của tôi
                            </div>
                        </a>
                        <hr class="my-1">
                        <button id="logoutButton" class="block w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-gray-100">
                            <div class="flex items-center">
                                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path d="M19 21H10c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2h9c1.1 0 2 .9 2 2v14c0 1.1-.9 2-2 2zM12 16V13H3v-2h9V8l5 4-5 4z"></path>
                                </svg>
                                Đăng xuất
                            </div>
                        </button>
                    </div>
                </div>
            `;

            // Only remove token on explicit logout
            document.getElementById('logoutButton')?.addEventListener('click', () => {
                localStorage.removeItem('token');
                window.location.href = '/';
            });

        } catch (error) {
            console.error('Token parsing error:', error);
            // Don't auto-remove token on parsing error
        }
    }


    // Handle mobile menu toggle
    const dropdownButton = document.querySelector('.relative.group button');
    const dropdownContent = document.querySelector('.relative.group div.absolute');
    let isDropdownOpen = false;

    if (dropdownButton && dropdownContent) {
        dropdownButton.addEventListener('click', (e) => {
            e.stopPropagation();
            isDropdownOpen = !isDropdownOpen;
            dropdownContent.classList.toggle('invisible');
            dropdownContent.classList.toggle('opacity-0');
        });

        // Close on outside click
        document.addEventListener('click', () => {
            if (isDropdownOpen) {
                dropdownContent.classList.add('invisible', 'opacity-0');
                isDropdownOpen = false;
            }
        });

        // Desktop hover
        const dropdown = document.querySelector('.relative.group');
        dropdown.addEventListener('mouseenter', () => {
            if (window.innerWidth >= 768) {
                dropdownContent.classList.remove('invisible', 'opacity-0');
            }
        });

        dropdown.addEventListener('mouseleave', () => {
            if (window.innerWidth >= 768) {
                dropdownContent.classList.add('invisible', 'opacity-0');
            }
        });
    }

    const searchBox = document.getElementById('searchBox');
    const searchResults = document.getElementById('searchResults');

    // Add search functionality
    searchBox.addEventListener('keyup', async (e) => {
        const query = e.target.value.trim();
        
        if (e.key === 'Enter' && query) {
            // Navigate to search page with query
            window.location.href = `/pages/search.html?query=${encodeURIComponent(query)}`;
            return;
        }

        // Show/hide results dropdown
        if (query.length < 2) {
            searchResults.classList.add('hidden');
            return;
        }

        try {
            const url = new URL(`${SearchService.API_BASE_URL}/api/article/search`);
            url.searchParams.append('query', query);
            url.searchParams.append('limit', '5'); // Quick results limit

            const response = await fetch(url);
            const data = await response.json();

            if (data.articles?.length) {
                searchResults.innerHTML = data.articles.map(article => `
                    <a href="/articles/${article.id}" class="block p-2 hover:bg-gray-100">
                        <div class="text-sm font-medium">${article.title}</div>
                        <div class="text-xs text-gray-500">${article.category}</div>
                    </a>
                `).join('');
                searchResults.classList.remove('hidden');
            } else {
                searchResults.classList.add('hidden');
            }
        } catch (error) {
            console.error('Search error:', error);
        }
    });

    // Close search results when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchBox.contains(e.target)) {
            searchResults.classList.add('hidden');
        }
    });
});