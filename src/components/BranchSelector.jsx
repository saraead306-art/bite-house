import { ArrowLeft, MapPin } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

export default function BranchSelector({ branches = [], onSelectBranch }) {
  return (
    <main className="branch-screen">
      <div className="branch-theme-toggle"><ThemeToggle /></div>
      <div className="branch-selection-shell">
        {/* Branches */}
        <section className="branch-panel" aria-label="اختيار الفرع">
          <div className="branch-title-wrap">
            <span className="branch-title-line" aria-hidden="true" />
            <h1 className="branch-kicker">اختار الفرع</h1>
            <span className="branch-title-line" aria-hidden="true" />
          </div>

          <p className="branch-helper">
            اختار الفرع الأقرب ليك وابدأ تشوف المنيو
          </p>

          <div className="branch-list">
            {branches.map((branch, index) => (
              <button
                type="button"
                className="branch-card"
                key={branch.id}
                onClick={() => onSelectBranch(branch)}
                style={{ '--branch-delay': `${index * 110}ms` }}
              >
                <span className="branch-card-index">
                  {String(index + 1).padStart(2, '0')}
                </span>

                <span className="branch-card-text">
                  <strong>{branch.name}</strong>

                  <b>
                    {branch.englishName || branch.name}
                  </b>

                  <small>
                    <MapPin size={14} strokeWidth={2.2} />
                    <span>{branch.address}</span>
                  </small>
                </span>

                <span
                  className="branch-arrow"
                  aria-hidden="true"
                >
                  <ArrowLeft
                    size={21}
                    strokeWidth={2.2}
                  />
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Video */}
        <section
          className="branch-video-side"
          aria-label="Bite House"
        >
          <div
            className="branch-video-glow branch-video-glow-one"
            aria-hidden="true"
          />

          <div
            className="branch-video-glow branch-video-glow-two"
            aria-hidden="true"
          />

          <div className="branch-video-wrap">
            <video
              className="branch-video"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              aria-label="Bite House video"
            >
              <source
                src="/media/3.webm"
                type="video/webm"
              />
            </video>
          </div>
        </section>

      </div>
    </main>
  );
}