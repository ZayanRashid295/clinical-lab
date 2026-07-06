import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Icon from "./Icons";

// Wraps an image so clicking it opens a full-screen zoomed preview,
// matching the UWorld hero-screenshot click behavior.
//
// The lightbox is rendered through a portal straight into document.body.
// This matters specifically inside the QBank carousel: `.qbank-slide.is-center`
// has a CSS `transform` on it (translateX/scale), and ANY ancestor with a
// transform creates a new containing block for `position: fixed` children —
// so without the portal, the "full screen" overlay was being sized and
// positioned relative to the small, scaled slide instead of the real
// viewport.
//
// All layout-critical styles below are INLINE on purpose (not in index.css).
// That removes any dependency on stylesheet load order / class-name
// collisions / specificity — the overlay, frame, and image will always be
// positioned and sized correctly even if index.css hasn't loaded yet or a
// class name clashes with something else in the project.
export default function ZoomableImage({ src, alt, className = "" }) {
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <div className={`zoomable ${className}`} onClick={() => setOpen(true)}>
        <img src={src} alt={alt} />
        <span className="zoom-hint"><Icon name="zoom" size={16} /></span>
      </div>

      {open && createPortal(
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(15,23,42,0.85)", zIndex: 9999,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 40, cursor: "zoom-out",
          }}
        >
          <button
            onClick={() => setOpen(false)}
            aria-label="Close preview"
            style={{
              position: "fixed", top: 20, right: 24, width: 40, height: 40, borderRadius: "50%",
              background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 10000,
            }}
          >
            <Icon name="close" size={20} />
          </button>

          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(1400px, 94vw)", height: "min(900px, 90vh)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            {failed ? (
              <div style={{ color: "#fff", fontFamily: "monospace", fontSize: "0.85rem", textAlign: "center" }}>
                Image failed to load:<br />{src}
              </div>
            ) : (
              <img
                src={src}
                alt={alt}
                onError={() => setFailed(true)}
                style={{
                  maxWidth: "100%", maxHeight: "100%", width: "auto", height: "auto",
                  objectFit: "contain", borderRadius: 12,
                  boxShadow: "0 30px 80px rgba(0,0,0,0.5)", cursor: "default", background: "#fff",
                }}
              />
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}