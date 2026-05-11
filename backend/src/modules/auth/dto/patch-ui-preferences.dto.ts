import { IsIn, IsOptional, IsString } from "class-validator";

const THEMES = ["light", "dark"] as const;
const MENU_LAYOUTS = ["vertical", "horizontal"] as const;
const MENU_STYLES = ["sidebar", "topbar"] as const;
const FONT_SIZES = ["small", "medium", "large"] as const;
const TYPO_PRESETS = ["system", "comfort", "compact"] as const;

const COLOR_SCHEMES = [
  "blue",
  "green",
  "purple",
  "red",
  "orange",
  "indigo",
  "pink",
  "teal",
  "cyan",
  "emerald",
  "violet",
  "rose",
  "amber",
  "lime",
  "slate",
  "zinc",
  "sky",
  "fuchsia",
] as const;

export class PatchUiPreferencesDto {
  @IsOptional()
  @IsString()
  @IsIn([...THEMES])
  uiTheme?: string;

  @IsOptional()
  @IsString()
  @IsIn([...COLOR_SCHEMES])
  uiColorScheme?: string;

  @IsOptional()
  @IsString()
  @IsIn([...MENU_LAYOUTS])
  uiMenuLayout?: string;

  @IsOptional()
  @IsString()
  @IsIn([...MENU_STYLES])
  uiMenuStyle?: string;

  @IsOptional()
  @IsString()
  @IsIn([...FONT_SIZES])
  uiFontSize?: string;

  @IsOptional()
  @IsString()
  @IsIn([...TYPO_PRESETS])
  uiTypographyPreset?: string;
}
