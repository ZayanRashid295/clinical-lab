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
      <DialogContent className="sm:max-w-lg overflow-hidden p-0 gap-0 [&_[data-slot=dialog-close]]:text-primary-foreground [&_[data-slot=dialog-close]]:hover:text-primary-foreground/90">
        <DialogHeader className="bg-primary text-primary-foreground px-6 py-4 text-left space-y-0">
          <DialogTitle className="text-primary-foreground text-xl font-semibold">
            Acknowledgment
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6 pt-4">
          <DialogDescription className="space-y-4 text-muted-foreground text-sm leading-relaxed">
            <p>
              This software is intended for demo purposes only, not all features are available.
            </p>
            <p>
              Some pages are filled with sample information to provide a realistic experience of this software.
            </p>
            <p>
              Please{" "}
              <button
                type="button"
                onClick={onSubscribe}
                className="text-primary underline underline-offset-2 hover:text-primary/80 font-medium"
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
              className="flex-1"
              onClick={onSubscribe}
            >
              Subscribe
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
