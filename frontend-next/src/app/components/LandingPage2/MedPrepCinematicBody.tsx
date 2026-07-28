"use client";

import { useState } from "react";
import { CinematicSection } from "../hero-sequence";
import { CinematicSectionHead } from "./cinematic-section-head";
import { CATEGORIES, type ExamTrack } from "./landing-v2-data";

const PILLARS = [
  {
    title: "Built for High-Stakes Exams",
    body: "Content matches real exam difficulty and format — so every practice session feels like the real thing, not a warm-up.",
  },
  {
    title: "Every Option Explained",
    body: "Each question breaks down every choice — correct and incorrect — so you build understanding, not memorisation.",
  },
  {
    title: "Reasoning Over Rote Learning",
    body: "Scenario-based questions train you to think through problems — the skill that separates top scorers from the rest.",
  },
  {
    title: "Analytics That Show the Gap",
    body: "Live dashboards reveal exactly where you're strong, where you're slipping, and what to tackle before exam day.",
  },
];

const STEPS = [
  { n: "01", title: "Create Your Account", body: "Register and set up your study profile in under a minute." },
  { n: "02", title: "Practice Questions", body: "Work through scenario-based questions with every option explained at real exam difficulty." },
  { n: "03", title: "Review Explanations", body: "Study the reasoning behind every correct and incorrect answer until the logic sticks." },
  { n: "04", title: "Track Your Progress", body: "Use live dashboards to find weak spots, measure improvement, and focus where it matters." },
];

const TESTIMONIALS = [
  { text: "The every-option-explained approach changed how I study. I finally understand why wrong answers are wrong — not just which bubble to fill.", name: "Ayesha K.", role: "Exam Candidate" },
  { text: "The question bank feels exactly like the real test. My confidence shot up after just a few weeks of daily practice.", name: "Hassan R.", role: "Advanced Learner" },
  { text: "Analytics showed me my weakest subjects in the first week. I focused there and saw a measurable score jump within a month.", name: "Fatima N.", role: "Dedicated Prep Student" },
];

const FAQ_DATA = [
  { q: "What is MedPrepAI?", a: "MedPrepAI is an AI-powered exam preparation platform. We combine scenario-based question banks with full option-level explanations and performance analytics — so you understand the material, not just the answers." },
  { q: "What does 'Every Option Explained' mean?", a: "For every question, we explain not only the correct answer but each incorrect option as well. You learn why something is wrong — not just what to pick." },
  { q: "How many questions are available?", a: "Our question banks contain over 3,000 fully explained questions, all set at exam-level difficulty and organised by subject and topic." },
  { q: "Is a free trial available?", a: "Yes. You can access a curated selection of sample questions at no cost before committing to a full subscription plan." },
  { q: "What does the performance analytics feature include?", a: "Analytics include subject-wise breakdowns, time-per-question tracking, and improvement trends across sessions — giving you a clear, actionable picture of your progress." },
];

export interface MedPrepCinematicBodyProps {
  onStartTrial: () => void;
  onScrollToHowItWorks: () => void;
  onNavigateToCategory: (category: ExamTrack) => void;
  isAuthenticated: boolean;
}

export function MedPrepCinematicBody({
  onStartTrial,
  onScrollToHowItWorks,
  onNavigateToCategory,
  isAuthenticated,
}: MedPrepCinematicBodyProps) {
  const [faqOpen, setFaqOpen] = useState(0);

  return (
    <>
      <CinematicSection id="categories" theme="mission" align="left" ariaLabel="Exam categories">
        <CinematicSectionHead
          kicker="Choose Your Path"
          title={
            <>
              Prep Tracks Built for <span>High-Stakes Exams</span>
            </>
          }
          lead="Open a category to explore product suites designed for your exam."
        />
        <div className="cine-text-grid cine-text-grid--2">
          {(Object.keys(CATEGORIES) as ExamTrack[]).map((id) => {
            const cat = CATEGORIES[id];
            return (
              <button
                key={id}
                type="button"
                className="cine-category-pick"
                onClick={() => onNavigateToCategory(id)}
              >
                <span className="cine-category-kicker">Category</span>
                <h3 className="lp-h3">{cat.label}</h3>
                <p>{cat.landingBlurb}</p>
                <span className="cine-category-cta">Explore {cat.label} →</span>
              </button>
            );
          })}
        </div>
      </CinematicSection>

      <CinematicSection id="why-us" theme="distinction" align="left" ariaLabel="What sets MedPrepAI apart">
        <CinematicSectionHead
          kicker="Our Distinction"
          title={
            <>
              What Sets <span>MedPrepAI</span> Apart
            </>
          }
          lead="Four reasons learners switch — and stay."
        />
        <div className="cine-text-grid cine-text-grid--2">
          {PILLARS.map(({ title, body }) => (
            <article key={title} className="cine-text-block">
              <h3 className="lp-h3">{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </CinematicSection>

      <CinematicSection id="how-it-works" theme="workflow" align="left" ariaLabel="How MedPrepAI works">
        <CinematicSectionHead
          kicker="Preparation Workflow"
          title={
            <>
              How <span>MedPrepAI</span> Works
            </>
          }
          lead="Four steps from sign-up to exam-day confidence."
        />
        <div className="cine-text-grid cine-text-grid--4">
          {STEPS.map(({ n, title, body }) => (
            <article key={n} className="cine-text-block">
              <div className="cine-step-num">{n}</div>
              <h3 className="lp-h3">{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </CinematicSection>

      <CinematicSection theme="testimonials" align="left" ariaLabel="Testimonials">
        <CinematicSectionHead
          kicker="Testimonials"
          title="Trusted by Serious Learners"
          lead="Real results from people who stopped guessing and started comprehending."
        />
        <div className="cine-text-grid cine-text-grid--3">
          {TESTIMONIALS.map(({ text, name, role }) => (
            <article key={name} className="cine-quote-block">
              <blockquote>{text}</blockquote>
              <div className="cine-testimonial-name">{name}</div>
              <div className="cine-testimonial-role">{role}</div>
            </article>
          ))}
        </div>
      </CinematicSection>

      <CinematicSection id="pricing" theme="cta" align="center" ariaLabel="Get started">
        <CinematicSectionHead
          align="center"
          kicker="Ready when you are"
          title="Your Next Score Starts Here"
          lead="Join thousands of learners who prep with clarity — not chaos."
        />
        <div className="cine-cta-row">
          <button type="button" className="hero-btn-primary" onClick={onStartTrial}>
            {isAuthenticated ? "Open question bank" : "Create your account"}
          </button>
          <button type="button" className="hero-btn-ghost" onClick={onScrollToHowItWorks}>
            See how it works
          </button>
        </div>
      </CinematicSection>

      <CinematicSection id="faq" theme="faq" align="left" ariaLabel="Frequently asked questions">
        <CinematicSectionHead
          kicker="Frequently Asked Questions"
          title={
            <>
              Common <span>Questions</span>
            </>
          }
          lead="Answers to the questions learners ask most before they start preparing."
        />
        <div className="cine-faq-list">
          {FAQ_DATA.map((item, i) => (
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
    </>
  );
}
