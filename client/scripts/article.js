function formatImageUrl(imageUrl) {
    if (!imageUrl) return '../assets/images/placeholder.jpg';
    return imageUrl.startsWith('http') ? imageUrl : `http://localhost:5000${imageUrl}`;
}

document.addEventListener("DOMContentLoaded", async () => {
    // Constants & Variables
    let allComments = [];
    let displayedComments = 10;
    const commentsPerPage = 10;
    
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get("id");

    if (!articleId) {
        window.location.href = "/";
        return;
    }

    function getUserRole() {
        const token = localStorage.getItem('token');
        if (!token) return 'guest';
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.role;
        } catch (error) {
            console.error('Error parsing token:', error);
            return 'guest';
        }
    }

    const loadArticle = async () => {
        try {
            // Add loading state
            document.getElementById("article-content").innerHTML = 
                '<div class="text-center"><span class="text-gray-500">Đang tải...</span></div>';

            const response = await fetch(`http://localhost:5000/api/article/${articleId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const article = await response.json();

            // Clear existing content
            document.getElementById("article-title").textContent = "";
            document.getElementById("article-content").innerHTML = "";
            document.getElementById("article-tags").innerHTML = "";
            
            // Display article
            const userRole = getUserRole();
            const canViewPremiumContent = ['subscriber', 'editor', 'administrator', 'writer'].includes(userRole);

            // Display article
            document.title = article.title;
            document.getElementById("article-title").textContent = article.title;
            document.getElementById("article-date").textContent = 
                new Date(article.createdAt).toLocaleDateString("vi-VN");
            document.getElementById("article-category").textContent = article.category?.name || "";

            // Handle featured image
            const imageElement = document.getElementById("article-image");
            if (article.featuredImage) {
                const imageUrl = formatImageUrl(article.featuredImage);
                imageElement.src = imageUrl;
                // Show image with fade effect when loaded
                imageElement.onload = () => {
                    imageElement.classList.remove('opacity-0');
                };
            } else {
                // Hide image container if no featured image
                imageElement.parentElement.classList.add('hidden');
            }
            // Display content based on premium status and user role
        const contentDiv = document.getElementById("article-content");
        
        if (article.isPremium && !canViewPremiumContent) {
            // Show premium content preview
            contentDiv.innerHTML = `
                <div class="space-y-4">
                    <div class="flex items-center space-x-2 mb-4">
                        <span class="bg-yellow-500 text-white px-2 py-1 rounded-full text-sm">Premium</span>
                    </div>
                    <p class="text-lg mb-4">${article.abstract}</p>
                    <div class="bg-blue-50 p-6 rounded-lg text-center">
                        <p class="text-lg font-semibold mb-4">Đây là nội dung premium</p>
                        <p class="mb-4">Để xem toàn bộ nội dung, bạn cần đăng ký gói Subscriber</p>
                        <a href="/pages/subscription.html" 
                           class="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">
                            Đăng ký ngay
                        </a>
                    </div>
                </div>
            `;
        } else {
            // Show full content
            contentDiv.innerHTML = `
                ${article.isPremium ? `
                    <div class="flex items-center space-x-2 mb-4">
                        <span class="bg-yellow-500 text-white px-2 py-1 rounded-full text-sm">Premium</span>
                    </div>
                ` : ''}
                ${article.content || ''}
            `;
        }

            // Display tags
            const tagsContainer = document.getElementById("article-tags");
            if (article.tags?.length) {
                tagsContainer.innerHTML = article.tags.map(tag => `
                    <a 
                        href="/pages/search.html?tags=${tag._id}" 
                        class="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded-full text-sm transition-colors"
                        data-tag-id="${tag._id}"
                    >
                        ${tag.name}
                    </a>
                `).join('');
            
                // Add click handlers for tags
                tagsContainer.querySelectorAll('a').forEach(tagLink => {
                    tagLink.addEventListener('click', (e) => {
                        e.preventDefault();
                        const tagId = tagLink.dataset.tagId;
                        window.location.href = `/pages/search.html?tags=${tagId}`;
                    });
                });
            }

            // Load comments
            await loadAndDisplayComments();

        } catch (error) {
            console.error("Error:", error);
            document.getElementById("article-content").innerHTML = 
                '<p class="text-red-500 text-center">Không thể tải bài viết</p>';
        }
    };

    
    // Load and display comments function
    async function loadAndDisplayComments() {
        const commentsResponse = await fetch(`http://localhost:5000/api/comments/${articleId}`);
        if (!commentsResponse.ok) throw new Error('Failed to fetch comments');

        allComments = await commentsResponse.json();
        const commentsList = document.getElementById("comments-list");
        commentsList.innerHTML = '';

        // Add load more button
        const loadMoreContainer = document.createElement('div');
        loadMoreContainer.className = 'text-center mt-4';
        loadMoreContainer.innerHTML = `
            <button id="loadMoreComments" 
                    class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 
                    ${allComments.length <= commentsPerPage ? 'hidden' : ''}">
                Xem thêm bình luận
            </button>
        `;
        commentsList.parentElement.appendChild(loadMoreContainer);

        // Display initial comments
        displayComments(0, displayedComments);

        // Add load more handler
        document.getElementById('loadMoreComments')?.addEventListener('click', () => {
            const start = displayedComments;
            displayedComments += commentsPerPage;
            displayComments(start, displayedComments);

            if (displayedComments >= allComments.length) {
                document.getElementById('loadMoreComments')?.classList.add('hidden');
            }
        });
    }

    // Display comments helper
    function displayComments(start, end) {
        const token = localStorage.getItem("token");
        let currentUserId = null;
        
        if (token) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            currentUserId = payload.id;
        }

        const commentsList = document.getElementById("comments-list");
        const commentsToShow = allComments.slice(start, end);

        commentsToShow.forEach(comment => {
            const commentElement = document.createElement("div");
            commentElement.className = "border-b pb-4 mb-4";

            const deleteButton = currentUserId === comment.user._id 
                ? `<button class="text-red-500 hover:text-red-700 delete-comment">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                   </button>` 
                : '';

            commentElement.innerHTML = `
                <div class="flex justify-between items-center mb-2">
                    <span class="font-bold">${comment.user.username}</span>
                    <div class="flex items-center space-x-2">
                        <span class="text-gray-500 text-sm">
                            ${new Date(comment.createdAt).toLocaleDateString("vi-VN")}
                        </span>
                        ${deleteButton}
                    </div>
                </div>
                <p>${comment.content}</p>
            `;

            if (currentUserId === comment.user._id) {
                const deleteBtn = commentElement.querySelector('.delete-comment');
                deleteBtn?.addEventListener('click', () => deleteComment(comment._id, commentElement));
            }

            commentsList.appendChild(commentElement);
        });
    }

    // Delete comment handler
    async function deleteComment(commentId, element) {
        if (!confirm('Bạn có chắc chắn muốn xóa bình luận này?')) return;

        const token = localStorage.getItem("token");
        try {
            const response = await fetch(`http://localhost:5000/api/comments/${commentId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                element.remove();
                allComments = allComments.filter(c => c._id !== commentId);
                const loadMoreButton = document.getElementById('loadMoreComments');
                loadMoreButton?.classList.toggle('hidden', allComments.length <= commentsPerPage);
            }
        } catch (error) {
            console.error('Error deleting comment:', error);
            alert('Không thể xóa bình luận');
        }
    }

    // Comment form submission
    document.getElementById("comment-form").addEventListener("submit", handleCommentSubmission);

    async function handleCommentSubmission(e) {
        e.preventDefault();
        
        const token = localStorage.getItem("token");
        if (!token) {
            alert("Vui lòng đăng nhập để bình luận");
            window.location.href = "/pages/login.html";
            return;
        }

        const submitButton = e.target.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        const content = document.getElementById("comment-content").value.trim();

        if (!content) {
            alert("Vui lòng nhập nội dung bình luận");
            return;
        }

        try {
            submitButton.disabled = true;
            submitButton.textContent = "Đang gửi...";
            submitButton.classList.add('opacity-50', 'cursor-not-allowed');

            const response = await fetch("http://localhost:5000/api/comments/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({ articleId, content }),
            });

            if (response.ok) {
                const result = await response.json();
                document.getElementById("comment-form").reset();
                allComments.unshift(result.comment);
                const commentsList = document.getElementById("comments-list");
                commentsList.innerHTML = '';
                displayComments(0, displayedComments);
                
                submitButton.textContent = "Đã gửi";
                submitButton.classList.remove('opacity-50', 'cursor-not-allowed');
                submitButton.classList.add('bg-green-600');
            }
        } catch (error) {
            console.error("Error posting comment:", error);
            alert("Không thể gửi bình luận. Vui lòng thử lại sau.");
        } finally {
            setTimeout(() => {
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
                submitButton.classList.remove('bg-green-600', 'opacity-50', 'cursor-not-allowed');
            }, 2000);
        }
    }
    async function loadRelatedArticles() {
        try {
            const response = await fetch(`http://localhost:5000/api/article/${articleId}/related`);
            if (!response.ok) throw new Error('Failed to fetch related articles');
    
            const relatedArticles = await response.json();
            const container = document.getElementById('related-articles');
    
            if (relatedArticles.length === 0) {
                container.parentElement.classList.add('hidden');
                return;
            }
    
            // Take only first 5 articles
            const articles = relatedArticles.slice(0, 5);
    
            // Update grid class for 5 columns
            container.className = 'grid grid-cols-5 gap-4';
    
            container.innerHTML = articles.map(article => `
                <article class="bg-white rounded-lg shadow-md overflow-hidden h-full transition-all duration-300 hover:shadow-xl">
                    <a href="article.html?id=${article._id}" class="block h-full flex flex-col">
                        <div class="relative h-32">
                            <img 
                                src="${formatImageUrl(article.featuredImage)}" 
                                alt="${article.title}"
                                class="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                                onerror="this.onerror=null; this.src='/assets/images/default-article.jpg'"
                            >
                        </div>
                        <div class="p-3 flex-1 flex flex-col">
                            <div class="mb-2">
                                <span class="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                                    ${article.category?.name || 'Uncategorized'}
                                </span>
                            </div>
                            <h4 class="text-sm font-semibold text-gray-900 mb-2 line-clamp-2 flex-1">
                                ${article.title}
                            </h4>
                            <div class="text-xs text-gray-500">
                                ${new Date(article.createdAt).toLocaleDateString('vi-VN')}
                            </div>
                        </div>
                    </a>
                </article>
            `).join('');
    
        } catch (error) {
            console.error('Error loading related articles:', error);
            document.getElementById('related-articles').parentElement.classList.add('hidden');
        }
    }
    
    // Add to loadArticle function
    await loadArticle();
    await loadRelatedArticles(); // Add this line

});