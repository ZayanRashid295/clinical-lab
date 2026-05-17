"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  X,
} from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { DEMO_SCENES } from "./demo-registry";

export { DEMO_SCENES, DEMO_TOTAL_MS } from "./demo-registry";
export { useCountUp, useDelayedFlag, useTypewriter } from "./demo-hooks";

export interface DemoVideoProps {
  onExit: () => void;
}

export function DemoVideo({ onExit }: DemoVideoProps) {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hideChrome, setHideChrome] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const elapsedRef = useRef(0);
  const lastTsRef = useRef<number | null>(null);
  const playingRef = useRef(playing);

  const scene = DEMO_SCENES[sceneIndex]!;
  const SceneComponent = scene.Component;

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  useEffect(() => {
    elapsedRef.current = 0;
    lastTsRef.current = null;
    setProgress(0);
  }, [sceneIndex]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const goNext = useCallback(() => {
    setSceneIndex((i) => Math.min(i + 1, DEMO_SCENES.length - 1));
  }, []);

  const goPrev = useCallback(() => {
    setSceneIndex((i) => Math.max(i - 1, 0));
  }, []);

  const restart = useCallback(() => {
    setSceneIndex(0);
    setPlaying(true);
  }, []);

  const jumpTo = useCallback((index: number) => {
    setSceneIndex(Math.max(0, Math.min(index, DEMO_SCENES.length - 1)));
    setPlaying(true);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const el = rootRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      /* unsupported */
    }
  }, []);

  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key) {
        case "ArrowRight":
          e.preventDefault();
          if (sceneIndex < DEMO_SCENES.length - 1) goNext();
          break;
        case "ArrowLeft":
          e.preventDefault();
          goPrev();
          break;
        case " ":
          e.preventDefault();
          setPlaying((p) => !p);
          break;
        case "r":
        case "R":
          restart();
          break;
        case "h":
        case "H":
          setHideChrome((h) => !h);
          break;
        case "n":
        case "N":
          setShowNotes((n) => !n);
          break;
        case "f":
        case "F":
          void toggleFullscreen();
          break;
        case "Escape":
          if (document.fullscreenElement) {
            void document.exitFullscreen();
          } else {
            onExit();
          }
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sceneIndex, goNext, goPrev, restart, onExit, toggleFullscreen]);

  useEffect(() => {
    let raf = 0;
    const loop = (ts: number) => {
      if (lastTsRef.current === null) {
        lastTsRef.current = ts;
      } else if (playingRef.current) {
        const delta = ts - lastTsRef.current;
        elapsedRef.current += delta;
        const p = Math.min(elapsedRef.current / scene.duration, 1);
        setProgress(p);
        if (elapsedRef.current >= scene.duration) {
          elapsedRef.current = 0;
          setSceneIndex((i) => {
            if (i < DEMO_SCENES.length - 1) return i + 1;
            setPlaying(false);
            playingRef.current = false;
            return i;
          });
        }
      }
      if (playingRef.current) lastTsRef.current = ts;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [sceneIndex, scene.duration]);

  const chromeVisible = !hideChrome;

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[200] flex flex-col bg-demo-950"
      role="dialog"
      aria-modal="true"
      aria-label="Product demo walkthrough"
    >
      {chromeVisible && (
        <div className="absolute left-0 right-0 top-0 z-30 flex gap-0.5 px-1 pt-1">
          {DEMO_SCENES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => jumpTo(i)}
              className="group relative h-1 flex-1 overflow-hidden rounded-full bg-white/15"
              aria-label={`Scene ${i + 1}: ${s.title}`}
            >
              <span
                className={cn(
                  "absolute inset-y-0 left-0 bg-red-500 transition-[width] duration-75",
                  i < sceneIndex && "w-full",
                  i > sceneIndex && "w-0",
                )}
                style={
                  i === sceneIndex ? { width: `${progress * 100}%` } : undefined
                }
              />
            </button>
          ))}
        </div>
      )}

      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div className="absolute inset-0 h-full w-full">
          <SceneComponent key={scene.id} />
        </div>
      </div>

      {showNotes && chromeVisible && (
        <div className="absolute bottom-20 left-4 right-4 z-30 mx-auto max-w-2xl rounded-xl border border-red-500/20 bg-demo-900/95 p-4 text-xl text-zinc-200 shadow-xl shadow-black/40 backdrop-blur sm:left-8 sm:right-auto sm:max-w-md sm:text-2xl">
          <p className="mb-1 text-lg font-bold uppercase tracking-wider text-red-400 sm:text-xl">
            Presenter notes · {scene.title}
          </p>
          <p className="leading-relaxed">{scene.notes}</p>
        </div>
      )}

      {chromeVisible && (
        <div className="absolute bottom-0 left-0 right-0 z-30 flex flex-wrap items-center justify-between gap-2 border-t border-red-950/50 bg-demo-950/90 px-3 py-2 backdrop-blur-md sm:px-4">
          <div className="flex items-center gap-1">
            <ControlBtn onClick={goPrev} disabled={sceneIndex === 0} label="Previous">
              <ChevronLeft className="h-4 w-4" />
            </ControlBtn>
            <ControlBtn onClick={() => setPlaying((p) => !p)} label={playing ? "Pause" : "Play"}>
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </ControlBtn>
            <ControlBtn onClick={goNext} disabled={sceneIndex >= DEMO_SCENES.length - 1} label="Next">
              <ChevronRight className="h-4 w-4" />
            </ControlBtn>
            <ControlBtn onClick={restart} label="Restart">
              <RotateCcw className="h-4 w-4" />
            </ControlBtn>
          </div>

          <p className="hidden text-lg text-zinc-400 sm:block sm:text-xl">
            {sceneIndex + 1} / {DEMO_SCENES.length} · {scene.title}
          </p>

          <div className="flex items-center gap-1">
            <ControlBtn onClick={() => setShowHelp((h) => !h)} label="Shortcuts" active={showHelp}>
              <HelpCircle className="h-4 w-4" />
            </ControlBtn>
            <ControlBtn onClick={() => setShowNotes((n) => !n)} label="Notes" active={showNotes}>
              <span className="text-[14px] font-bold">N</span>
            </ControlBtn>
            <ControlBtn onClick={() => setHideChrome((h) => !h)} label="Hide UI" active={hideChrome}>
              <span className="text-[14px] font-bold">H</span>
            </ControlBtn>
            <ControlBtn onClick={() => void toggleFullscreen()} label="Fullscreen">
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </ControlBtn>
            <ControlBtn onClick={onExit} label="Exit">
              <X className="h-4 w-4" />
            </ControlBtn>
          </div>
        </div>
      )}

      {showHelp && chromeVisible && (
        <div className="absolute bottom-16 right-3 z-40 w-64 rounded-lg border border-red-500/15 bg-demo-900 p-3 text-lg text-zinc-300 shadow-xl sm:right-4 sm:text-xl">
          <p className="mb-2 font-semibold text-white">Keyboard</p>
          <ul className="space-y-1">
            <li>← → Previous / next</li>
            <li>Space Play / pause</li>
            <li>R Restart</li>
            <li>H Hide UI</li>
            <li>N Presenter notes</li>
            <li>F Fullscreen</li>
            <li>Esc Exit</li>
          </ul>
        </div>
      )}

      {hideChrome && (
        <button
          type="button"
          onClick={() => setHideChrome(false)}
          className="absolute bottom-3 right-3 z-30 rounded-lg bg-demo-900/60 px-2 py-1 text-[14px] text-zinc-500 opacity-0 hover:opacity-100 focus:opacity-100"
        >
          Show controls (H)
        </button>
      )}
    </div>
  );
}

function ControlBtn({
  children,
  onClick,
  label,
  disabled,
  active,
}: {
  children: ReactNode;
  onClick: () => void;
  label: string;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-lg text-zinc-300 transition-colors",
        "hover:bg-red-500/15 hover:text-white disabled:opacity-30",
        active && "bg-red-600/30 text-red-300",
      )}
    >
      {children}
    </button>
  );
}
