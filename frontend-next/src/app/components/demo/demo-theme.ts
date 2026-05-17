/**
 * Demo palette — black base + red accents (presentation theme).
 */
export const DEMO_SCENE_TONE = "dark" as const;

export const demoTheme = {
  shell: "bg-demo-950 text-white",
  mesh: "demo-bg-mesh",
  tag: "border-red-500/35 bg-red-950/50 text-red-200 backdrop-blur-sm",
  card: "rounded-2xl border border-red-500/20 bg-red-950/25 shadow-xl shadow-black/60 backdrop-blur-sm",
  cardCompact: "rounded-xl border border-red-500/15 bg-red-950/20 backdrop-blur-sm",
  headline: "text-white",
  body: "text-zinc-300",
  muted: "text-zinc-400",
  stat: "demo-text-gradient",
  pillPrimary: "border-red-400/35 bg-red-500/15 text-red-100",
  pillSecondary: "border-red-800/40 bg-red-950/60 text-red-200/90",
  bullet: "bg-red-500",
  accent: "text-red-400",
  frame: "border-red-950/60 bg-black ring-red-500/10",
  frameChrome: "border-red-950/80 bg-red-950/90",
} as const;

/** Layout + sizing for demo visuals */
export const demoDiagram = {
  frameLarge:
    "max-w-none h-full min-h-[min(62vh,500px)] lg:min-h-[min(86vh,840px)]",
  frameBody: "flex min-h-0 flex-1 flex-col p-5 sm:p-6 lg:p-8 xl:p-9",
  innerGrid:
    "grid min-h-[min(56vh,420px)] flex-1 gap-3 sm:grid-cols-5 lg:min-h-[min(74vh,580px)] lg:gap-4",
  innerFlex:
    "flex min-h-[min(56vh,420px)] flex-1 flex-col gap-4 sm:flex-row sm:gap-6 lg:min-h-[min(74vh,580px)] lg:gap-8",
  innerStack: "min-h-[min(56vh,420px)] flex-1 lg:min-h-[min(74vh,580px)]",
  modeLayoutGrid:
    "lg:grid-cols-[minmax(11rem,20%)_1fr] xl:grid-cols-[minmax(12rem,18%)_1fr]",
  visualSlot: "flex min-h-0 w-full min-w-0 flex-1 items-center justify-center",
  visualFull: "w-full max-w-[min(98vw,90rem)]",
  visualMedium: "w-full max-w-[min(98vw,52rem)]",
  frameMode: "h-auto w-full min-h-0",
  frameModeBody: "p-4 sm:p-5 lg:p-6",
  innerGridMode:
    "grid min-h-[min(40vh,320px)] gap-3 sm:grid-cols-5 sm:min-h-[min(44vh,360px)]",
  innerFlexMode:
    "flex min-h-[min(40vh,320px)] flex-col gap-4 sm:flex-row sm:gap-6 sm:min-h-[min(44vh,360px)]",
  modeSnapshotScale: "w-full max-w-[min(98vw,90rem)]",
  modeSnapshotSlot: "flex min-h-0 w-full min-w-0 flex-1 items-center justify-center",
  hubUiSlot: "flex min-h-0 w-full flex-1 items-center justify-center",
  hubUiScale: "w-full max-w-[min(98vw,90rem)]",
  hubUiScaleCompact: "w-full max-w-[min(98vw,52rem)]",
  snapshotColumn:
    "flex min-h-[min(60vh,480px)] w-full min-w-0 items-stretch lg:min-h-0 lg:h-full",
  platformModuleCard:
    "min-h-[min(46vh,22rem)] sm:min-h-[min(52vh,26rem)] lg:min-h-[min(54vh,30rem)]",
} as const;
