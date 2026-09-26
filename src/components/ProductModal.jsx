import { useEffect } from 'react';
import { ImageOff, X } from 'lucide-react';

function getPriceOptions(product) {
  const options = [];

  const medium = Number(product?.price);
  const large = Number(product?.largePrice);

  if (
    product?.price !== null &&
    product?.price !== undefined &&
    product?.price !== '' &&
    Number.isFinite(medium)
  ) {
    options.push({
      key: 'medium',
      label: 'الحجم الصغير',
      shortLabel: 'صغير',
      value: medium,
    });
  }

  if (
    product?.largePrice !== null &&
    product?.largePrice !== undefined &&
    product?.largePrice !== '' &&
    Number.isFinite(large)
  ) {
    options.push({
      key: 'large',
      label: 'الحجم الكبير',
      shortLabel: 'كبير',
      value: large,
    });
  }

  // توافق مع البيانات القديمة التي كانت تستخدم sizes فقط.
  if (!options.length && Array.isArray(product?.sizes)) {
    product.sizes.forEach((value, index) => {
      if (
        value !== null &&
        value !== undefined &&
        value !== '' &&
        Number.isFinite(Number(value))
      ) {
        const isLarge = product.sizes.length > 1 && index === 1;

        options.push({
          key: isLarge ? 'large' : 'medium',
          label: isLarge ? 'الحجم الكبير' : 'الحجم الصغير',
          shortLabel: isLarge ? 'كبير' : 'صغير',
          value: Number(value),
        });
      }
    });
  }

  return options;
}

export default function ProductModal({
  product,
  onClose,
}) {
  useEffect(() => {
    if (!product) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleEscape(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleEscape);
    };
  }, [product, onClose]);

  if (!product) {
    return null;
  }

  const priceOptions = getPriceOptions(product);

  return (
    <div
      className="product-detail-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="product-detail-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-detail-title"
      >
        <button
          type="button"
          className="close-button"
          onClick={onClose}
          aria-label="إغلاق تفاصيل الصنف"
        >
          <X size={19} />
        </button>

        <div className="product-detail-visual">
          <span className="product-detail-spotlight" aria-hidden="true" />

          {product.image ? (
            <img
              src={product.image}
              alt={product.nameAr || product.name}
            />
          ) : (
            <span className="modal-emoji">
              <ImageOff size={58} strokeWidth={1.2} />
            </span>
          )}
        </div>

        {product.badge && (
          <span className="product-detail-badge">
            {product.badge}
          </span>
        )}

        <div className="product-detail-content">
          <p className="product-en">
            {product.name || 'BITE HOUSE'}
          </p>

          <h2 id="product-detail-title">
            {product.nameAr || product.name}
          </h2>

          <div className="product-detail-divider" />

          <div className="product-detail-section">
            <div className="product-detail-label">
              التفاصيل
            </div>

            <p className="product-detail-description">
              {product.description?.trim() ||
                'لا توجد تفاصيل إضافية عن هذا الصنف.'}
            </p>
          </div>

          <div className="product-detail-divider" />

          <div className="product-detail-section">
            <div className="product-detail-label">
              الأسعار والأحجام
            </div>

            {priceOptions.length > 0 ? (
              <div className="product-detail-prices">
                {priceOptions.map((option) => (
                  <div
                    className="product-detail-price-card"
                    key={`${product.id}-${option.key}`}
                  >
                    <div>
                      <span className="product-detail-price-name">
                        {option.label}
                      </span>

                      <small>
                        {option.shortLabel}
                      </small>
                    </div>

                    <strong>
                      {option.value}
                      <span> ج.م</span>
                    </strong>
                  </div>
                ))}
              </div>
            ) : (
              <div className="product-detail-no-price">
                لا يوجد سعر مضاف لهذا الصنف حاليًا.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}