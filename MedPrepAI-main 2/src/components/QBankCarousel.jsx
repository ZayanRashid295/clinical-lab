import { useState } from "react";
import Icon from "./Icons";
import ZoomableImage from "./ZoomableImage";

export default function QBankCarousel({ images }) {
  const [index, setIndex] = useState(0);
  const len = images.length;

  const go = (dir) => setIndex((i) => (i + dir + len) % len);

  const relPosition = (i) => {
    let offset = i - index;
    if (offset > len / 2) offset -= len;
    if (offset < -len / 2) offset += len;
    return offset;
  };

  return (
    <div>
      <div className="qbank-carousel">
        <button className="qbank-arrow left" onClick={() => go(-1)} aria-label="Previous screenshot">
          <Icon name="left" />
        </button>

        <div className="qbank-stage">
          {images.map((img, i) => {
            const rel = relPosition(i);
            let cls = "qbank-slide is-hidden";
            if (rel === 0) cls = "qbank-slide is-center";
            else if (rel === -1) cls = "qbank-slide is-prev";
            else if (rel === 1) cls = "qbank-slide is-next";

            if (rel === 0) {
              return (
                <div key={i} className={cls}>
                  <ZoomableImage src={img.src} alt={img.alt} />
                </div>
              );
            }
            return (
              <div key={i} className={cls} onClick={() => setIndex(i)}>
                <img src={img.src} alt={img.alt} />
              </div>
            );
          })}
        </div>

        <button className="qbank-arrow right" onClick={() => go(1)} aria-label="Next screenshot">
          <Icon name="right" />
        </button>
      </div>

      <div className="qbank-dots">
        {images.map((_, i) => (
          <button key={i} className={`qbank-dot ${i === index ? "active" : ""}`} onClick={() => setIndex(i)} aria-label={`Go to screenshot ${i + 1}`} />
        ))}
      </div>
    </div>
  );
}