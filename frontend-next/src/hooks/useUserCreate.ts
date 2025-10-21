import { useState, useCallback } from "react";
import { UsersService } from "../app/services/users/users.service";
import { User, CreateUserDto } from "../app/types/user";

interface UseUserCreateResult {
  createUser: (userData: CreateUserDto) => Promise<User>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

const useUserCreate = (): UseUserCreateResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const usersService = new UsersService();

  const createUser = useCallback(
    async (userData: CreateUserDto): Promise<User> => {
      try {
        setLoading(true);
        setError(null);

        const newUser = await usersService.createUser(userData);
        return newUser;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create user";
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
    createUser,
    loading,
    error,
    clearError,
  };
};

export default useUserCreate;
