import React from "react";
import {
  Eye,
  Trash2,
  CreditCard,
  Wallet,
  Banknote,
  Building,
  Star,
} from "lucide-react";
import { PaymentMethod, PaymentMethodType } from "../../types/payment";

interface PaymentMethodsTableProps {
  paymentMethods: PaymentMethod[];
  loading?: boolean;
  error?: string | null;
  onViewMethod?: (method: PaymentMethod) => void;
  onDeleteMethod?: (method: PaymentMethod) => void;
  onSetDefault?: (method: PaymentMethod) => void;
}

const PaymentMethodsTable: React.FC<PaymentMethodsTableProps> = ({
  paymentMethods,
  loading = false,
  error = null,
  onViewMethod,
  onDeleteMethod,
  onSetDefault,
}) => {
  const getMethodIcon = (type: PaymentMethodType) => {
    switch (type) {
      case "CARD":
        return <CreditCard size={16} />;
      case "WALLET":
        return <Wallet size={16} />;
      case "CASH":
        return <Banknote size={16} />;
      case "BANK_TRANSFER":
        return <Building size={16} />;
      default:
        return <CreditCard size={16} />;
    }
  };

  const formatDate = (dateString: string): string => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(dateString));
  };

  const getCardBrandColor = (brand?: string): string => {
    switch (brand?.toLowerCase()) {
      case "visa":
        return "text-blue-600";
      case "mastercard":
        return "text-red-600";
      case "american express":
      case "amex":
        return "text-green-600";
      case "discover":
        return "text-orange-600";
      default:
        return "text-gray-600";
    }
  };

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow border p-6">
        <div className="text-center">
          <div className="text-red-500 mb-2">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Error Loading Payment Methods
          </h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow border">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Payment Methods</h3>
          <div className="text-sm text-gray-600">
            {paymentMethods.length} method
            {paymentMethods.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-500">
              Loading payment methods...
            </span>
          </div>
        ) : paymentMethods.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              No payment methods
            </h3>
            <p className="text-sm text-gray-500">
              Add a payment method to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className={`relative border rounded-lg p-4 hover:shadow-md transition-shadow ${
                  method.isDefault
                    ? "border-blue-500 bg-blue-50"
                    : method.isActive
                    ? "border-gray-200"
                    : "border-gray-200 bg-gray-50 opacity-75"
                }`}
              >
                {/* Default Badge */}
                {method.isDefault && (
                  <div className="absolute top-2 right-2">
                    <div className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                      <Star size={10} fill="currentColor" />
                      Default
                    </div>
                  </div>
                )}

                {/* Method Info */}
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 p-2 bg-gray-100 rounded-full">
                    {getMethodIcon(method.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium text-gray-900">
                        {method.type === "CARD"
                          ? "Card"
                          : method.type === "WALLET"
                          ? "Digital Wallet"
                          : method.type === "CASH"
                          ? "Cash"
                          : "Bank Transfer"}
                      </h4>
                      {!method.isActive && (
                        <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded">
                          Inactive
                        </span>
                      )}
                    </div>

                    {method.type === "CARD" && method.metadata && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-medium ${getCardBrandColor(
                              method.metadata.brand
                            )}`}
                          >
                            {method.metadata.brand?.toUpperCase() || "CARD"}
                          </span>
                          <span className="text-sm text-gray-500">
                            •••• {method.metadata.last4}
                          </span>
                        </div>
                        {method.metadata.expiryMonth &&
                          method.metadata.expiryYear && (
                            <div className="text-xs text-gray-500">
                              Expires{" "}
                              {String(method.metadata.expiryMonth).padStart(
                                2,
                                "0"
                              )}
                              /{method.metadata.expiryYear}
                            </div>
                          )}
                        {method.metadata.holderName && (
                          <div className="text-xs text-gray-500">
                            {method.metadata.holderName}
                          </div>
                        )}
                      </div>
                    )}

                    {method.type === "WALLET" && (
                      <div className="text-sm text-gray-500 capitalize">
                        {method.provider}
                      </div>
                    )}

                    <div className="text-xs text-gray-400 mt-2">
                      Added {formatDate(method.createdAt)}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onViewMethod?.(method)}
                      className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                      title="View Details"
                    >
                      <Eye size={14} />
                      Details
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {!method.isDefault && method.isActive && onSetDefault && (
                      <button
                        onClick={() => onSetDefault(method)}
                        className="text-green-600 hover:text-green-800 text-xs px-2 py-1 border border-green-300 rounded hover:bg-green-50"
                        title="Set as Default"
                      >
                        Set Default
                      </button>
                    )}

                    {onDeleteMethod && (
                      <button
                        onClick={() => onDeleteMethod(method)}
                        className="text-red-600 hover:text-red-800 flex items-center gap-1"
                        title="Delete Method"
                        disabled={method.isDefault}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentMethodsTable;
