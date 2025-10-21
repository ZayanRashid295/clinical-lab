import { useState, useCallback } from "react";
import { UsersService } from "../app/services/users/users.service";
import { User, UpdateUserDto } from "../app/types/user";

interface UseUserEditResult {
  updateUser: (id: string, userData: UpdateUserDto) => Promise<User>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

const useUserEdit = (): UseUserEditResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const usersService = new UsersService();

  const updateUser = useCallback(
    async (id: string, userData: UpdateUserDto): Promise<User> => {
      try {
        setLoading(true);
        setError(null);

        const updatedUser = await usersService.updateUser(id, userData);
        return updatedUser;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update user";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    updateUser,
    loading,
    error,
    clearError,
  };
};

export default useUserEdit;
