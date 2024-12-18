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

    // Load and display article
    try {
        const response = await fetch(`http://localhost:5000/api/article/${articleId}`);
        if (!response.ok) throw new Error("Article not found");

        const article = await response.json();
        
        // Display article
        document.title = article.title;
        document.getElementById("article-title").textContent = article.title;
        document.getElementById("article-date").textContent = new Date(article.createdAt).toLocaleDateString("vi-VN");
        document.getElementById("article-category").textContent = article.category?.name || "";

        const imageElement = document.getElementById("article-image");
        imageElement.src = article.featuredImage || "../assets/images/placeholder.jpg";
        imageElement.alt = article.title;
        imageElement.className = "max-w-[1200px] max-h-[800px] w-full object-contain rounded-lg";

        document.getElementById("article-content").innerHTML = article.content;

        // Display tags
        const tagsContainer = document.getElementById("article-tags");
        article.tags?.forEach(tag => {
            const tagElement = document.createElement("span");
            tagElement.className = "bg-gray-200 px-3 py-1 rounded-full text-sm";
            tagElement.textContent = tag.name;
            tagsContainer.appendChild(tagElement);
        });

        // Load comments
        await loadAndDisplayComments();

    } catch (error) {
        console.error("Error:", error);
        document.getElementById("article-content").innerHTML = 
            '<p class="text-red-500 text-center">Không thể tải bài viết</p>';
    }

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
});