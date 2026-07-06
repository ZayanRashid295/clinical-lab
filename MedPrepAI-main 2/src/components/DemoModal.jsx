import Btn from "./Button";
import Icon from "./Icons";

export default function DemoModal({ badge, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
        <div className="modal-brand">
          <span className="brand-mark" />
          <span style={{ fontFamily: "Georgia, serif", fontWeight: 600 }}>MedPrepAI</span>
        </div>
        <h3 className="modal-title">Complete the form to explore MedPrepAI's {badge} demo</h3>

        <div className="field-row">
          <label className="field">First Name <span className="required">*</span><input /></label>
          <label className="field">Last Name <span className="required">*</span><input /></label>
        </div>
        <div className="field-row">
          <label className="field">Email <span className="required">*</span><input /></label>
          <label className="field">Graduating Year <span className="required">*</span>
            <select>
              <option>Please select...</option>
              <option>2026</option><option>2027</option><option>2028</option><option>2029</option><option>Already Graduated</option>
            </select>
          </label>
        </div>
        <label className="field" style={{ marginBottom: 22, display: "block" }}>Country
          <select>
            <option>Please select...</option>
            <option>Pakistan</option><option>Other</option>
          </select>
        </label>

        <Btn size="lg" onClick={onClose}>Submit</Btn>
      </div>
    </div>
  );
}
