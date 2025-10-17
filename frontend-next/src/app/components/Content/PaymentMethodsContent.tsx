import React, { useState, useEffect } from "react";
import {
  Plus,
  RefreshCw,
  CreditCard,
  Wallet,
  Banknote,
  Building,
  Database,
} from "lucide-react";
import { PaymentMethod, PaymentMethodType } from "../../types/payment";
import PaymentMethodsTable from "../Payments/PaymentMethodsTable";
import usePaymentMethods from "../../../hooks/usePaymentMethods";
import { isMockDataEnabled } from "../../config/app.config";

export default function PaymentMethodsContent() {
  const [showAddMethod, setShowAddMethod] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(
    null
  );

  const {
    paymentMethods,
    loading,
    error,
    refetch,
    createPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
  } = usePaymentMethods();

  const activeMethods = paymentMethods.filter((pm) => pm.isActive);
  const inactiveMethods = paymentMethods.filter((pm) => !pm.isActive);

  // Debug: Log data source and payment methods
  useEffect(() => {
    console.log("🔍 Payment Methods Debug Info:");
    console.log(
      "- Data source:",
      isMockDataEnabled() ? "MOCK DATA" : "BACKEND API"
    );
    console.log("- Payment methods count:", paymentMethods.length);
    console.log("- Payment methods:", paymentMethods);
    console.log("- Loading:", loading);
    console.log("- Error:", error);
  }, [paymentMethods, loading, error]);

  const handleAddMethod = () => {
    setShowAddMethod(true);
  };

  const handleViewMethod = (method: PaymentMethod) => {
    setSelectedMethod(method);
    console.log("View method:", method);
  };

  const handleDeleteMethod = async (method: PaymentMethod) => {
    try {
      await deletePaymentMethod(method.id);
      console.log("Payment method deleted successfully");
    } catch (error) {
      console.error("Failed to delete payment method:", error);
    }
  };

  const handleSetDefault = async (method: PaymentMethod) => {
    try {
      // First, set all other methods to not default
      await Promise.all(
        paymentMethods
          .filter((pm) => pm.id !== method.id && pm.isDefault)
          .map((pm) => updatePaymentMethod(pm.id, { isDefault: false }))
      );

      // Then set the selected method as default
      await updatePaymentMethod(method.id, { isDefault: true });
      console.log("Default payment method updated successfully");
    } catch (error) {
      console.error("Failed to set default payment method:", error);
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Payment Methods
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your saved payment methods and billing preferences
            </p>
            {/* Data Source Indicator */}
            <div className="flex items-center gap-2 mt-2">
              <Database
                size={14}
                className={
                  isMockDataEnabled() ? "text-orange-500" : "text-green-500"
                }
              />
              <span
                className={`text-xs font-medium ${
                  isMockDataEnabled() ? "text-orange-600" : "text-green-600"
                }`}
              >
                {isMockDataEnabled() ? "Using Mock Data" : "Using Backend API"}
              </span>
              {paymentMethods.length > 0 && (
                <span className="text-xs text-gray-500">
                  ({paymentMethods.length} methods)
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
            <button
              onClick={handleAddMethod}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} />
              Add Payment Method
            </button>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CreditCard size={20} className="text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Cards</p>
              <p className="text-2xl font-bold text-gray-900">
                {activeMethods.filter((m) => m.type === "CARD").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Wallet size={20} className="text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Digital Wallets
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {activeMethods.filter((m) => m.type === "WALLET").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Building size={20} className="text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Bank Accounts</p>
              <p className="text-2xl font-bold text-gray-900">
                {activeMethods.filter((m) => m.type === "BANK_TRANSFER").length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Payment Methods */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Active Payment Methods
        </h2>
        <PaymentMethodsTable
          paymentMethods={activeMethods}
          onViewMethod={handleViewMethod}
          onDeleteMethod={handleDeleteMethod}
          onSetDefault={handleSetDefault}
        />
      </div>

      {/* Inactive Payment Methods */}
      {inactiveMethods.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Inactive Payment Methods
          </h2>
          <PaymentMethodsTable
            paymentMethods={inactiveMethods}
            onViewMethod={handleViewMethod}
            onDeleteMethod={handleDeleteMethod}
            onSetDefault={handleSetDefault}
          />
        </div>
      )}

      {/* Add Payment Method Modal would go here */}
      {showAddMethod && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Add Payment Method
            </h3>
            <p className="text-gray-600 mb-4">
              Choose how you&apos;d like to add a new payment method:
            </p>
            <div className="space-y-3">
              <button className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <CreditCard size={20} className="text-blue-600" />
                <div className="text-left">
                  <div className="font-medium">Credit or Debit Card</div>
                  <div className="text-sm text-gray-500">
                    Visa, Mastercard, American Express
                  </div>
                </div>
              </button>
              <button className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <Wallet size={20} className="text-green-600" />
                <div className="text-left">
                  <div className="font-medium">Digital Wallet</div>
                  <div className="text-sm text-gray-500">
                    PayPal, Apple Pay, Google Pay
                  </div>
                </div>
              </button>
              <button className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <Building size={20} className="text-purple-600" />
                <div className="text-left">
                  <div className="font-medium">Bank Account</div>
                  <div className="text-sm text-gray-500">
                    Direct bank transfer
                  </div>
                </div>
              </button>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddMethod(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
