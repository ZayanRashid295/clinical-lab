"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Subscription } from "@/app/types/subscription";
import { Calendar, Package } from "lucide-react";

interface ExistingSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCancelAndCreate: () => void;
  onContinueWithExisting: () => void;
  existingSubscription: Subscription | null;
}

export function ExistingSubscriptionModal({
  isOpen,
  onClose,
  onCancelAndCreate,
  onContinueWithExisting,
  existingSubscription,
}: ExistingSubscriptionModalProps) {
  if (!existingSubscription) return null;

  const packageName = existingSubscription.subscriptionPackage?.name || "Unknown Package";
  const endDate = existingSubscription.endDate
    ? new Date(existingSubscription.endDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Existing Active Subscription
          </DialogTitle>
          <DialogDescription>
            You already have an active subscription. What would you like to do?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertDescription>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <strong>Current Subscription:</strong>
                  <span className="text-blue-600">{packageName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>Valid until: {endDate}</span>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              If you create a new subscription, your current subscription will be cancelled and replaced with the new one.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              variant="default"
              className="w-full"
              onClick={onCancelAndCreate}
            >
              Cancel & Create New Subscription
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={onContinueWithExisting}
            >
              Continue with Existing Subscription
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}



























