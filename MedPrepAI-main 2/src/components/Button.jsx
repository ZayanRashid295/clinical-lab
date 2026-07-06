export default function Btn({ variant = "primary", size = "md", children, onClick, type = "button" }) {
  const cls = `btn ${variant === "ghost" ? "btn-ghost" : "btn-primary"} ${size === "lg" ? "btn-lg" : ""}`;
  return (
    <button type={type} onClick={onClick} className={cls}>
      {children}
    </button>
  );
}
