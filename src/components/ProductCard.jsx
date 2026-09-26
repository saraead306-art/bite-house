import { ImageOff } from 'lucide-react';

import useReveal from '../hooks/useReveal';

function getPriceOptions(product) {
  const options = [];

  if (
    product?.price !== null &&
    product?.price !== undefined &&
    product?.price !== '' &&
    Number.isFinite(Number(product.price))
  ) {
    options.push({
      label: 'M',
      value: Number(product.price),
    });
  }

  if (
    product?.largePrice !== null &&
    product?.largePrice !== undefined &&
    product?.largePrice !== '' &&
    Number.isFinite(Number(product.largePrice))
  ) {
    options.push({
      label: 'L',
      value: Number(product.largePrice),
    });
  }

  if (!options.length && Array.isArray(product?.sizes)) {
    product.sizes.forEach((value, index) => {
      if (value !== null && value !== undefined && value !== '') {
        options.push({
          label: product.sizes.length > 1 ? (index === 0 ? 'M' : 'L') : 'LE',
          value,
        });
      }
    });
  }

  return options;
}

export default function ProductCard({
  product,
  onOpen,
  style,
}) {
  const [ref, visible] = useReveal();
  const priceOptions = getPriceOptions(product);

  return (
    <article
      ref={ref}
      className={`product-card reveal${visible ? ' visible' : ''}`}
      onClick={() => onOpen(product)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen(product);
        }
      }}
      aria-label={`عرض ${product.nameAr}`}
      style={style}
    >
      {product.badge && (
        <span className="product-tag">
          {product.badge}
        </span>
      )}

      <div className="product-text">
        <p className="product-en">
          {product.name}
        </p>

        <h3>{product.nameAr}</h3>

        <div className="product-prices">
          {priceOptions.map((option, index) => (
            <span
              className="price-chip"
              key={`${product.id}-${option.label}-${index}`}
            >
              <strong>
                {option.value}
                <small>.LE</small>
              </strong>
              <em>{option.label}</em>
            </span>
          ))}
        </div>
      </div>

      <div className="product-photo" aria-hidden="true">
        <span className="product-photo-glow" />

        {product.image ? (
          <img
            src={product.image}
            alt=""
            className="product-real-image"
          />
        ) : (
          <span className="product-emoji">
            <ImageOff size={44} strokeWidth={1.35} />
          </span>
        )}
      </div>
    </article>
  );
}
