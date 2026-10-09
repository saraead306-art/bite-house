import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  MapPin,
  Search,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react';

import ProductCard from './ProductCard';
import OfferCard from './OfferCard';
import ProductModal from './ProductModal';

const NAV_OFFSET = 124;

export default function MenuPage({
  branch,
  categories = [],
  offers = [],
  query,
  setQuery,
  visibleProducts,
  selectedProduct,
  setSelectedProduct,
  onChangeBranch,
}) {
  const [
    activeCategory,
    setActiveCategory,
  ] = useState(
    categories[0]?.id
  );

  const [
    menuLoaded,
    setMenuLoaded,
  ] = useState(false);

  const sectionRefs =
    useRef({});

  const isClickScrolling =
    useRef(false);

  /*
    الأقسام العادية
  */
  const sections =
    useMemo(() => {
      return categories.map(
        (category) => {
          const items =
            visibleProducts.filter(
              (product) =>
                product.category ===
                category.id
            );

          return {
            ...category,
            items,
          };
        }
      );
    }, [
      categories,
      visibleProducts,
    ]);

  /*
    Animation تحميل الصفحة
  */
  useEffect(() => {
    const timer =
      window.setTimeout(
        () =>
          setMenuLoaded(true),
        80
      );

    return () =>
      window.clearTimeout(
        timer
      );
  }, []);

  /*
    تحديد القسم النشط
  */
  useEffect(() => {
    const firstCategory =
      sections[0]?.id;

    const hasActiveTarget =
      sections.some(
        (section) =>
          section.id ===
          activeCategory
      ) ||
      (
        activeCategory ===
          'offers' &&
        offers.length > 0
      );

    /*
      لو القسم الحالي مش موجود
      نرجع لأول قسم
    */
    if (
      firstCategory &&
      !hasActiveTarget
    ) {
      setActiveCategory(
        firstCategory
      );
    }

    /*
      لو مفيش أقسام عادية
      وفيه عروض
      نخلي العروض هي الـ active
    */
    if (
      !firstCategory &&
      offers.length > 0 &&
      activeCategory !==
        'offers'
    ) {
      setActiveCategory(
        'offers'
      );
    }
  }, [
    sections,
    activeCategory,
    offers.length,
  ]);

  /*
    Intersection Observer
    لمعرفة القسم الظاهر أثناء الـ scroll
  */
  useEffect(() => {
    if (
      typeof IntersectionObserver ===
      'undefined'
    ) {
      return undefined;
    }

    const observer =
      new IntersectionObserver(
        (entries) => {
          if (
            isClickScrolling.current
          ) {
            return;
          }

          const visible =
            entries
              .filter(
                (entry) =>
                  entry.isIntersecting
              )
              .sort(
                (a, b) =>
                  a.boundingClientRect
                    .top -
                  b.boundingClientRect
                    .top
              );

          if (visible[0]) {
            setActiveCategory(
              visible[0]
                .target
                .dataset
                .categoryId
            );
          }
        },
        {
          rootMargin: `-${NAV_OFFSET}px 0px -60% 0px`,
          threshold: 0,
        }
      );

    /*
      الأقسام العادية
    */
    sections.forEach(
      (section) => {
        const node =
          sectionRefs.current[
            section.id
          ];

        if (node) {
          observer.observe(
            node
          );
        }
      }
    );

    /*
      قسم العروض
    */
    if (
      offers.length > 0
    ) {
      const offersNode =
        sectionRefs.current
          .offers;

      if (offersNode) {
        observer.observe(
          offersNode
        );
      }
    }

    return () =>
      observer.disconnect();
  }, [
    sections,
    offers,
  ]);

  /*
    التنقل بين الأقسام
  */
  function handleNavClick(
    categoryId
  ) {
    setActiveCategory(
      categoryId
    );

    const node =
      sectionRefs.current[
        categoryId
      ];

    if (!node) {
      return;
    }

    isClickScrolling.current =
      true;

    const top =
      node.getBoundingClientRect()
        .top +
      window.scrollY -
      NAV_OFFSET +
      1;

    window.scrollTo({
      top,
      behavior: 'smooth',
    });

    window.clearTimeout(
      handleNavClick.timer
    );

    handleNavClick.timer =
      window.setTimeout(
        () => {
          isClickScrolling.current =
            false;
        },
        800
      );
  }

  return (
    <div
      className={`app-shell premium-menu${
        menuLoaded
          ? ' menu-loaded'
          : ''
      }`}
    >
      {/* =========================
          TOP BAR
      ========================== */}

      <header className="topbar">
        <div className="brand-lockup">
          <span className="brand-mark small">
            🍔
          </span>

          <span className="brand-word">
            BITE <b>HOUSE</b>
          </span>
        </div>

        <button
          type="button"
          className="branch-pill"
          onClick={
            onChangeBranch
          }
        >
          <MapPin size={15} />

          {branch.name}
        </button>
      </header>

      <main className="container">

        {/* =========================
            HERO
        ========================== */}

        <section className="hero-card hero-premium">
          <div className="hero-copy">

            <span className="hero-kicker">
              <Sparkles
                size={14}
              />{' '}
              FRESH • HOT • MADE FOR YOU
            </span>

            <p className="eyebrow">
              طعم بيجمع الحبايب
            </p>

            <h2>
              سيب السعادة علينا
            </h2>

            <h2>
              <span>
                واختار اللي على مزاجك
              </span>
            </h2>

            <p className="muted">
              برجر طازة، صوصات معمولة بحب،
              وتفاصيل صغيرة تفرق في كل
              bite.
            </p>
          </div>

          <div className="hero-food premium-hero-food">
            <span
              className="hero-glow"
              aria-hidden="true"
            />

            <img
              src="https://mozyvxusbhgygnivkjly.supabase.co/storage/v1/object/public/bite-house-images/media/products/optimized/5.webp"
              alt="Bite House"
            />
          </div>
        </section>

        {/* =========================
            MENU HEADER + SEARCH
        ========================== */}

        <div className="section-heading premium-section-heading">
          <div>
            <p className="eyebrow">
              OUR MENU
            </p>

            <h2>
              اختار أكلك
            </h2>

            <span>
              كل اختيار معمول عشان يخليك
              تقول: عايز كمان واحد.
            </span>
          </div>

          <label
            className="search-box"
            aria-label="البحث في المنيو"
          >
            <Search
              size={17}
            />

            <input
              placeholder="ابحث في المنيو..."
              value={query}
              onChange={(
                event
              ) =>
                setQuery(
                  event.target.value
                )
              }
            />
          </label>
        </div>

        {/* =========================
            CATEGORY NAVIGATION
        ========================== */}

        {(sections.length >
          0 ||
          offers.length >
            0) && (
          <nav
            className="categories categories-sticky"
            aria-label="أقسام المنيو"
          >

            {/* الأقسام العادية */}

            {sections.map(
              (category) => (
                <button
                  type="button"
                  className={
                    activeCategory ===
                    category.id
                      ? 'active'
                      : ''
                  }
                  key={
                    category.id
                  }
                  onClick={() =>
                    handleNavClick(
                      category.id
                    )
                  }
                >
                  {
                    category.label
                  }
                </button>
              )
            )}

            {/* العروض في آخر الـ navigation */}

            {offers.length >
              0 && (
              <button
                type="button"
                className={
                  activeCategory ===
                  'offers'
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  handleNavClick(
                    'offers'
                  )
                }
              >
                العروض
              </button>
            )}
          </nav>
        )}

        {/* =========================
            NORMAL CATEGORIES
        ========================== */}

        {sections.map(
          (category) => (
            <section
              className="menu-section"
              key={
                category.id
              }
              id={`cat-${category.id}`}
              data-category-id={
                category.id
              }
              ref={(node) => {
                sectionRefs.current[
                  category.id
                ] = node;
              }}
            >

              <div className="menu-section-title">

                <span className="menu-section-icon">
                  <UtensilsCrossed
                    size={16}
                  />
                </span>

                <div>
                  <h3>
                    {
                      category.label
                    }
                  </h3>

                  <small>
                    مختارات Bite House
                  </small>
                </div>

                <span className="menu-section-count">
                  {
                    category.items
                      .length
                  }{' '}
                  صنف
                </span>

              </div>

              {category.items
                .length > 0 ? (
                <div className="product-grid">

                  {category.items.map(
                    (
                      product,
                      index
                    ) => (
                      <ProductCard
                        key={
                          product.id
                        }
                        product={
                          product
                        }
                        onOpen={
                          setSelectedProduct
                        }
                        style={{
                          '--card-delay': `${
                            index *
                            70
                          }ms`,
                        }}
                      />
                    )
                  )}

                </div>
              ) : (
                <div className="empty-state">
                  لسه مفيش أصناف مضافة
                  في القسم ده.
                </div>
              )}

            </section>
          )
        )}

        {/* =========================
            OFFERS SECTION
            دا آخر قسم
        ========================== */}

        {offers.length >
          0 && (
          <section
            className="menu-section offers-menu-section"
            id="cat-offers"
            data-category-id="offers"
            ref={(node) => {
              sectionRefs.current.offers =
                node;
            }}
          >

            <div className="menu-section-title">

              <span className="menu-section-icon offer-section-icon">
                <Sparkles
                  size={16}
                />
              </span>

              <div>
                <h3>
                  العروض
                </h3>

                <small>
                  عروض Bite House
                  المميزة
                </small>
              </div>

              <span className="menu-section-count">
                {
                  offers.length
                }{' '}
                عرض
              </span>

            </div>

            {/* 
              هنا العروض ليها Grid خاص
              بيها علشان شكلها مختلف
              عن الـ Product Cards
            */}

            <div className="offer-grid-v2">

              {offers.map(
                (offer) => (
                  <OfferCard
                    key={
                      offer.id
                    }
                    offer={
                      offer
                    }
                  />
                )
              )}

            </div>

          </section>
        )}

        {/* =========================
            EMPTY STATE
        ========================== */}

        {!sections.length &&
          !offers.length && (
            <div className="empty-state">
              لا توجد أقسام أو عروض
              مضافة للمنيو حاليًا.
            </div>
          )}

      </main>

      {/* =========================
          PRODUCT DETAILS MODAL
      ========================== */}

      <ProductModal
        product={
          selectedProduct
        }
        onClose={() =>
          setSelectedProduct(
            null
          )
        }
      />
    </div>
  );
}