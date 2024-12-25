document.addEventListener("DOMContentLoaded", async () => {
    const formatImageUrl = (imageUrl) => {
        if (!imageUrl) return 'server/uploads/articles/1734685765080-158529008.jpg';
        return imageUrl.startsWith('http') ? imageUrl : `http://localhost:5000${imageUrl}`;
    };
    const createArticleCard = (article, cardType = 'default') => {
        const formatTags = (tags) => {
            if (!tags || !Array.isArray(tags)) return '';
            return tags.map(tag => `
                <a href="/pages/search.html?tag=${tag._id}" 
                   class="inline-block px-2 py-1 mr-1 mb-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded">
                    #${tag.name}
                </a>
            `).join('');
        };

        const templates = {
            featured: `
                <div class="bg-white ml-4 rounded-lg shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl transform hover:-translate-y-2 hover:scale-105">
                    <a href="/pages/article.html?id=${article._id}" class="block">
                        <img src="${formatImageUrl(article.featuredImage)}" 
                             alt="${article.title}"
                             class="w-full h-48 object-cover transition-transform duration-300"
                             onerror="this.onerror=null; this.src='../assets/images/placeholder.jpg';">
                        <div class="p-6 h-64">
                            <div class="mb-3">
                                <a href="/pages/search.html?category=${article.category?._id}" 
                                   class="inline-block px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-full text-sm">
                                    ${article.category?.name || 'Uncategorized'}
                                </a>
                            </div>
                            <h3 class="text-xl font-bold text-gray-900 mb-2 line-clamp-2">${article.title}</h3>
                            <p class="text-gray-600 text-sm mb-4 line-clamp-3">${article.abstract || ''}</p>
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
                    <a href="/pages/article.html?id=${article._id}" class="block">
                        <img src="${formatImageUrl(article.featuredImage)}" 
                             alt="${article.title}"
                             class="w-full h-48 object-cover transition-transform duration-300"
                             onerror="this.onerror=null; this.src='../assets/images/placeholder.jpg';">
                        <div class="p-4">
                            <div class="mb-2">
                                <a href="/pages/search.html?category=${article.category?._id}" 
                                   class="inline-block px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-full text-xs">
                                    ${article.category?.name || 'Uncategorized'}
                                </a>
                            </div>
                            <h3 class="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">${article.title}</h3>
                            <p class="text-gray-600 text-sm mb-3 line-clamp-2">${article.abstract || ''}</p>
                            <div class="mb-3 flex flex-wrap">
                                ${formatTags(article.tags)}
                            </div>
                            <span class="inline-block bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors duration-300">
                                Đọc thêm
                            </span>
                        </div>
                    </a>
                </div>`
        };

      const wrapper = document.createElement('div');
      wrapper.innerHTML = templates[cardType] || templates.default;
      return wrapper.firstElementChild;
  };

  const populateFeaturedArticles = (articles) => {
      const container = document.querySelector('.featured-carousel');
      if (!container) return;
      articles.forEach(article => {
          container.appendChild(createArticleCard(article, 'featured'));
      });
      initializeCarousel();
  };

  const populateMostViewedArticles = (articles) => {
      const container = document.querySelector('.most-viewed .article-list');
      if (!container) return;
      articles.forEach(article => {
          container.appendChild(createArticleCard(article));
      });
      // Remove initializeCarousel call from here
  };

  const populateLatestArticles = (articles) => {
      const container = document.querySelector('.latest-articles .article-list');
      if (!container) return;
      articles.forEach(article => {
          container.appendChild(createArticleCard(article));
      });
      // Remove initializeCarousel call from here
  };

  const populateTopCategories = (categories) => {
      const container = document.querySelector('.category-list');
      if (!container) return;
      categories.forEach(category => {
          const element = document.createElement('div');
          element.className = 'category-card p-4';
          element.innerHTML = `
              <a href="/pages/category.html?id=${category._id}" class="block">
                  <h3 class="text-lg font-bold mb-2">${category.name}</h3>
                  <p class="text-sm text-gray-600">${category.description || ''}</p>
              </a>
          `;
          container.appendChild(element);
      });
  };

    const initializeCarousel = () => {
        const carousel = $('.featured-carousel');
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
        }
    };

    try {
      const sections = [
          { url: "http://localhost:5000/api/article/featured", populate: populateFeaturedArticles },
          { url: "http://localhost:5000/api/article/most-viewed", populate: populateMostViewedArticles },
          { url: "http://localhost:5000/api/article/latest", populate: populateLatestArticles },
          { 
              url: "http://localhost:5000/api/categories/public/withsubs",
              populate: populateTopCategories 
          }
      ];

      for (const section of sections) {
          try {
              const response = await fetch(section.url);
              if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
              const data = await response.json();
              const items = section.dataKey ? data[section.dataKey] : (data.mostViewed || data.articles || data);
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