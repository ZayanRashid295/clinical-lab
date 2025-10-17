import { useState, useEffect, useCallback } from "react";
import { PaymentMethod } from "../app/types/payment";
import { paymentsService } from "../app/services/payments/payments.service";

interface UsePaymentMethodsResult {
  paymentMethods: PaymentMethod[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  createPaymentMethod: (
    methodData: Partial<PaymentMethod>
  ) => Promise<PaymentMethod>;
  updatePaymentMethod: (
    id: string,
    methodData: Partial<PaymentMethod>
  ) => Promise<PaymentMethod>;
  deletePaymentMethod: (id: string) => Promise<void>;
}

const usePaymentMethods = (userId?: string): UsePaymentMethodsResult => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPaymentMethods = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const methods = await paymentsService.getPaymentMethods(userId);
      setPaymentMethods(methods);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch payment methods"
      );
      setPaymentMethods([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const createPaymentMethod = useCallback(
    async (methodData: Partial<PaymentMethod>): Promise<PaymentMethod> => {
      try {
        const newMethod = await paymentsService.createPaymentMethod(methodData);
        setPaymentMethods((prev) => [...prev, newMethod]);
        return newMethod;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to create payment method"
        );
        throw err;
      }
    },
    []
  );

  const updatePaymentMethod = useCallback(
    async (
      id: string,
      methodData: Partial<PaymentMethod>
    ): Promise<PaymentMethod> => {
      try {
        const updatedMethod = await paymentsService.updatePaymentMethod(
          id,
          methodData
        );
        setPaymentMethods((prev) =>
          prev.map((method) => (method.id === id ? updatedMethod : method))
        );
        return updatedMethod;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to update payment method"
        );
        throw err;
      }
    },
    []
  );

  const deletePaymentMethod = useCallback(async (id: string): Promise<void> => {
    try {
      await paymentsService.deletePaymentMethod(id);
      setPaymentMethods((prev) => prev.filter((method) => method.id !== id));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete payment method"
      );
      throw err;
    }
  }, []);

  const refetch = useCallback(() => {
    fetchPaymentMethods();
  }, [fetchPaymentMethods]);

  useEffect(() => {
    fetchPaymentMethods();
  }, [fetchPaymentMethods]);

  return {
    paymentMethods,
    loading,
    error,
    refetch,
    createPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
  };
};

export default usePaymentMethods;
