import { useState } from "react";
import Btn from "./Button";
import Icon from "./Icons";
import logo from "../assets/logo-icon.png";

export default function Header({ page, setPage }) {
  const [open, setOpen] = useState(false);

  const go = (p) => { setPage(p); setOpen(false); };

  // "How It Works" and "FAQ" are anchor sections that exist on every page,
  // so a plain hash link scrolls to them on whichever page is currently shown.
  const goAnchor = () => setOpen(false);

  return (
    <header className="site-header">
      <nav>
        <button className="brand" onClick={() => go("home")}>
          <span className="brand-mark"><img src={logo} alt="MedPrepAI" /></span>
          MedPrepAI
        </button>

        <div className="nav-links">
          <button onClick={() => go("home")} className={page === "home" ? "active" : ""}>Home</button>
          <button onClick={() => go("fcps")} className={page === "fcps" ? "active" : ""}>FCPS-1</button>
          <button onClick={() => go("jcat")} className={page === "jcat" ? "active" : ""}>JCAT (MDMS)</button>
          <a href="#how-it-works" onClick={goAnchor}>How It Works</a>
          <a href="#faq" onClick={goAnchor}>FAQ</a>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Btn>Start Free Trial</Btn>
          <button className="nav-mobile-toggle" onClick={() => setOpen(!open)} aria-label="Menu">
            <Icon name={open ? "close" : "menu"} />
          </button>
        </div>
      </nav>

      {open && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "8px 24px 16px", borderTop: "1px solid var(--line)" }}>
          <button onClick={() => go("home")} style={{ textAlign: "left", padding: "10px 4px", background: "none", border: "none", fontSize: "0.95rem", color: page === "home" ? "var(--ink)" : "var(--slate)" }}>Home</button>
          <button onClick={() => go("fcps")} style={{ textAlign: "left", padding: "10px 4px", background: "none", border: "none", fontSize: "0.95rem", color: page === "fcps" ? "var(--ink)" : "var(--slate)" }}>FCPS-1</button>
          <button onClick={() => go("jcat")} style={{ textAlign: "left", padding: "10px 4px", background: "none", border: "none", fontSize: "0.95rem", color: page === "jcat" ? "var(--ink)" : "var(--slate)" }}>JCAT (MDMS)</button>
          <a href="#how-it-works" onClick={goAnchor} style={{ padding: "10px 4px", fontSize: "0.95rem", color: "var(--slate)" }}>How It Works</a>
          <a href="#faq" onClick={goAnchor} style={{ padding: "10px 4px", fontSize: "0.95rem", color: "var(--slate)" }}>FAQ</a>
        </div>
      )}
    </header>
  );
}
