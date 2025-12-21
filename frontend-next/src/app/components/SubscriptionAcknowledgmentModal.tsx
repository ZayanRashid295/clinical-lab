"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";

interface SubscriptionAcknowledgmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribe: () => void;
  onAccessAccount: () => void;
}

export function SubscriptionAcknowledgmentModal({
  isOpen,
  onClose,
  onSubscribe,
  onAccessAccount,
}: SubscriptionAcknowledgmentModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="bg-blue-600 text-white p-4 -m-6 mb-4 rounded-t-lg">
          <DialogTitle className="text-white text-xl font-semibold">
            Acknowledgment
          </DialogTitle>
        </DialogHeader>

        <DialogDescription className="space-y-4 text-gray-600 pt-4">
          <p>
            This software is intended for demo purposes only, not all features are available.
          </p>
          <p>
            Some pages are filled with sample information to provide a realistic experience of this software.
          </p>
          <p>
            Please{" "}
            <button
              onClick={onSubscribe}
              className="text-blue-600 underline hover:text-blue-800 font-medium"
            >
              subscribe
            </button>{" "}
            to obtain full access to our content and features. If you have already subscribed, please visit My Account section to continue with your subscription.
          </p>
        </DialogDescription>

        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onAccessAccount}
          >
            Access My Account
          </Button>
          <Button
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            onClick={onSubscribe}
          >
            Subscribe
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}















