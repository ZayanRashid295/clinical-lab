import { MenuItem } from "../../../../types/menu";

export const filterMenuItems = (
  items: MenuItem[],
  searchTerm: string
): MenuItem[] => {
  const filterItems = (arr: MenuItem[]): MenuItem[] => {
    return arr
      .filter((item) => {
        const matchesSearch =
          !searchTerm ||
          item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.id.toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) {
          // Check if any submenu items match
          if (item.submenu) {
            const filteredSubmenu = filterItems(item.submenu);
            return filteredSubmenu.length > 0;
          }
          return false;
        }

        return true;
      })
      .map((item) => {
        if (item.submenu) {
          return {
            ...item,
            submenu: filterItems(item.submenu),
          };
        }
        return item;
      });
  };

  return filterItems(items);
};

