import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  CreditCard,
  Save,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import {
  Subscription,
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
  SubscriptionStatus,
  SubscriptionPackage,
} from "../../types/subscription";
import { User } from "../../types/user";
import { SubscriptionsService } from "../../services/subscriptions/subscriptions.service";
import { UsersService } from "../../services/users/users.service";
import { SubscriptionPackagesService } from "../../services/subscriptions/subscription-packages.service";
import { CreateResponse } from "../../services/base/api-types";
import { getApiErrorMessage } from "@/app/services/base/api-http-error";

type UserOption = { id: string; label: string };
type PackageOption = { id: string; label: string };

interface SubscriptionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription?: Subscription | null;
  onSubscriptionSaved: (subscription: Subscription) => void;
  mode: "create" | "edit";
}

export default function SubscriptionFormModal({
  isOpen,
  onClose,
  subscription,
  onSubscriptionSaved,
  mode,
}: SubscriptionFormModalProps) {
  const [formData, setFormData] = useState<CreateSubscriptionDto>({
    userId: "",
    subscriptionPackageId: "",
    status: "ACTIVE",
    startDate: "",
    endDate: "",
    autoRenew: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const [packageOptions, setPackageOptions] = useState<PackageOption[]>([]);

  const subscriptionsService = useMemo(() => new SubscriptionsService(), []);
  const usersService = useMemo(() => new UsersService(), []);
  const packagesService = useMemo(() => new SubscriptionPackagesService(), []);
  const isCreateMode = mode === "create";

  useEffect(() => {
    if (!isOpen) return;

    const toUserLabel = (u: Pick<User, "id" | "email" | "firstName" | "lastName">) =>
      `${u.firstName} ${u.lastName} (${u.email})`.trim();

    const toPackageLabel = (p: SubscriptionPackage) => {
      const subtype = p.productSubtype?.name;
      return subtype ? `${p.name} — ${subtype}` : p.name;
    };

    setOptionsLoading(true);
    Promise.all([
      usersService.getUsers({
        page: 1,
        limit: 100,
        sortBy: "lastName",
        sortOrder: "asc",
        status: "ACTIVE",
      }),
      packagesService.getPackages({
        page: 1,
        limit: 100,
        sortBy: "name",
        sortOrder: "asc",
        status: "ACTIVE",
      }),
    ])
      .then(([usersRes, packagesRes]) => {
        const usersList: User[] = Array.isArray(usersRes)
          ? usersRes
          : usersRes.data || [];
        const packagesList: SubscriptionPackage[] = Array.isArray(packagesRes)
          ? packagesRes
          : packagesRes.data || [];

        let usersOut: UserOption[] = usersList.map((u) => ({
          id: u.id,
          label: toUserLabel(u),
        }));

        let packagesOut: PackageOption[] = packagesList.map((p) => ({
          id: p.id,
          label: toPackageLabel(p),
        }));

        if (!isCreateMode && subscription) {
          if (
            subscription.user &&
            !usersOut.some((o) => o.id === subscription.userId)
          ) {
            usersOut = [
              {
                id: subscription.user.id,
                label: toUserLabel(subscription.user),
              },
              ...usersOut,
            ];
          }
          if (
            subscription.subscriptionPackage &&
            !packagesOut.some((o) => o.id === subscription.subscriptionPackageId)
          ) {
            const p = subscription.subscriptionPackage;
            packagesOut = [
              { id: p.id, label: toPackageLabel(p) },
              ...packagesOut,
            ];
          }
        }

        setUserOptions(usersOut);
        setPackageOptions(packagesOut);
      })
      .catch(() => {
        setUserOptions([]);
        setPackageOptions([]);
      })
      .finally(() => setOptionsLoading(false));
  }, [
    isOpen,
    isCreateMode,
    subscription,
    usersService,
    packagesService,
  ]);

  useEffect(() => {
    if (isOpen) {
      if (isCreateMode) {
        setFormData({
          userId: "",
          subscriptionPackageId: "",
          status: "ACTIVE",
          startDate: "",
          endDate: "",
          autoRenew: false,
        });
      } else if (subscription) {
        setFormData({
          userId: subscription.userId,
          subscriptionPackageId: subscription.subscriptionPackageId,
          status: subscription.status,
          startDate: subscription.startDate.split("T")[0],
          endDate: subscription.endDate.split("T")[0],
          autoRenew: subscription.autoRenew,
        });
      }
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, subscription, isCreateMode]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : value,
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.userId.trim()) {
      return "User is required";
    }
    if (!formData.subscriptionPackageId.trim()) {
      return "Subscription package is required";
    }
    if (!formData.startDate) {
      return "Start date is required";
    }
    if (!formData.endDate) {
      return "End date is required";
    }
    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      return "End date must be after start date";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      if (isCreateMode) {
        const response = await subscriptionsService.createSubscription(
          formData
        );
        setSuccess(true);
        setTimeout(() => {
          // Handle union type: response is either CreateResponse or Subscription
          if ("userId" in response && "subscriptionPackageId" in response) {
            // It's a Subscription
            onSubscriptionSaved(response);
            onClose();
          } else {
            // It's a CreateResponse, refetch the created entity
            const createResponse = response as CreateResponse;
            subscriptionsService
              .getSubscription(createResponse.id)
              .then((entity) => {
                onSubscriptionSaved(entity);
                onClose();
              })
              .catch(() => {
                onClose();
              });
          }
        }, 1000);
      } else if (subscription) {
        const updateData: UpdateSubscriptionDto = {
          status: formData.status,
          startDate: formData.startDate,
          endDate: formData.endDate,
          autoRenew: formData.autoRenew,
        };
        const response = await subscriptionsService.updateSubscription(
          subscription.id,
          updateData
        );
        setSuccess(true);
        setTimeout(() => {
          // Handle union type: response is either UpdateResponse or Subscription
          if ("userId" in response && "subscriptionPackageId" in response) {
            // It's a Subscription
            onSubscriptionSaved(response);
            onClose();
          } else {
            // It's an UpdateResponse, refetch the updated entity
            subscriptionsService
              .getSubscription(subscription.id)
              .then((entity) => {
                onSubscriptionSaved(entity);
                onClose();
              })
              .catch(() => {
                onClose();
              });
          }
        }, 1000);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to save subscription"));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <CreditCard className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">
              {isCreateMode ? "Create Subscription" : "Edit Subscription"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-green-700">
                Subscription saved successfully!
              </span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User *
              </label>
              <select
                name="userId"
                value={formData.userId}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100 disabled:text-gray-500"
                required
                disabled={!isCreateMode || optionsLoading}
              >
                <option value="">
                  {optionsLoading ? "Loading users…" : "Select a user"}
                </option>
                {userOptions.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subscription package *
              </label>
              <select
                name="subscriptionPackageId"
                value={formData.subscriptionPackageId}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100 disabled:text-gray-500"
                required
                disabled={!isCreateMode || optionsLoading}
              >
                <option value="">
                  {optionsLoading ? "Loading packages…" : "Select a package"}
                </option>
                {packageOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="ACTIVE">Active</option>
                <option value="EXPIRED">Expired</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date *
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="autoRenew"
                checked={formData.autoRenew}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Auto Renew
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isCreateMode ? "Create" : "Update"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

