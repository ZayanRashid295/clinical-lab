// Generic "image on one side, text on the other" section.
// imageSrc should point at a file placed in src/assets (see README notes).
export default function SplitSection({ eyebrow, title, text, imageSrc, imageAlt, reverse, surface }) {
  return (
    <section className={`section ${surface ? "section-surface" : ""}`}>
      <div className="wrap split" style={{ direction: reverse ? "rtl" : "ltr" }}>
        <div style={{ direction: "ltr" }}>
          <div className="shot shot-frame">
            {imageSrc ? <img src={imageSrc} alt={imageAlt} /> : `[ ${imageAlt} ]`}
          </div>
        </div>
        <div style={{ direction: "ltr" }}>
          <span className="eyebrow">{eyebrow}</span>
          <h2>{title}</h2>
          <p>{text}</p>
        </div>
      </div>
    </section>
  );
}
