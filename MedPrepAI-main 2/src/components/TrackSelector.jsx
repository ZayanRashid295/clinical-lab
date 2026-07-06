import fcpsImg from "../assets/doctor-patient-screen.png";
import jcatImg from "../assets/faculty-analytics-dashboard.png";

export default function TrackSelector({ setPage }) {
  const tracks = [
    { key: "fcps", title: "FCPS-1", sub: "Medicine & Allied", alt: "FCPS-1 track", img: fcpsImg },
    { key: "jcat", title: "JCAT (MDMS)", sub: "Medicine & Allied", alt: "JCAT (MDMS) track", img: jcatImg },
  ];
  return (
    <section className="section section-surface">
      <div className="wrap">
        <div className="section-head">
          <span className="eyebrow center">Examination Tracks</span>
          <h2>Choose your exam</h2>
          <p>FCPS-1 and JCAT (MDMS) tracks with scenario-based questions, full explanations, and performance tracking.</p>
        </div>
        <div className="grid-2">
          {tracks.map((t) => (
            <div className="track-card" key={t.key} onClick={() => setPage(t.key)} style={{ cursor: "pointer" }}>
              <div className="shot shot-4-3"><img src={t.img} alt={t.alt} /></div>
              <div className="track-card-body">
                <h3 style={{ fontSize: "1.1rem", marginBottom: 4 }}>{t.title}</h3>
                <p style={{ color: "var(--slate)", fontSize: "0.85rem" }}>{t.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
