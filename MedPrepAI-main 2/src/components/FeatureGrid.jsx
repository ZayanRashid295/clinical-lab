import Icon from "./Icons";

// layout: "grid" (4-up cards, used on Home "What you get")
//         "strip" (bordered row, used on program pages "Built into every question")
export default function FeatureGrid({ items, layout = "grid" }) {
  if (layout === "strip") {
    return (
      <div className="strip">
        {items.map((it) => (
          <div key={it.title}>
            <div className="card-icon"><Icon name="check" /></div>
            <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>{it.title}</div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="grid-4">
      {items.map((it) => (
        <div className="card" key={it.title}>
          <div className="card-icon"><Icon name="check" /></div>
          <h3>{it.title}</h3>
          <p>{it.desc}</p>
        </div>
      ))}
    </div>
  );
}
