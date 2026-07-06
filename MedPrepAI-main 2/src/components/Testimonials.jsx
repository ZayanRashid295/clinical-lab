import { useState } from "react";
import Icon from "./Icons";
import Btn from "./Button";

const PAGE_SIZE = 3;

export default function Testimonials({ items, heading = "What people say" }) {
  const [page, setPage] = useState(0);
  const pageCount = Math.ceil(items.length / PAGE_SIZE);
  const start = page * PAGE_SIZE;
  const visible = items.slice(start, start + PAGE_SIZE);

  const go = (dir) => setPage((p) => (p + dir + pageCount) % pageCount);

  return (
    <section className="section section-surface">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow center">From Candidates</span>
          <h2>{heading}</h2>
          <div className="stars" style={{ justifyContent: "center", marginTop: 8 }}>
            {Array.from({ length: 5 }).map((_, i) => <Icon key={i} name="star" />)}
            <span style={{ color: "var(--slate)", fontSize: "0.85rem", marginLeft: 6 }}>({items.length}+ reviews)</span>
          </div>
        </div>

        <div className="testi-carousel">
          {pageCount > 1 && (
            <button className="testi-arrow" onClick={() => go(-1)} aria-label="Previous reviews">
              <Icon name="left" />
            </button>
          )}

          <div className="testi-track">
            <div className="testi-page">
              {visible.map((r) => (
                <div className="review-card" key={r.name}>
                  <Icon name="quote" />
                  <p className="review-quote">{r.text}</p>
                  <div className="review-foot">
                    <div>
                      <div className="review-name">{r.name}</div>
                      <div className="review-role">{r.city}, Pakistan</div>
                    </div>
                    <div className="stars">
                      {Array.from({ length: 5 }).map((_, i) => <Icon key={i} name="star" size={14} />)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {pageCount > 1 && (
            <button className="testi-arrow" onClick={() => go(1)} aria-label="Next reviews">
              <Icon name="right" />
            </button>
          )}
        </div>

        {pageCount > 1 && (
          <div className="testi-dots">
            {Array.from({ length: pageCount }).map((_, i) => (
              <button key={i} className={`testi-dot ${i === page ? "active" : ""}`} onClick={() => setPage(i)} aria-label={`Go to review page ${i + 1}`} />
            ))}
          </div>
        )}

        <div className="testi-more">
          <Btn variant="ghost">Read More Reviews</Btn>
        </div>
      </div>
    </section>
  );
}
