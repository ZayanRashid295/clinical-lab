import { useUIConfigContext } from "../shared/contexts/UIConfigContext";

export const useTheme = () => {
  return useUIConfigContext();
};

export default useTheme;
