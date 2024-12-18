document.addEventListener("DOMContentLoaded", async () => {
  const createArticleCard = (article, cardType = 'default') => {
      const templates = {
          featured: `
              <div class="featured-card relative ml-4">
                  <a href="/pages/article.html?id=${article._id}" class="block">
                      <img src="${article.featuredImage || '../assets/images/placeholder.jpg'}" 
                           alt="${article.title}"
                           style="width: 300px; height: 200px; object-fit: cover;">
                      <div class="featured-content">
                          <h3 class="text-xl font-bold mb-2">${article.title}</h3>
                          <p class="text-sm text-gray-300 mb-2">${article.abstract || ''}</p>
                          <p class="text-sm">${article.summary || ''}</p>
                      </div>
                  </a>
              </div>`,
          default: `
              <div class="article-card">
                  <a href="/pages/article.html?id=${article._id}" class="block">
                      <img src="${article.featuredImage || '../assets/images/placeholder.jpg'}" 
                           alt="${article.title}"
                           style="width: 300px; height: 200px; object-fit: cover;">
                      <div class="article-content">
                          <h3 class="text-lg font-bold mb-2">${article.title}</h3>
                          <p class="text-sm text-gray-500 mb-2">${article.abstract || ''}</p>
                          <p class="text-sm text-gray-600">${article.summary || ''}</p>
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
  };

  const populateLatestArticles = (articles) => {
      const container = document.querySelector('.latest-articles .article-list');
      if (!container) return;
      articles.forEach(article => {
          container.appendChild(createArticleCard(article));
      });
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
        $('.featured-carousel').slick({
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
    };

    try {
      const sections = [
          { url: "http://localhost:5000/api/article/top", populate: populateFeaturedArticles },
          { url: "http://localhost:5000/api/article/top", populate: populateMostViewedArticles },
          { url: "http://localhost:5000/api/article/top", populate: populateLatestArticles },
          { url: "http://localhost:5000/api/categories/getcategories", populate: populateTopCategories }
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