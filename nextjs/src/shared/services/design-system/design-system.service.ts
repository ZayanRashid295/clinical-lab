export type DesignSystem =
  | "glassmorphic"
  | "minimalistic"
  | "skeumorphic"
  | "neumorphic";

export interface DesignSystemConfig {
  name: string;
  description: string;
  icon: string;
  cssClasses: {
    container: string;
    card: string;
    button: string;
    input: string;
    modal: string;
    shadow: string;
    border: string;
    background: string;
  };
}

export const DESIGN_SYSTEMS: Record<DesignSystem, DesignSystemConfig> = {
  glassmorphic: {
    name: "Glassmorphic",
    description: "Frosted glass effect with transparency and blur",
    icon: "🔮",
    cssClasses: {
      container: "backdrop-blur-md bg-white/10 dark:bg-gray-900/10",
      card: "backdrop-blur-lg bg-white/20 dark:bg-gray-800/20 border border-white/20 dark:border-gray-700/20",
      button:
        "backdrop-blur-sm bg-white/30 dark:bg-gray-700/30 border border-white/30 dark:border-gray-600/30 hover:bg-white/40 dark:hover:bg-gray-600/40",
      input:
        "backdrop-blur-sm bg-white/20 dark:bg-gray-800/20 border border-white/30 dark:border-gray-600/30 focus:bg-white/30 dark:focus:bg-gray-700/30",
      modal:
        "backdrop-blur-xl bg-white/15 dark:bg-gray-900/15 border border-white/20 dark:border-gray-700/20",
      shadow: "shadow-2xl shadow-black/10 dark:shadow-black/20",
      border: "border border-white/20 dark:border-gray-700/20",
      background:
        "bg-gradient-to-br from-white/5 to-transparent dark:from-gray-900/5",
    },
  },
  minimalistic: {
    name: "Minimalistic",
    description: "Clean, simple design with minimal elements",
    icon: "⚪",
    cssClasses: {
      container: "bg-white dark:bg-gray-900",
      card: "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
      button:
        "bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600",
      input:
        "bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 focus:border-gray-400 dark:focus:border-gray-500",
      modal:
        "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
      shadow: "shadow-lg shadow-gray-200/50 dark:shadow-black/20",
      border: "border border-gray-200 dark:border-gray-700",
      background: "bg-white dark:bg-gray-900",
    },
  },
  skeumorphic: {
    name: "Skeumorphic",
    description: "Realistic design mimicking physical objects",
    icon: "📱",
    cssClasses: {
      container:
        "bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900",
      card: "bg-gradient-to-b from-white to-gray-100 dark:from-gray-700 dark:to-gray-800 border-2 border-gray-300 dark:border-gray-600 shadow-inner",
      button:
        "bg-gradient-to-b from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 border-2 border-blue-400 dark:border-blue-500 shadow-lg hover:from-blue-600 hover:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800",
      input:
        "bg-gradient-to-b from-white to-gray-50 dark:from-gray-600 dark:to-gray-700 border-2 border-gray-400 dark:border-gray-500 shadow-inner focus:border-blue-400 dark:focus:border-blue-500",
      modal:
        "bg-gradient-to-b from-white to-gray-100 dark:from-gray-700 dark:to-gray-800 border-2 border-gray-300 dark:border-gray-600 shadow-2xl",
      shadow: "shadow-2xl shadow-gray-400/30 dark:shadow-black/40",
      border: "border-2 border-gray-300 dark:border-gray-600",
      background:
        "bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900",
    },
  },
  neumorphic: {
    name: "Neumorphic",
    description: "Soft, extruded plastic look with subtle shadows",
    icon: "🔘",
    cssClasses: {
      container: "bg-gray-100 dark:bg-gray-800",
      card: "bg-gray-100 dark:bg-gray-800 shadow-[inset_-2px_-2px_4px_rgba(255,255,255,0.7),inset_2px_2px_4px_rgba(0,0,0,0.1)] dark:shadow-[inset_-2px_-2px_4px_rgba(255,255,255,0.1),inset_2px_2px_4px_rgba(0,0,0,0.3)]",
      button:
        "bg-gray-100 dark:bg-gray-800 shadow-[4px_4px_8px_rgba(0,0,0,0.1),-4px_-4px_8px_rgba(255,255,255,0.7)] dark:shadow-[4px_4px_8px_rgba(0,0,0,0.3),-4px_-4px_8px_rgba(255,255,255,0.1)] hover:shadow-[2px_2px_4px_rgba(0,0,0,0.1),-2px_-2px_4px_rgba(255,255,255,0.7)] dark:hover:shadow-[2px_2px_4px_rgba(0,0,0,0.3),-2px_-2px_4px_rgba(255,255,255,0.1)]",
      input:
        "bg-gray-100 dark:bg-gray-800 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-2px_-2px_4px_rgba(255,255,255,0.7)] dark:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3),inset_-2px_-2px_4px_rgba(255,255,255,0.1)]",
      modal:
        "bg-gray-100 dark:bg-gray-800 shadow-[8px_8px_16px_rgba(0,0,0,0.1),-8px_-8px_16px_rgba(255,255,255,0.7)] dark:shadow-[8px_8px_16px_rgba(0,0,0,0.3),-8px_-8px_16px_rgba(255,255,255,0.1)]",
      shadow:
        "shadow-[8px_8px_16px_rgba(0,0,0,0.1),-8px_-8px_16px_rgba(255,255,255,0.7)] dark:shadow-[8px_8px_16px_rgba(0,0,0,0.3),-8px_-8px_16px_rgba(255,255,255,0.1)]",
      border: "border-0",
      background: "bg-gray-100 dark:bg-gray-800",
    },
  },
};

export class DesignSystemService {
  private static instance: DesignSystemService;
  private currentDesignSystem: DesignSystem = "minimalistic";

  private constructor() {}

  public static getInstance(): DesignSystemService {
    if (!DesignSystemService.instance) {
      DesignSystemService.instance = new DesignSystemService();
    }
    return DesignSystemService.instance;
  }

  public getDesignSystemConfig(designSystem: DesignSystem): DesignSystemConfig {
    return DESIGN_SYSTEMS[designSystem];
  }

  public getAllDesignSystems(): DesignSystemConfig[] {
    return Object.values(DESIGN_SYSTEMS);
  }

  public getCurrentDesignSystem(): DesignSystem {
    return this.currentDesignSystem;
  }

  public setCurrentDesignSystem(designSystem: DesignSystem): void {
    this.currentDesignSystem = designSystem;
    this.applyDesignSystem(designSystem);
  }

  public applyDesignSystem(designSystem: DesignSystem): void {
    if (typeof window === "undefined") return;

    const config = this.getDesignSystemConfig(designSystem);
    const root = document.documentElement;

    // Apply CSS custom properties for the design system
    root.style.setProperty(
      "--design-system-container",
      config.cssClasses.container
    );
    root.style.setProperty("--design-system-card", config.cssClasses.card);
    root.style.setProperty("--design-system-button", config.cssClasses.button);
    root.style.setProperty("--design-system-input", config.cssClasses.input);
    root.style.setProperty("--design-system-modal", config.cssClasses.modal);
    root.style.setProperty("--design-system-shadow", config.cssClasses.shadow);
    root.style.setProperty("--design-system-border", config.cssClasses.border);
    root.style.setProperty(
      "--design-system-background",
      config.cssClasses.background
    );

    // Add design system class to body
    document.body.className = document.body.className.replace(
      /design-system-\w+/g,
      ""
    );
    document.body.classList.add(`design-system-${designSystem}`);
  }

  public getDesignSystemClasses(
    designSystem: DesignSystem,
    elementType: keyof DesignSystemConfig["cssClasses"]
  ): string {
    return DESIGN_SYSTEMS[designSystem].cssClasses[elementType];
  }
}

export const designSystemService = DesignSystemService.getInstance();
