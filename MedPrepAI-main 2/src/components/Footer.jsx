import logo from "../assets/logo-icon.png";

export default function Footer({ setPage }) {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div>
          <div className="footer-brand">
            <span className="brand-mark"><img src={logo} alt="MedPrepAI" /></span>
            <strong style={{ fontFamily: "Georgia, serif" }}>MedPrepAI</strong>
          </div>
          <p style={{ color: "var(--slate)", fontSize: "0.88rem", lineHeight: 1.7, maxWidth: 320 }}>
            Postgraduate medical examination preparation for FCPS-1 and JCAT (MDMS). Every option explained. Built for clinical excellence.
          </p>
        </div>
        <div className="footer-col">
          <h4>Exam Tracks</h4>
          <a onClick={() => setPage("fcps")} style={{ cursor: "pointer" }}>FCPS-1 (Medicine & Allied)</a>
          <a onClick={() => setPage("jcat")} style={{ cursor: "pointer" }}>JCAT (MDMS) (Medicine & Allied)</a>
        </div>
        <div className="footer-col">
          <h4>Account</h4>
          <a href="#">Sign in</a>
          <a href="#faq">FAQ</a>
        </div>
      </div>
      <div className="footer-bottom">
        © 2026 MedPrepAI. All rights reserved. · Trusted for FCPS-1 & JCAT Preparation · Pakistan
      </div>
    </footer>
  );
}
