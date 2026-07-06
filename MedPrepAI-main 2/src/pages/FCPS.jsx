import { useState } from "react";
import Btn from "../components/Button";
import StatsBar from "../components/StatsBar";
import FeatureGrid from "../components/FeatureGrid";
import QBankCarousel from "../components/QBankCarousel";
import ResourceGrid from "../components/ResourceGrid";
import HowItWorks from "../components/HowItWorks";
import Testimonials from "../components/Testimonials";
import CTASection from "../components/CTASection";
import FAQAccordion from "../components/FAQAccordion";
import DemoModal from "../components/DemoModal";
import ZoomableImage from "../components/ZoomableImage";
import { PROGRAMS } from "../data/programData";
import { TESTIMONIALS } from "../data/testimonialData";
import { FAQS } from "../data/faqData";

// FCPS-1 dedicated assets — see the asset table for exact filenames/sizes.
import heroImg from "../assets/fcps/hero.png";
import qbank1 from "../assets/fcps/qbank-1.png";
import qbank2 from "../assets/fcps/qbank-2.png";
import qbank3 from "../assets/fcps/qbank-3.png";
import qbank4 from "../assets/fcps/qbank-4.png";
import qbank5 from "../assets/fcps/qbank-5.png";
import resource1 from "../assets/fcps/resource-1.png";
import resource2 from "../assets/fcps/resource-2.png";
import resource3 from "../assets/fcps/resource-3.png";
import ctaPreview from "../assets/fcps/cta-preview.png";

export default function FCPS({ setPage }) {
  const [demoOpen, setDemoOpen] = useState(false);
  const p = PROGRAMS.fcps;

  const qbankImages = [
    { src: qbank1, alt: "FCPS-1 question with full answer explanation" },
    { src: qbank2, alt: "FCPS-1 clinical scenario with labeled diagram" },
    { src: qbank3, alt: "FCPS-1 question with visual explanation" },
    { src: qbank4, alt: "FCPS-1 performance analytics view" },
    { src: qbank5, alt: "FCPS-1 question bank overview" },
  ];

  const resourceItems = p.resources.map((r, i) => ({
    ...r,
    img: [resource1, resource2, resource3][i],
    alt: r.title,
  }));

  return (
    <>
      {demoOpen && <DemoModal badge={p.badge} onClose={() => setDemoOpen(false)} />}

      {/* ── HERO (checklist layout) ── */}
      <section className="section" style={{ paddingBottom: 24 }}>
        <div className="wrap">
          <span className="eyebrow-pill"><span className="eyebrow-dot" />{p.badge} · Medicine & Allied</span>
          <div className="split" style={{ alignItems: "center" }}>
            <div>
              <h1 style={{ fontSize: "2.6rem", lineHeight: 1.1, marginBottom: 18 }}>
                FCPS-1 preparation
              </h1>
              <p style={{ color: "var(--slate)", marginBottom: 28, lineHeight: 1.7 }}>{p.heroSubtitle}</p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Btn size="lg">Begin FCPS-1 Preparation</Btn>
                <Btn variant="ghost" size="lg" onClick={() => setDemoOpen(true)}>View Sample Questions</Btn>
              </div>
            </div>
            <div className="shot shot-frame shot-4-3">
              <ZoomableImage src={heroImg} alt="FCPS-1 QBank interface" />
            </div>
          </div>
          <StatsBar stats={p.stats} />
        </div>
      </section>

      {/* ── WHAT TO EXPECT (5-image QBank carousel) ── */}
      <section className="section section-surface">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow center">Inside The Question Bank</span>
            <h2>{p.qbankHeading}</h2>
            <p>{p.qbankText}</p>
          </div>
          <QBankCarousel images={qbankImages} />
        </div>
      </section>

      {/* ── RESOURCES (static 3-card section) ── */}
      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow center">Study Resources</span>
            <h2>{p.resourcesHeading}</h2>
            <p>{p.resourcesText}</p>
          </div>
          <ResourceGrid items={resourceItems} />
        </div>
      </section>

      {/* ── FEATURE STRIP ── */}
      <section className="section section-surface">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow center">Built Into Every Question</span>
            <h2>What you get with each item</h2>
          </div>
          <FeatureGrid items={p.cards} layout="strip" />
        </div>
      </section>

      <HowItWorks />

      <Testimonials items={TESTIMONIALS.fcps} heading="What FCPS-1 candidates say" />

      <CTASection setPage={setPage} title="FCPS-1 question bank" subtitle="Full explanations for every option." image={ctaPreview} imageAlt="FCPS-1 QBank preview" />

      <FAQAccordion items={FAQS.fcps} eyebrow="FCPS-1 FAQ" />
    </>
  );
}