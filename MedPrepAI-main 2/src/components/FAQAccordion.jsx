import { useState } from "react";
import Icon from "./Icons";

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="faq-item">
      <button className="faq-q" onClick={() => setOpen(!open)}>
        {q}
        <span className={`faq-chevron ${open ? "open" : ""}`}><Icon name="chevronDown" /></span>
      </button>
      {open && <p className="faq-a">{a}</p>}
    </div>
  );
}

export default function FAQAccordion({ items, eyebrow = "FAQ" }) {
  return (
    <section className="section" id="faq">
      <div className="wrap" style={{ maxWidth: 760 }}>
        <div className="section-head">
          <span className="eyebrow center">{eyebrow}</span>
          <h2>Common questions</h2>
          <p>Before you start preparing.</p>
        </div>
        <div>
          {items.map((item) => <FAQItem key={item.q} {...item} />)}
        </div>
      </div>
    </section>
  );
}
