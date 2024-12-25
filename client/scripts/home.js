document.addEventListener("DOMContentLoaded", async () => {
  const formatImageUrl = (imageUrl) => {
    if (!imageUrl) return "server/uploads/articles/1734685765080-158529008.jpg";
    return imageUrl.startsWith("http")
      ? imageUrl
      : `http://localhost:5000${imageUrl}`;
  };
  const createArticleCard = (article, cardType = "default") => {
    const formatTags = (tags) => {
      if (!tags || !Array.isArray(tags)) return "";
      return tags
        .map(
          (tag) => `
                <a href="/pages/search.html?tag=${tag._id}" 
                   class="inline-block px-2 py-1 mr-1 mb-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded">
                    #${tag.name}
                </a>
            `
        )
        .join("");
    };

    const templates = {
      featured: `
                <div class="bg-white ml-4 rounded-lg shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl transform hover:-translate-y-2 hover:scale-105">
                    <a href="/pages/article.html?id=${
                      article._id
                    }" class="block">
                        <img src="${formatImageUrl(article.featuredImage)}" 
                             alt="${article.title}"
                             class="w-full h-48 object-cover transition-transform duration-300"
                             onerror="this.onerror=null; this.src='../assets/images/placeholder.jpg';">
                        <div class="p-6 h-64">
                            <div class="mb-3 flex items-center gap-2">
                                <a href="/pages/search.html?category=${
                                  article.category?._id
                                }" 
                                   class="inline-block px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-full text-sm">
                                    ${article.category?.name || "Uncategorized"}
                                </a>
                                ${article.isPremium ? `
                                  <span class="inline-flex items-center px-2 py-1 bg-yellow-500 text-white rounded-full text-xs">
                                      <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                                      </svg>
                                      Premium
                                  </span>
                              ` : ''}
                            </div>
                            <h3 class="text-xl font-bold text-gray-900 mb-2 line-clamp-2">${
                              article.title
                            }</h3>
                            <p class="text-gray-600 text-sm mb-4 line-clamp-3">${
                              article.abstract || ""
                            }</p>
                            <div class="mb-4 flex flex-wrap">
                                ${formatTags(article.tags)}
                            </div>
                            <span class="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-300">
                                Đọc thêm
                            </span>
                        </div>
                    </a>
                </div>`,
      default: `
                <div class="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1">
                    <a href="/pages/article.html?id=${
                      article._id
                    }" class="block">
                        <img src="${formatImageUrl(article.featuredImage)}" 
                             alt="${article.title}"
                             class="w-full h-48 object-cover transition-transform duration-300"
                             onerror="this.onerror=null; this.src='../assets/images/placeholder.jpg';">
                        <div class="p-4">
                            <div class="mb-2 flex items-center gap-2">
                                <a href="/pages/search.html?category=${
                                  article.category?._id
                                }" 
                                   class="inline-block px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-full text-xs">
                                    ${article.category?.name || "Uncategorized"}
                                </a>
                                ${article.isPremium ? `
                                  <span class="inline-flex items-center px-2 py-1 bg-yellow-500 text-white rounded-full text-xs">
                                      <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                                      </svg>
                                      Premium
                                  </span>
                              ` : ''}
                            </div>
                            <h3 class="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">${
                              article.title
                            }</h3>
                            <p class="text-gray-600 text-sm mb-3 line-clamp-2">${
                              article.abstract || ""
                            }</p>
                            <div class="mb-3 flex flex-wrap">
                                ${formatTags(article.tags)}
                            </div>
                            <span class="inline-block bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors duration-300">
                                Đọc thêm
                            </span>
                        </div>
                    </a>
                </div>`,
      grid: `
            <div class="article-card">
                <div class="bg-white rounded-lg shadow-md overflow-hidden h-full transition-all duration-300 hover:shadow-xl">
                    <a href="/pages/article.html?id=${
                      article._id
                    }" class="block h-full">
                        <div class="relative h-32">
                            <img src="${formatImageUrl(article.featuredImage)}" 
                                alt="${article.title}"
                                class="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                                onerror="this.onerror=null; this.src='/assets/images/default-article.jpg'">
                        </div>
                        <div class="p-3 flex flex-col flex-1">
                            <div class="mb-2 flex items-center gap-2">
                                <span class="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                                    ${article.category?.name || "Uncategorized"}
                                </span>
                                ${article.isPremium ? `
                                  <span class="inline-flex items-center px-2 py-1 bg-yellow-500 text-white rounded-full text-xs">
                                      <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                                      </svg>
                                      Premium
                                  </span>
                              ` : ''}
                            </div>
                            <h3 class="text-sm font-semibold text-gray-900 mb-2 line-clamp-2">
                                ${article.title}
                            </h3>
                            <div class="text-xs text-gray-500 mt-auto">
                                ${new Date(
                                  article.createdAt
                                ).toLocaleDateString("vi-VN")}
                            </div>
                        </div>
                    </a>
                </div>
            </div>
        `,
    };
    if (cardType === "grid") {
      return templates[cardType] || templates.default;
    }
    const wrapper = document.createElement("div");
    wrapper.innerHTML = templates[cardType] || templates.default;
    return wrapper.firstElementChild;
  };

  const populateFeaturedArticles = (articles) => {
    const container = document.querySelector(".featured-carousel");
    if (!container) return;
    articles.forEach((article) => {
      container.appendChild(createArticleCard(article, "featured"));
    });
    initializeCarousel();
  };

  const populateMostViewedArticles = (articles) => {
    const container = document.querySelector('.most-viewed .article-list');
    if (!container) return;

    // Clear existing content
    container.innerHTML = '';
    
    // Add articles directly
    articles.forEach(article => {
        container.innerHTML += createArticleCard(article, 'grid');
    });

    // Initialize carousel after content is added
    $(container).slick({
        infinite: true,
        slidesToShow: 5,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 3000,
        dots: true,
        arrows: true,
        prevArrow: '<button type="button" class="slick-prev">←</button>',
        nextArrow: '<button type="button" class="slick-next">→</button>',
        responsive: [
            {
                breakpoint: 1024,
                settings: {
                    slidesToShow: 3,
                    slidesToScroll: 1
                }
            },
            {
                breakpoint: 640,
                settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1
                }
            }
        ]
    });
};

  const populateLatestArticles = (articles) => {
    const container = document.querySelector(".latest-articles .article-list");
    if (!container) return;

    // Remove grid classes
    container.classList.remove(
      "grid",
      "grid-cols-1",
      "md:grid-cols-2",
      "lg:grid-cols-3",
      "gap-6"
    );

    // Clear existing content and add articles
    container.innerHTML = articles
      .map((article) => createArticleCard(article, "grid"))
      .join("");

    // Initialize carousel
    $(container).slick({
      infinite: true,
      slidesToShow: 5,
      slidesToScroll: 1,
      autoplay: true,
      autoplaySpeed: 3000,
      dots: true,
      arrows: true,
      prevArrow: '<button type="button" class="slick-prev">←</button>',
      nextArrow: '<button type="button" class="slick-next">→</button>',
      responsive: [
        {
          breakpoint: 1024,
          settings: {
            slidesToShow: 3,
            slidesToScroll: 1,
          },
        },
        {
          breakpoint: 640,
          settings: {
            slidesToShow: 1,
            slidesToScroll: 1,
          },
        },
      ],
    });
  };

  const populateTopCategories = (categories) => {
    const container = document.querySelector(".category-list");
    if (!container) return;

    container.innerHTML = categories
      .map(
        (category) => `
        <div class="bg-white rounded-lg shadow-md overflow-hidden">
            <div class="p-4 border-b">
                <h3 class="text-xl font-bold text-gray-900">
                    <a href="/pages/category/${
                      category.slug
                    }" class="hover:text-blue-600">
                        ${category.name}
                    </a>
                </h3>
            </div>
            ${renderCategoryContent(category)}
        </div>
    `
      )
      .join("");
  };

  const renderCategoryContent = (category) => {
    if (!category.article) {
      return `<div class="p-4 text-gray-500">Chưa có bài viết</div>`;
    }

    return `
            <a href="/pages/article.html?id=${
              category.article._id
            }" class="block">
                <div class="relative h-48">
                    <img 
                        src="${formatImageUrl(category.article.featuredImage)}" 
                        alt="${category.article.title}"
                        class="w-full h-full object-cover"
                        onerror="this.onerror=null; this.src='/assets/images/default-article.jpg'"
                    >
                </div>
                <div class="p-4">
                    <h4 class="font-semibold text-lg mb-2 line-clamp-2 hover:text-blue-600">
                        ${category.article.title}
                    </h4>
                    <p class="text-gray-600 text-sm line-clamp-2">
                        ${category.article.abstract || ""}
                    </p>
                    <div class="mt-2 text-sm text-gray-500">
                        ${new Date(
                          category.article.createdAt
                        ).toLocaleDateString("vi-VN")}
                    </div>
                </div>
            </a>
        `;
  };

  const initializeCarousel = () => {
    const carousel = $(".featured-carousel");
    if (carousel.length) {
      carousel.slick({
        infinite: true,
        slidesToShow: 3,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 2000,
        dots: true,
        arrows: true,
        prevArrow: '<button type="button" class="slick-prev">Previous</button>',
        nextArrow: '<button type="button" class="slick-next">Next</button>',
        responsive: [
          {
            breakpoint: 1024,
            settings: {
              slidesToShow: 2,
              slidesToScroll: 1,
            },
          },
          {
            breakpoint: 640,
            settings: {
              slidesToShow: 1,
              slidesToScroll: 1,
            },
          },
        ],
      });
    }
  };

  try {
    const sections = [
      {
        url: "http://localhost:5000/api/article/featured",
        populate: populateFeaturedArticles,
      },
      {
        url: "http://localhost:5000/api/article/most-viewed",
        populate: populateMostViewedArticles,
      },
      {
        url: "http://localhost:5000/api/article/latest",
        populate: populateLatestArticles,
      },
      {
        url: "http://localhost:5000/api/article/latest-by-category",
        populate: populateTopCategories,
      },
    ];

    for (const section of sections) {
      try {
        const response = await fetch(section.url);
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        const items = section.dataKey
          ? data[section.dataKey]
          : data.mostViewed || data.articles || data;
        if (Array.isArray(items)) {
          section.populate(items);
        }
      } catch (error) {
        console.error(`Error loading section ${section.url}:`, error);
      }
    }
  } catch (error) {
    console.error("Error fetching articles:", error);
  }
});
