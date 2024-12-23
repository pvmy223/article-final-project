document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/pages/login.html";
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const articleId = urlParams.get("id");
  let categoryData = [];

  // Initialize TinyMCE
  await tinymce.init({
    selector: "#content",
    height: 500,
    plugins: "lists link image table code help wordcount",
    toolbar:
      "undo redo | formatselect | bold italic | alignleft aligncenter alignright | bullist numlist | link image | code",
  });

  const loadCategories = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/categories/getallwithsubs",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          alert("Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.");
          window.location.href = "/pages/login.html";
          return;
        }
        throw new Error("Failed to load categories");
      }

      categoryData = await response.json();
      const mainSelect = document.getElementById("category");
      mainSelect.innerHTML = '<option value="">Chọn danh mục</option>';

      if (Array.isArray(categoryData)) {
        categoryData
          .filter((category) => !category.parent)
          .forEach((category) => {
            const option = new Option(category.name, category._id);
            mainSelect.add(option);
          });
      } else {
        console.error("Category data is not an array:", categoryData);
      }

      mainSelect.addEventListener("change", handleCategoryChange);

      // Load article data after categories are loaded
      if (articleId) {
        await loadArticle();
      }
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const handleCategoryChange = (event) => {
    const selectedId = event.target.value;
    const categoryContainer = document.getElementById("category").parentElement;

    const existingSubSelect = document.getElementById("subcategory");
    if (existingSubSelect) {
      existingSubSelect.parentElement.remove();
    }

    if (selectedId) {
      const selectedCategory = categoryData.find(
        (cat) => cat._id === selectedId
      );

      if (selectedCategory?.children?.length > 0) {
        const subCategoryDiv = document.createElement("div");
        subCategoryDiv.className = "mt-4";

        const label = document.createElement("label");
        label.className = "block text-sm font-medium text-gray-700";
        label.textContent = "Danh mục con";

        const select = document.createElement("select");
        select.id = "subcategory";
        select.className =
          "mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500";

        select.innerHTML = '<option value="">Chọn danh mục con</option>';
        selectedCategory.children.forEach((subCat) => {
          const option = new Option(subCat.name, subCat._id);
          select.add(option);
        });

        subCategoryDiv.appendChild(label);
        subCategoryDiv.appendChild(select);
        categoryContainer.insertAdjacentElement("afterend", subCategoryDiv);

        select.addEventListener("change", (e) => {
          if (e.target.value) {
            select.dataset.selectedValue = e.target.value;
          } else {
            delete select.dataset.selectedValue;
          }
        });
      }
    }
  };
    const loadTags = async () => {
      try {
          const response = await fetch("http://localhost:5000/api/tags/gettags", {
              headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
              },
          });
  
          if (!response.ok) {
              throw new Error("Failed to load tags");
          }
  
          const tags = await response.json();
          
          if (!Array.isArray(tags)) {
              console.error("Tags data is not an array:", tags);
              return;
          }
  
          // Transform tags data for Select2
          const tagData = tags.map(tag => ({
              id: tag._id,
              text: tag.name,
              selected: false
          }));
  
          // Initialize Select2 with transformed data
          jQuery('#tags').select2({
              placeholder: 'Chọn tags',
              allowClear: true,
              multiple: true,
              width: '100%',
              data: tagData
          });
  
          // If editing article, set selected tags
          if (articleId) {
              const articleResponse = await fetch(
                  `http://localhost:5000/api/article/${articleId}`,
                  {
                      headers: { Authorization: `Bearer ${token}` }
                  }
              );
  
              if (articleResponse.ok) {
                  const article = await articleResponse.json();
                  if (article.tags && Array.isArray(article.tags)) {
                      const selectedTagIds = article.tags.map(tag => tag._id);
                      jQuery('#tags').val(selectedTagIds).trigger('change');
                  }
              }
          }
      } catch (error) {
          console.error("Error loading tags:", error);
          alert("Không thể tải danh sách tags");
      }
  };

  const loadArticle = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/article/${articleId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const article = await response.json();

      document.getElementById("title").value = article.title;
      document.getElementById("abstract").value = article.abstract;
      tinymce.get("content").setContent(article.content);

      const imagePreview = document.getElementById("imagePreview");
      if (article.featuredImage) {
        // Handle external URLs and local paths differently
        let imageUrl = article.featuredImage;
        if (!imageUrl.startsWith("http")) {
          // Local image path
          imageUrl = `http://localhost:5000${imageUrl}`;
        }

        // Set image attributes
        imagePreview.alt = `Featured image for article: ${article.title}`;
        imagePreview.classList.remove("hidden");
        imagePreview.dataset.existingImage = article.featuredImage;

        // Create new Image object to test loading
        const img = new Image();
        img.onload = () => {
          imagePreview.src = imageUrl;
        };
        img.onerror = () => {
          console.error("Failed to load image:", imageUrl);
          imagePreview.alt = "Failed to load image";
          imagePreview.src = "";
        };
        img.src = imageUrl;
      } else {
        imagePreview.alt = "No featured image available";
        imagePreview.src = "";
        imagePreview.classList.add("hidden");
      }
      // Find parent category if exists
      const parentCategory = categoryData.find((cat) =>
        cat.children.some((child) => child._id === article.category._id)
      );

      if (parentCategory) {
        document.getElementById("category").value = parentCategory._id;
        handleCategoryChange({ target: { value: parentCategory._id } });

        setTimeout(() => {
          const subcategorySelect = document.getElementById("subcategory");
          if (subcategorySelect) {
            subcategorySelect.value = article.category._id;
            subcategorySelect.dataset.selectedValue = article.category._id;
          }
        }, 100);
      } else {
        document.getElementById("category").value = article.category._id;
      }

      if (article.tags && Array.isArray(article.tags)) {
        jQuery('#tags').val(article.tags).trigger('change');
        console.log("Selected tags:", article.tags);
    }

      document.getElementById("isPremium").checked = article.isPremium;
      document.getElementById("status").checked =
        article.status === "published";

      if (article.featuredImage) {
        const imageUrl = `http://localhost:5000${article.featuredImage}`;
        document.getElementById("imagePreview").src = imageUrl;
        document.getElementById("imagePreview").classList.remove("hidden");
      }
    } catch (error) {
      console.error("Error loading article:", error);
    }
  };

  // Add image upload handler
  const uploadImage = async (file) => {
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(
        "http://localhost:5000/api/upload/article-image",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await response.json();
      return data.imagePath;
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  };

  // Update form submission
  document
    .getElementById("articleForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      try {
        let imagePath = null;
        const imageFile = document.getElementById("featuredImage").files[0];

        if (imageFile) {
          imagePath = await uploadImage(imageFile);
        }

        const subCategorySelect = document.getElementById("subcategory");
        const categoryId =
          subCategorySelect?.dataset.selectedValue ||
          document.getElementById("category").value;

        const formData = {
          title: document.getElementById("title").value,
          abstract: document.getElementById("abstract").value,
          content: tinymce.get("content").getContent(),
          category: categoryId,
          tags: jQuery('#tags').val(),
          isPremium: document.getElementById("isPremium").checked,
          status: document.getElementById("status").checked
            ? "published"
            : "draft",
        };

        // Only add image if new one was uploaded
        if (imagePath) {
          formData.featuredImage = imagePath;
        }

        const response = await fetch(
          `http://localhost:5000/api/article/${articleId}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(formData),
          }
        );

        if (!response.ok) throw new Error("Failed to update article");
        window.location.href = "/pages/my-articles.html";
      } catch (error) {
        console.error("Error:", error);
        alert("Không thể cập nhật bài viết. Vui lòng thử lại.");
      }
    });

  // Add image preview handler
  document
    .getElementById("featuredImage")
    .addEventListener("change", function (e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
          const preview = document.getElementById("imagePreview");
          preview.src = e.target.result;
          preview.classList.remove("hidden");
        };
        reader.readAsDataURL(file);
      }
    });

  // Load initial data
  await Promise.all([loadCategories(), loadTags()]);
});
