"use client";

export function LandingLightboxClose({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="landing-v2-lightbox-close"
      onClick={onClick}
      aria-label="Close preview"
    >
      <svg
        viewBox="0 0 24 24"
        width={20}
        height={20}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M18 6L6 18M6 6l12 12" />
      </svg>
    </button>
  );
}
