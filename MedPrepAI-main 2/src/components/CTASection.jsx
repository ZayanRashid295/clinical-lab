import Btn from "./Button";
import ZoomableImage from "./ZoomableImage";

export default function CTASection({
  setPage,
  title = "FCPS-1 & JCAT question banks",
  subtitle = "Full explanations for every option.",
  image,
  imageAlt,
}) {
  return (
    <section className="section cta">
      <div className="wrap">
        {image && (
          <div className="cta-preview">
            <ZoomableImage src={image} alt={imageAlt || "MedPrepAI preview"} />
          </div>
        )}
        <span className="eyebrow center">Start Preparing</span>
        <h2 style={{ fontSize: "1.9rem", marginBottom: 10 }}>{title}</h2>
        <p style={{ color: "var(--slate)" }}>{subtitle}</p>
        <div className="cta-buttons">
          <Btn size="lg" onClick={() => setPage("fcps")}>Begin FCPS-1 Preparation</Btn>
          <Btn variant="ghost" size="lg" onClick={() => setPage("jcat")}>Begin JCAT (MDMS) Preparation</Btn>
        </div>
      </div>
    </section>
  );
}