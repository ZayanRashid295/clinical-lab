"use client";

import { useMemo, useState } from "react";
import { CinematicSection } from "../hero-sequence";
import { CinematicSectionHead } from "./cinematic-section-head";
import { CinematicQBankCarousel } from "./CinematicQBankCarousel";
import { CinematicResourceGrid } from "./CinematicResourceGrid";
import {
  PROGRAMS,
  PROGRAM_FAQS,
  PROGRAM_QBANK_CAROUSEL,
  PROGRAM_RESOURCE_IMAGES_BY_INDEX,
  PROGRAM_TESTIMONIALS,
  type ExamTrack,
} from "./landing-v2-data";

const PROGRAM_STEPS = [
  { n: "01", title: "Create your account", body: "Pick your exam track and set up your study profile in under a minute." },
  { n: "02", title: "Practice questions", body: "Work through scenario MCQs at real exam difficulty with every option explained." },
  { n: "03", title: "Read explanations", body: "Review why each option is right or wrong until the logic sticks." },
  { n: "04", title: "Track progress", body: "Use dashboards to spot weak areas and measure improvement over time." },
];

export interface ProgramCinematicBodyProps {
  track: ExamTrack;
  onBeginPrep: () => void;
  onOpenDemo: () => void;
  onExploreOther: () => void;
  otherTrackLabel: string;
}

export function ProgramCinematicBody({
  track,
  onBeginPrep,
  onOpenDemo,
  onExploreOther,
  otherTrackLabel,
}: ProgramCinematicBodyProps) {
  const p = PROGRAMS[track];
  const faqEyebrow = track === "fcps" ? "FCPS-1 FAQ" : "JCAT (MDMS) FAQ";
  const testimonialHeading =
    track === "fcps" ? "What FCPS-1 candidates say" : "What JCAT (MDMS) candidates say";
  const beginLabel =
    track === "fcps" ? "Begin FCPS-1 Preparation" : "Begin JCAT (MDMS) Preparation";
  const [faqOpen, setFaqOpen] = useState(0);

  const testimonials = PROGRAM_TESTIMONIALS[track].slice(0, 3);

  const resourceItems = useMemo(
    () =>
      p.resources.map((item, index) => ({
        title: item.title,
        desc: item.desc,
        img:
          PROGRAM_RESOURCE_IMAGES_BY_INDEX[index] ??
          PROGRAM_RESOURCE_IMAGES_BY_INDEX[0]!,
        alt: item.title,
      })),
    [p.resources],
  );

  return (
    <>
      <CinematicSection id="qbank" theme="platform" align="left" ariaLabel="Question bank overview">
        <CinematicSectionHead
          kicker="Inside The Question Bank"
          title={p.qbankHeading}
          lead={p.qbankText}
        />
        <div className="cine-program-media">
          <CinematicQBankCarousel images={[...PROGRAM_QBANK_CAROUSEL]} />
        </div>
      </CinematicSection>

      <CinematicSection theme="distinction" align="left" ariaLabel="Study resources">
        <CinematicSectionHead
          kicker="Study Resources"
          title={p.resourcesHeading}
          lead={p.resourcesText}
        />
        <div className="cine-program-media">
          <CinematicResourceGrid items={resourceItems} />
        </div>
      </CinematicSection>

      <CinematicSection theme="platform" align="left" ariaLabel="Built into every question">
        <CinematicSectionHead
          kicker="Built Into Every Question"
          title="What you get with each item"
          lead="Every MCQ is designed to build reasoning — not memorisation."
        />
        <div className="cine-text-grid cine-text-grid--2">
          {p.cards.map(({ title, desc }) => (
            <article key={title} className="cine-text-block cine-text-block--feature">
              <h4 className="lp-h4">{title}</h4>
              <p>{desc}</p>
            </article>
          ))}
        </div>
      </CinematicSection>

      <CinematicSection id="how-it-works" theme="workflow" align="left" ariaLabel="How it works">
        <CinematicSectionHead
          kicker="Getting Started"
          title="How it works"
          lead="From sign-up to exam day."
        />
        <div className="cine-text-grid cine-text-grid--4">
          {PROGRAM_STEPS.map(({ n, title, body }) => (
            <article key={n} className="cine-text-block">
              <div className="cine-step-num">{n}</div>
              <h3 className="lp-h3">{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </CinematicSection>

      <CinematicSection theme="testimonials" align="left" ariaLabel="Candidate testimonials">
        <CinematicSectionHead kicker="From Candidates" title={testimonialHeading} />
        <div className="cine-text-grid cine-text-grid--3">
          {testimonials.map(({ text, name, city }) => (
            <article key={name} className="cine-quote-block">
              <blockquote>{text}</blockquote>
              <div className="cine-testimonial-name">{name}</div>
              <div className="cine-testimonial-role">{city}, Pakistan</div>
            </article>
          ))}
        </div>
      </CinematicSection>

      <CinematicSection theme="cta" align="center" ariaLabel="Start preparing">
        <CinematicSectionHead
          align="center"
          kicker="Start Preparing"
          title={track === "fcps" ? "FCPS-1 question bank" : "JCAT (MDMS) question bank"}
          lead="Full explanations for every option."
        />
        <div className="cine-cta-row">
          <button type="button" className="hero-btn-primary" onClick={onBeginPrep}>
            {beginLabel}
          </button>
          <button type="button" className="hero-btn-ghost" onClick={onOpenDemo}>
            View sample questions
          </button>
        </div>
      </CinematicSection>

      <CinematicSection id="faq" theme="faq" align="left" ariaLabel="FAQ">
        <CinematicSectionHead kicker={faqEyebrow} title="Common questions" />
        <div className="cine-faq-list">
          {PROGRAM_FAQS[track].map((item, i) => (
            <div key={item.q} className="cine-faq-item">
              <button
                type="button"
                className="cine-faq-trigger"
                aria-expanded={faqOpen === i}
                onClick={() => setFaqOpen(faqOpen === i ? -1 : i)}
              >
                <span>{item.q}</span>
                <span aria-hidden>+</span>
              </button>
              {faqOpen === i ? <p className="cine-faq-answer">{item.a}</p> : null}
            </div>
          ))}
        </div>
      </CinematicSection>

      <CinematicSection theme="mission" align="center" ariaLabel="Explore other program">
        <div className="cine-cross-sell">
          <p>Also preparing for {otherTrackLabel}?</p>
          <button type="button" className="hero-btn-ghost" onClick={onExploreOther}>
            Explore {otherTrackLabel}
          </button>
        </div>
      </CinematicSection>
    </>
  );
}
