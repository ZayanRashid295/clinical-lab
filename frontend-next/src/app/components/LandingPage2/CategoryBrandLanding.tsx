"use client";

import {
  CATEGORIES,
  type ExamTrack,
} from "./landing-v2-data";
import { LandingV2Chrome, type LandingV2ChromeActions } from "./landing-v2-chrome";
import { CinematicSection } from "../hero-sequence";
import { CinematicSectionHead } from "./cinematic-section-head";
import {
  CinematicHero,
  CinematicHeroContent,
} from "../hero-sequence";

export interface CategoryBrandActions extends LandingV2ChromeActions {
  onNavigateToCategory: (category: ExamTrack) => void;
}

export function CategoryBrandLanding({
  category,
  actions,
}: {
  category: ExamTrack;
  actions: CategoryBrandActions;
}) {
  const cfg = CATEGORIES[category];
  const other: ExamTrack = category === "fcps" ? "jcat" : "fcps";

  return (
    <LandingV2Chrome
      activePage={category}
      actions={actions}
      cinematicNav
      footerBlurb="Postgraduate medical examination preparation for FCPS-1 and JCAT (MDMS). Every option explained. Built for clinical excellence."
      footerBottomNote="Trusted for FCPS-1 & JCAT Preparation · Pakistan"
    >
      <div className="lp-program">
        <CinematicHero layout="program" sectionId={category} ariaLabel={`${cfg.label} category`}>
          <CinematicHeroContent
            kicker="Exam category"
            title={
              <>
                {cfg.heroTitle}
                <br />
                products
              </>
            }
            subtitle={cfg.heroSubtitle}
            primaryCta={{
              label: `Explore ${cfg.products[0].label}`,
              onClick: () => actions.onNavigateToProgram(category, cfg.products[0].slug),
            }}
            secondaryCta={{
              label: `See ${CATEGORIES[other].label}`,
              onClick: () => actions.onNavigateToCategory(other),
            }}
          />
        </CinematicHero>

        <div className="landing-content-bridge lp-cinematic-body">
          <CinematicSection id="products" theme="mission" align="left" ariaLabel={`${cfg.label} products`}>
            <CinematicSectionHead
              kicker="Products"
              title={
                <>
                  Choose your <span>{cfg.label}</span> track
                </>
              }
              lead="Each product is scoped to a specialty pathway — open Medicine and Allied to start with the current exam-ready QBank."
            />
            <div className="cine-text-grid cine-text-grid--2">
              {cfg.products.map((product) => (
                <button
                  key={product.slug}
                  type="button"
                  className="cine-category-pick"
                  onClick={() => actions.onNavigateToProgram(category, product.slug)}
                >
                  <span className="cine-category-kicker">{cfg.label}</span>
                  <h3 className="lp-h3">{product.label}</h3>
                  <p>{product.blurb}</p>
                  <span className="cine-category-cta">Open product →</span>
                </button>
              ))}
            </div>
          </CinematicSection>

          <CinematicSection id="how-it-works" theme="workflow" align="left" ariaLabel="How preparation works">
            <CinematicSectionHead
              kicker="How it works"
              title={
                <>
                  From category to <span>exam day</span>
                </>
              }
              lead="Pick a product, practise with every option explained, and track what still needs work."
            />
            <div className="cine-text-grid cine-text-grid--3">
              {[
                {
                  n: "01",
                  title: "Select a product",
                  body: `Start with ${cfg.products[0].label} for your ${cfg.label} pathway.`,
                },
                {
                  n: "02",
                  title: "Practise with clarity",
                  body: "Work scenario MCQs at exam difficulty with full option-level reasoning.",
                },
                {
                  n: "03",
                  title: "Measure progress",
                  body: "Use analytics to find weak topics and close gaps before the real paper.",
                },
              ].map(({ n, title, body }) => (
                <article key={n} className="cine-text-block">
                  <div className="cine-step-num">{n}</div>
                  <h3 className="lp-h3">{title}</h3>
                  <p>{body}</p>
                </article>
              ))}
            </div>
          </CinematicSection>

          <CinematicSection id="faq" theme="cta" align="center" ariaLabel="Get started">
            <CinematicSectionHead
              align="center"
              kicker="Ready when you are"
              title={`Begin ${cfg.label} with Medicine and Allied`}
              lead="Open the product page to see the QBank, resources, and sample questions."
            />
            <div className="cine-cta-row">
              <button
                type="button"
                className="hero-btn-primary"
                onClick={() => actions.onNavigateToProgram(category, "medicine-and-allied")}
              >
                Open Medicine and Allied
              </button>
            </div>
          </CinematicSection>
        </div>
      </div>
    </LandingV2Chrome>
  );
}
