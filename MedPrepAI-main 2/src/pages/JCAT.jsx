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

// JCAT (MDMS) dedicated assets — see the asset table for exact filenames/sizes.
import heroImg from "../assets/jcat/hero.png";
import qbank1 from "../assets/jcat/qbank-1.png";
import qbank2 from "../assets/jcat/qbank-2.png";
import qbank3 from "../assets/jcat/qbank-3.png";
import qbank4 from "../assets/jcat/qbank-4.png";
import qbank5 from "../assets/jcat/qbank-5.png";
import resource1 from "../assets/jcat/resource-1.png";
import resource2 from "../assets/jcat/resource-2.png";
import resource3 from "../assets/jcat/resource-3.png";
import ctaPreview from "../assets/jcat/cta-preview.png";

export default function JCAT({ setPage }) {
  const [demoOpen, setDemoOpen] = useState(false);
  const p = PROGRAMS.jcat;

  const qbankImages = [
    { src: qbank1, alt: "JCAT (MDMS) question with full answer explanation" },
    { src: qbank2, alt: "JCAT (MDMS) clinical scenario with labeled diagram" },
    { src: qbank3, alt: "JCAT (MDMS) question with visual explanation" },
    { src: qbank4, alt: "JCAT (MDMS) performance analytics view" },
    { src: qbank5, alt: "JCAT (MDMS) question bank overview" },
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
                JCAT (MDMS) preparation
              </h1>
              <p style={{ color: "var(--slate)", marginBottom: 28, lineHeight: 1.7 }}>{p.heroSubtitle}</p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Btn size="lg">Begin JCAT (MDMS) Preparation</Btn>
                <Btn variant="ghost" size="lg" onClick={() => setDemoOpen(true)}>View Sample Questions</Btn>
              </div>
            </div>
            <div className="shot shot-frame shot-4-3">
              <ZoomableImage src={heroImg} alt="JCAT (MDMS) QBank interface" />
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

      <Testimonials items={TESTIMONIALS.jcat} heading="What JCAT (MDMS) candidates say" />

      <CTASection setPage={setPage} title="JCAT (MDMS) question bank" subtitle="Full explanations for every option." image={ctaPreview} imageAlt="JCAT (MDMS) QBank preview" />

      <FAQAccordion items={FAQS.jcat} eyebrow="JCAT (MDMS) FAQ" />
    </>
  );
}