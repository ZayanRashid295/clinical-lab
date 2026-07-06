"use client";

import { useState, type ReactNode } from "react";
import { LandingImageLightbox } from "./landing-v2-image-lightbox";

export function ProgramIcon({ name, size = 18 }: { name: string; size?: number }) {
  const stroke = {
    width: size,
    height: size,
    fill: "none" as const,
    stroke: "var(--mkt-accent)",
    strokeWidth: 2.4,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "check":
      return (
        <svg viewBox="0 0 24 24" {...stroke}>
          <path d="M20 6L9 17l-5-5" />
        </svg>
      );
    case "star":
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} fill="var(--mkt-accent-muted)" stroke="none">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z" />
        </svg>
      );
    case "left":
      return (
        <svg viewBox="0 0 24 24" width={size + 2} height={size + 2} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      );
    case "right":
      return (
        <svg viewBox="0 0 24 24" width={size + 2} height={size + 2} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
      );
    case "close":
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      );
    case "zoom":
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3M11 8v6M8 11h6" />
        </svg>
      );
    case "quote":
      return (
        <svg viewBox="0 0 24 24" width={size + 4} height={size + 4} fill="var(--mkt-border)" stroke="none">
          <path d="M9.5 7C6.5 8.2 5 10.4 5 13.2c0 2.4 1.6 4 3.6 4 1.7 0 3-1.3 3-3s-1.2-2.8-2.7-2.8c-.2 0-.4 0-.6.1.3-1.6 1.7-3 3.4-3.6L9.5 7zm9 0c-3 1.2-4.5 3.4-4.5 6.2 0 2.4 1.6 4 3.6 4 1.7 0 3-1.3 3-3s-1.2-2.8-2.7-2.8c-.2 0-.4 0-.6.1.3-1.6 1.7-3 3.4-3.6L18.5 7z" />
        </svg>
      );
    default:
      return null;
  }
}

export function ProgramBtn({
  variant = "primary",
  size = "md",
  children,
  onClick,
  fullWidth,
}: {
  variant?: "primary" | "ghost";
  size?: "md" | "lg";
  children: ReactNode;
  onClick?: () => void;
  fullWidth?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const isPrimary = variant === "primary";
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        borderRadius: 8,
        fontWeight: 600,
        cursor: "pointer",
        border: isPrimary ? "none" : `1px solid ${hovered ? "var(--mkt-accent)" : "var(--mkt-border)"}`,
        background: isPrimary
          ? hovered
            ? "var(--mkt-accent-hover)"
            : "var(--mkt-accent)"
          : hovered
            ? "var(--mkt-bg-elevated)"
            : "transparent",
        color: isPrimary ? "#fff" : "var(--mkt-text)",
        padding: size === "lg" ? "14px 28px" : "11px 22px",
        fontSize: size === "lg" ? "0.98rem" : "0.92rem",
        fontFamily: "inherit",
        width: fullWidth ? "100%" : "auto",
        transition: "all .18s ease",
      }}
    >
      {children}
    </button>
  );
}

export function ZoomableImage({ src, alt }: { src: string; alt: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        className="zoomable"
        onClick={() => setOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        aria-label={`Enlarge image: ${alt}`}
      >
        <img src={src} alt={alt} />
        <span className="zoom-hint">
          <ProgramIcon name="zoom" size={16} />
        </span>
      </div>
      <LandingImageLightbox
        open={open}
        onOpenChange={setOpen}
        images={[{ src, alt }]}
        index={0}
      />
    </>
  );
}

export function QBankCarousel({ images }: { images: Array<{ src: string; alt: string }> }) {
  const [index, setIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const len = images.length;

  const go = (dir: number) => setIndex((i) => (i + dir + len) % len);

  const openLightbox = (i: number) => {
    setLightboxIndex(i);
    setIndex(i);
    setLightboxOpen(true);
  };

  const relPosition = (i: number) => {
    let offset = i - index;
    if (offset > len / 2) offset -= len;
    if (offset < -len / 2) offset += len;
    return offset;
  };

  return (
    <div>
      <div className="qbank-carousel">
        <button type="button" className="qbank-arrow left" onClick={() => go(-1)} aria-label="Previous screenshot">
          <ProgramIcon name="left" />
        </button>
        <div className="qbank-stage">
          {images.map((img, i) => {
            const rel = relPosition(i);
            let cls = "qbank-slide is-hidden";
            if (rel === 0) cls = "qbank-slide is-center";
            else if (rel === -1) cls = "qbank-slide is-prev";
            else if (rel === 1) cls = "qbank-slide is-next";

            return (
              <div
                key={img.src}
                className={cls}
                onClick={() => (rel === 0 ? openLightbox(i) : setIndex(i))}
                onDoubleClick={() => openLightbox(i)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openLightbox(i);
                  }
                }}
                aria-label={rel === 0 ? `Enlarge: ${img.alt}` : `Show screenshot: ${img.alt}`}
              >
                {rel === 0 ? (
                  <div className="zoomable zoomable--inline">
                    <img src={img.src} alt={img.alt} />
                    <span className="zoom-hint">
                      <ProgramIcon name="zoom" size={16} />
                    </span>
                  </div>
                ) : (
                  <img src={img.src} alt={img.alt} />
                )}
              </div>
            );
          })}
        </div>
        <button type="button" className="qbank-arrow right" onClick={() => go(1)} aria-label="Next screenshot">
          <ProgramIcon name="right" />
        </button>
      </div>
      <div className="qbank-dots">
        {images.map((img, i) => (
          <button
            key={img.src}
            type="button"
            className={`qbank-dot ${i === index ? "active" : ""}`}
            onClick={() => setIndex(i)}
            aria-label={`Go to screenshot ${i + 1}`}
          />
        ))}
      </div>
      <LandingImageLightbox
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        images={images}
        index={lightboxIndex}
        onIndexChange={(i) => {
          setLightboxIndex(i);
          setIndex(i);
        }}
      />
    </div>
  );
}

export function StatsBar({ stats }: { stats: Array<{ num: string; label: string }> }) {
  return (
    <div className="stats-bar">
      {stats.map((s) => (
        <div key={s.label} className="stat-item">
          <div className="stat-num">{s.num}</div>
          <div className="stat-label">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

export function ResourceGrid({ items }: { items: Array<{ title: string; desc: string; img: string; alt: string }> }) {
  return (
    <div className="resource-grid">
      {items.map((it) => (
        <div className="resource-card" key={it.title}>
          <div className="shot">
            <ZoomableImage src={it.img} alt={it.alt} />
          </div>
          <div className="resource-card-body">
            <h3>{it.title}</h3>
            <p>{it.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function FeatureStrip({ items }: { items: Array<{ title: string; desc: string }> }) {
  return (
    <div className="strip">
      {items.map((it) => (
        <div key={it.title}>
          <div className="card-icon">
            <ProgramIcon name="check" />
          </div>
          <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>{it.title}</div>
        </div>
      ))}
    </div>
  );
}

export function ProgramHowItWorks() {
  const steps = [
    { title: "Create your account", desc: "Pick FCPS-1 or JCAT (MDMS) and set up your profile." },
    { title: "Practice questions", desc: "Work through scenario MCQs at exam difficulty." },
    { title: "Read explanations", desc: "Review why each option is right or wrong." },
    { title: "Track progress", desc: "Use dashboards to spot weak areas and trends." },
  ];
  return (
    <section className="section" id="how-it-works">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow center">Getting Started</span>
          <h2>How it works</h2>
          <p>From sign-up to exam day.</p>
        </div>
        <div className="steps">
          {steps.map((s, i) => (
            <div key={s.title}>
              <div className="step-num">{i + 1}</div>
              <h3 style={{ fontSize: "1rem", marginBottom: 6 }}>{s.title}</h3>
              <p style={{ color: "var(--mkt-text-muted)", fontSize: "0.88rem", lineHeight: 1.6 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const TESTI_PAGE_SIZE = 3;

export function ProgramTestimonials({
  items,
  heading,
}: {
  items: Array<{ name: string; city: string; text: string }>;
  heading: string;
}) {
  const [page, setPage] = useState(0);
  const pageCount = Math.ceil(items.length / TESTI_PAGE_SIZE);
  const visible = items.slice(page * TESTI_PAGE_SIZE, page * TESTI_PAGE_SIZE + TESTI_PAGE_SIZE);
  const go = (dir: number) => setPage((p) => (p + dir + pageCount) % pageCount);

  return (
    <section className="section section-surface">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow center">From Candidates</span>
          <h2>{heading}</h2>
          <div className="stars" style={{ justifyContent: "center", marginTop: 8 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <ProgramIcon key={i} name="star" />
            ))}
            <span style={{ color: "var(--mkt-text-muted)", fontSize: "0.85rem", marginLeft: 6 }}>
              ({items.length}+ reviews)
            </span>
          </div>
        </div>
        <div className="testi-carousel">
          {pageCount > 1 && (
            <button type="button" className="testi-arrow" onClick={() => go(-1)} aria-label="Previous reviews">
              <ProgramIcon name="left" />
            </button>
          )}
          <div className="testi-track">
            <div className="testi-page">
              {visible.map((r) => (
                <div className="review-card" key={r.name}>
                  <ProgramIcon name="quote" />
                  <p className="review-quote">{r.text}</p>
                  <div className="review-foot">
                    <div>
                      <div className="review-name">{r.name}</div>
                      <div className="review-role">{r.city}, Pakistan</div>
                    </div>
                    <div className="stars">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <ProgramIcon key={i} name="star" size={14} />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {pageCount > 1 && (
            <button type="button" className="testi-arrow" onClick={() => go(1)} aria-label="Next reviews">
              <ProgramIcon name="right" />
            </button>
          )}
        </div>
        {pageCount > 1 && (
          <div className="testi-dots">
            {Array.from({ length: pageCount }).map((_, i) => (
              <button
                key={i}
                type="button"
                className={`testi-dot ${i === page ? "active" : ""}`}
                onClick={() => setPage(i)}
                aria-label={`Go to review page ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function ProgramFAQ({ items, eyebrow }: { items: Array<{ q: string; a: string }>; eyebrow: string }) {
  const [open, setOpen] = useState(0);
  return (
    <section className="section" id="faq">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow center">{eyebrow}</span>
          <h2>Common questions</h2>
        </div>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          {items.map((item, i) => (
            <div key={item.q} className="faq-item">
              <button type="button" className="faq-q" onClick={() => setOpen(open === i ? -1 : i)}>
                <span>{item.q}</span>
                <span className={`faq-chevron ${open === i ? "open" : ""}`}>
                  <ProgramIcon name="right" size={16} />
                </span>
              </button>
              {open === i && <p className="faq-a">{item.a}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function DemoModal({ badge, onClose, onSubmit }: { badge: string; onClose: () => void; onSubmit?: () => void }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
          <ProgramIcon name="close" />
        </button>
        <div className="modal-brand">
          <span className="brand-mark" />
          <span style={{ fontFamily: "Georgia, serif", fontWeight: 600 }}>MedPrepAI</span>
        </div>
        <h3 className="modal-title">Complete the form to explore MedPrepAI&apos;s {badge} demo</h3>
        <div className="field-row">
          <label className="field">
            First Name <span className="required">*</span>
            <input />
          </label>
          <label className="field">
            Last Name <span className="required">*</span>
            <input />
          </label>
        </div>
        <div className="field-row">
          <label className="field">
            Email <span className="required">*</span>
            <input type="email" />
          </label>
          <label className="field">
            Graduating Year <span className="required">*</span>
            <select defaultValue="">
              <option value="" disabled>
                Please select...
              </option>
              <option>2026</option>
              <option>2027</option>
              <option>2028</option>
              <option>2029</option>
              <option>Already Graduated</option>
            </select>
          </label>
        </div>
        <label className="field" style={{ marginBottom: 22, display: "block" }}>
          Country
          <select defaultValue="">
            <option value="" disabled>
              Please select...
            </option>
            <option>Pakistan</option>
            <option>Other</option>
          </select>
        </label>
        <ProgramBtn
          size="lg"
          onClick={() => {
            onSubmit?.();
            onClose();
          }}
        >
          Submit
        </ProgramBtn>
      </div>
    </div>
  );
}
