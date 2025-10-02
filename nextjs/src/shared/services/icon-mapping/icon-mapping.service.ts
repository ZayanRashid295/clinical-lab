/**
 * Icon Mapping Service for Next.js
 * Maps emoji icons to Font Awesome classes, matching Angular implementation
 */

export class IconMappingService {
  // Icon mapping for menu items - maps emoji icons to Font Awesome classes
  private iconMap: { [key: string]: string } = {
    "🏠": "fas fa-home",
    "🚗": "fas fa-car",
    "💳": "fas fa-credit-card",
    "💬": "fas fa-comments",
    "📍": "fas fa-map-marker-alt",
    "🚛": "fas fa-truck",
    "⚙️": "fas fa-cog",
    "📋": "fas fa-clipboard-list",
    "📊": "fas fa-chart-bar",
    "📱": "fas fa-mobile-alt",
    "💰": "fas fa-dollar-sign",
    "🧾": "fas fa-file-invoice",
    "🆘": "fas fa-exclamation-triangle",
    "🔔": "fas fa-bell",
    "🚏": "fas fa-map-pin",
    "🏁": "fas fa-flag-checkered",
    "⭐": "fas fa-star",
    "👨‍💼": "fas fa-user-tie",
    "🗺️": "fas fa-map",
    "🔧": "fas fa-tools",
    "⛽": "fas fa-gas-pump",
    "👥": "fas fa-users",
    "🔐": "fas fa-shield-alt",
    "📝": "fas fa-file-alt",
    "🎯": "fas fa-bullseye",
  };

  /**
   * Get Font Awesome class for an emoji icon
   * @param emojiIcon - The emoji icon string
   * @returns Font Awesome CSS class
   */
  getIconClass(emojiIcon: string): string {
    return this.iconMap[emojiIcon] || "fas fa-circle";
  }

  /**
   * Get all available icons
   * @returns Array of all icon mappings
   */
  getAllIcons(): { emoji: string; class: string }[] {
    return Object.entries(this.iconMap).map(([emoji, className]) => ({
      emoji,
      class: className,
    }));
  }

  /**
   * Check if an icon exists in the mapping
   * @param emojiIcon - The emoji icon string
   * @returns boolean indicating if icon exists
   */
  hasIcon(emojiIcon: string): boolean {
    return emojiIcon in this.iconMap;
  }
}

// Create a singleton instance
export const iconMappingService = new IconMappingService();


