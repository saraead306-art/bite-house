import {
  BadgePercent,
  Check,
  Clock3,
  Sparkles,
  Tag,
} from 'lucide-react';

function toNumber(
  value
) {
  const result =
    Number(value);

  return Number.isFinite(
    result
  )
    ? result
    : 0;
}

function getSizeLabel(
  product
) {
  const size =
    String(
      product?.size ??
        product?.selectedSize ??
        ''
    ).toUpperCase();

  if (
    size === 'M' ||
    size === 'L'
  ) {
    return size;
  }

  return '';
}

function getQuantity(
  product
) {
  const quantity =
    Math.floor(
      toNumber(
        product?.quantity ??
          product?.qty ??
          1
      )
    );

  return quantity >
    0
    ? quantity
    : 1;
}

export default function OfferCard({
  offer,
}) {
  const products =
    Array.isArray(
      offer?.products
    )
      ? offer.products
      : [];

  const originalTotal =
    toNumber(
      offer?.originalTotal
    );

  const discountAmount =
    toNumber(
      offer?.discountAmount
    );

  const finalTotal =
    toNumber(
      offer?.finalTotal
    );

  const details =
    products.map(
      (
        product,
        index
      ) => {
        const quantity =
          getQuantity(
            product
          );

        const size =
          getSizeLabel(
            product
          );

        const name =
          product?.nameAr ||
          product?.name ||
          'صنف';

        return {
          key: `${
            product?.id ??
            index
          }-${index}`,

          quantity,

          size,

          name,
        };
      }
    );

  return (
    <article className="offer-card-distinct">

      {/* =========================
          TOP HEADER
      ========================== */}

      <div className="offer-card-distinct-top">

        <div className="offer-card-distinct-ribbon">
          <BadgePercent
            size={14}
          />

          <span>
            {offer?.discountType ===
            'percentage'
              ? `خصم ${toNumber(
                  offer?.discountValue
                )}%`
              : `وفر ${discountAmount} ج.م`}
          </span>
        </div>

        <div className="offer-card-distinct-label">
          <Sparkles
            size={13}
          />

          <span>
            SPECIAL OFFER
          </span>
        </div>

      </div>

      {/* =========================
          MAIN BODY
      ========================== */}

      <div className="offer-card-distinct-body">

        {/* =========================
            IMAGE SIDE
        ========================== */}

        <div className="offer-card-distinct-image-wrap">

          <div className="offer-card-distinct-orbit orbit-one" />

          <div className="offer-card-distinct-orbit orbit-two" />

          {offer?.image ? (
            <img
              src={
                offer.image
              }
              alt={
                offer?.title ||
                'عرض'
              }
              className="offer-card-distinct-image"
            />
          ) : (
            <div className="offer-card-distinct-placeholder">
              <Tag
                size={38}
              />
            </div>
          )}

          <span className="offer-card-distinct-seal">
            OFFER
          </span>

        </div>

        {/* =========================
            CONTENT SIDE
        ========================== */}

        <div className="offer-card-distinct-content">

          <span className="offer-card-distinct-kicker">
            BITE HOUSE DEAL
          </span>

          <h3>
            {
              offer?.title ||
              'عرض مميز'
            }
          </h3>

          {offer?.description && (
            <p className="offer-card-distinct-description">
              {
                offer.description
              }
            </p>
          )}

          {/* =========================
              OFFER PRODUCTS
          ========================== */}

          <div className="offer-card-distinct-composition">

            {details.length >
            0 ? (
              details.map(
                (
                  item,
                  index
                ) => (
                  <div
                    className="offer-card-distinct-item-wrap"
                    key={
                      item.key
                    }
                  >
                  </div>
                )
              )
            ) : (
              <div className="offer-card-distinct-empty">
                تفاصيل العرض
                هتظهر هنا.
              </div>
            )}

          </div>

          {/* =========================
              DIVIDER
          ========================== */}

          <div className="offer-card-distinct-separator" />

          {/* =========================
              PRICE
          ========================== */}

          <div className="offer-card-distinct-price-row">

            <div>

              <span className="offer-card-distinct-price-caption">
                سعر العرض
              </span>

              <strong className="offer-card-distinct-final-price">

                {finalTotal.toLocaleString(
                  'en-EG'
                )}

                <small>
                  {' '}
                  ج.م
                </small>

              </strong>

            </div>

            {originalTotal >
              finalTotal && (
              <div className="offer-card-distinct-old-price">

                <span>
                  بدل
                </span>

                <del>
                  {originalTotal.toLocaleString(
                    'en-EG'
                  )}{' '}
                  ج.م
                </del>

              </div>
            )}

          </div>

          {/* =========================
              BOTTOM
          ========================== */}

          <div className="offer-card-distinct-bottom">

            <span className="offer-card-distinct-saving">

              <Sparkles
                size={12}
              />

              وفر{' '}
              {discountAmount.toLocaleString(
                'en-EG'
              )}{' '}
              ج.م

            </span>

            <span className="offer-card-distinct-time">

              <Clock3
                size={12}
              />

              عرض خاص

            </span>

          </div>

        </div>
      </div>
    </article>
  );
}