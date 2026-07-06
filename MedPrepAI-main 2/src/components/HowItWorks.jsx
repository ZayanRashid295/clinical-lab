const STEPS = [
  { title: "Create your account", desc: "Pick FCPS-1 or JCAT (MDMS) and set up your profile." },
  { title: "Practice questions", desc: "Work through scenario MCQs at exam difficulty." },
  { title: "Read explanations", desc: "Review why each option is right or wrong." },
  { title: "Track progress", desc: "Use dashboards to spot weak areas and trends." },
];

export default function HowItWorks() {
  return (
    <section className="section" id="how-it-works">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow center">Getting Started</span>
          <h2>How it works</h2>
          <p>From sign-up to exam day.</p>
        </div>
        <div className="steps">
          {STEPS.map((s, i) => (
            <div key={s.title}>
              <div className="step-num">{i + 1}</div>
              <h3 style={{ fontSize: "1rem", marginBottom: 6 }}>{s.title}</h3>
              <p style={{ color: "var(--slate)", fontSize: "0.88rem", lineHeight: 1.6 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
