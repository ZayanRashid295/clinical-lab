export default function Icon({ name, size = 18 }) {
  const stroke = { width: size, height: size, fill: "none", stroke: "var(--teal)", strokeWidth: 2.4, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (name) {
    case "check":
      return <svg viewBox="0 0 24 24" {...stroke}><path d="M20 6L9 17l-5-5" /></svg>;
    case "star":
      return <svg viewBox="0 0 24 24" width={size} height={size} fill="var(--gold)" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z" /></svg>;
    case "left":
      return <svg viewBox="0 0 24 24" width={size + 2} height={size + 2} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>;
    case "right":
      return <svg viewBox="0 0 24 24" width={size + 2} height={size + 2} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>;
    case "chevronDown":
      return <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>;
    case "close":
      return <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>;
    case "zoom":
      return <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3M11 8v6M8 11h6" /></svg>;
    case "menu":
      return <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M3 12h18M3 18h18" /></svg>;
    case "quote":
      return <svg viewBox="0 0 24 24" width={size + 4} height={size + 4} fill="var(--line)" stroke="none"><path d="M9.5 7C6.5 8.2 5 10.4 5 13.2c0 2.4 1.6 4 3.6 4 1.7 0 3-1.3 3-3s-1.2-2.8-2.7-2.8c-.2 0-.4 0-.6.1.3-1.6 1.7-3 3.4-3.6L9.5 7zm9 0c-3 1.2-4.5 3.4-4.5 6.2 0 2.4 1.6 4 3.6 4 1.7 0 3-1.3 3-3s-1.2-2.8-2.7-2.8c-.2 0-.4 0-.6.1.3-1.6 1.7-3 3.4-3.6L18.5 7z" /></svg>;
    default:
      return null;
  }
}