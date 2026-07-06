import ZoomableImage from "./ZoomableImage";

export default function ResourceGrid({ items }) {
  return (
    <div className="resource-grid">
      {items.map((it) => (
        <div className="resource-card" key={it.title}>
          <div className="shot"><ZoomableImage src={it.img} alt={it.alt} /></div>
          <div className="resource-card-body">
            <h3>{it.title}</h3>
            <p>{it.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}