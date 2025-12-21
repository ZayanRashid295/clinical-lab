"use client";

import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useRouter } from "next/router";
import { Button } from "@/shared/ui/button";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { paymentsService } from "@/app/services/payments/payments.service";
import { authService } from "@/shared/services/auth.service";
import { SubscriptionsService } from "@/app/services/subscriptions/subscriptions.service";
import { ExistingSubscriptionModal } from "@/app/components/ExistingSubscriptionModal";
import { Subscription } from "@/app/types/subscription";

// IMPORTANT: set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in frontend-next/.env.local
const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

// Only initialize Stripe if we have a valid key
const stripePromise = STRIPE_PUBLISHABLE_KEY && STRIPE_PUBLISHABLE_KEY !== "" && !STRIPE_PUBLISHABLE_KEY.includes("YOUR_PUBLISHABLE_KEY_HERE")
  ? loadStripe(STRIPE_PUBLISHABLE_KEY)
  : null;

// Default package ID (fallback if not provided in query params)
const DEFAULT_PACKAGE_ID = "cmhuiu0kv00olgi5f99c8kf4o";

interface CheckoutState {
  clientSecret: string | null;
  paymentId: string | null;
  amount: number | null;
  currency: string | null;
  loading: boolean;
  error: string | null;
  success: boolean;
  subscriptionId: string | null;
  paymentStatus: "PENDING" | "COMPLETED" | "FAILED" | null;
}

function CheckoutForm({
  state,
  setState,
  router,
}: {
  state: CheckoutState;
  setState: (s: CheckoutState) => void;
  router: any;
}) {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !state.clientSecret) return;

    setState({ ...state, loading: true, error: null, success: false });

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setState({
        ...state,
        loading: false,
        error: "Payment form is not ready. Please try again.",
        success: false,
      });
      return;
    }

    const { error, paymentIntent } = await stripe.confirmCardPayment(
      state.clientSecret,
      {
        payment_method: {
          card: cardElement,
        },
      }
    );

    if (error) {
      setState({
        ...state,
        loading: false,
        error: error.message || "Payment failed",
        success: false,
      });
      return;
    }

    if (paymentIntent && paymentIntent.status === "succeeded") {
      // Payment succeeded on Stripe, now sync with backend
      if (state.paymentId) {
        setState({ ...state, loading: true, error: null });
        
        // Poll for payment status update (webhook might be delayed)
        let attempts = 0;
        const maxAttempts = 10;
        const pollInterval = 1000; // 1 second
        
        const pollPaymentStatus = async () => {
          try {
            const updatedPayment = await paymentsService.getPayment(state.paymentId!);
            
            if (updatedPayment.status === "COMPLETED") {
              setState({
                ...state,
                loading: false,
                error: null,
                success: true,
                paymentStatus: "COMPLETED",
                subscriptionId: (updatedPayment as any).subscriptionId || null,
              });
              return;
            }
            
            // If still PENDING after a few attempts, manually sync
            if (attempts >= 3 && updatedPayment.status === "PENDING") {
              try {
                await paymentsService.syncPayment(state.paymentId!);
                const syncedPayment = await paymentsService.getPayment(state.paymentId!);
                
                if (syncedPayment.status === "COMPLETED") {
                  setState({
                    ...state,
                    loading: false,
                    error: null,
                    success: true,
                    paymentStatus: "COMPLETED",
                    subscriptionId: (syncedPayment as any).subscriptionId || null,
                  });
                  return;
                }
              } catch (syncError) {
                console.error("Sync error:", syncError);
                // Continue polling
              }
            }
            
            attempts++;
            if (attempts < maxAttempts) {
              setTimeout(pollPaymentStatus, pollInterval);
            } else {
              setState({
                ...state,
                loading: false,
                error: "Payment succeeded but status update is delayed. Please check your subscription in a few moments.",
                success: false,
                paymentStatus: "PENDING",
              });
            }
          } catch (pollError) {
            console.error("Poll error:", pollError);
            attempts++;
            if (attempts < maxAttempts) {
              setTimeout(pollPaymentStatus, pollInterval);
            } else {
              setState({
                ...state,
                loading: false,
                error: "Payment succeeded but we couldn't verify the status. Please check your subscription.",
                success: false,
                paymentStatus: "PENDING",
              });
            }
          }
        };
        
        // Start polling after a short delay
        setTimeout(pollPaymentStatus, 500);
      } else {
        // No payment ID, just show success
        setState({
          ...state,
          loading: false,
          error: null,
          success: true,
          paymentStatus: "COMPLETED",
        });
      }
    } else {
      setState({
        ...state,
        loading: false,
        error: "Payment did not complete. Please try again.",
        success: false,
        paymentStatus: "FAILED",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="border rounded-md p-4 bg-white">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "16px",
                color: "#32325d",
                "::placeholder": { color: "#aab7c4" },
              },
              invalid: {
                color: "#fa755a",
              },
            },
          }}
        />
      </div>

      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {state.success && (
        <Alert variant="default" className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">
            <div className="font-semibold mb-2">✅ Payment Successful!</div>
            <div className="text-sm">
              Your subscription has been activated. You can now access all features.
            </div>
          </AlertDescription>
        </Alert>
      )}

      {state.paymentStatus === "PENDING" && !state.success && !state.error && (
        <Alert variant="default" className="bg-yellow-50 border-yellow-200">
          <AlertDescription className="text-yellow-800">
            <div className="font-semibold mb-2">⏳ Payment Processing</div>
            <div className="text-sm">
              Your payment is being processed. Please wait...
            </div>
          </AlertDescription>
        </Alert>
      )}

      {!state.success && (
        <Button
          type="submit"
          className="w-full"
          disabled={state.loading || !stripe || !elements || state.success}
        >
          {state.loading ? "Processing..." : "Pay now"}
        </Button>
      )}
    </form>
  );
}

export default function BasicCheckoutPage() {
  const router = useRouter();
  const subscriptionsService = new SubscriptionsService();
  const [state, setState] = useState<CheckoutState>({
    clientSecret: null,
    paymentId: null,
    amount: null,
    currency: null,
    loading: true,
    error: null,
    success: false,
    subscriptionId: null,
    paymentStatus: null,
  });
  const [existingSubscription, setExistingSubscription] = useState<Subscription | null>(null);
  const [showExistingSubscriptionModal, setShowExistingSubscriptionModal] = useState(false);
  const [shouldProceedWithPayment, setShouldProceedWithPayment] = useState(false);

  useEffect(() => {
    const initPayment = async () => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        // Ensure user is logged in and get profile
        const profile = await authService.getProfile();
        const userId = profile?.id;

        if (!userId) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: "You must be logged in to purchase a subscription.",
          }));
          // Redirect to login / landing
          router.push("/");
          return;
        }

        // Get packageId from query params or use default
        const packageId = (router.query.packageId as string) || DEFAULT_PACKAGE_ID;

        // Check for existing ACTIVE subscription
        if (!shouldProceedWithPayment) {
          try {
            const userSubscriptions = await subscriptionsService.getUserSubscriptions(userId, "ACTIVE");
            if (userSubscriptions && userSubscriptions.length > 0) {
              setExistingSubscription(userSubscriptions[0]);
              setShowExistingSubscriptionModal(true);
              setState((prev) => ({ ...prev, loading: false }));
              return;
            }
          } catch (subError) {
            console.error("Error checking existing subscriptions:", subError);
            // Continue with payment creation if check fails
          }
        }

        // Create payment on backend for selected subscription package
        const payment = await paymentsService.createPayment({
          userId,
          subscriptionPackageId: packageId,
          description: "Subscription purchase",
        });

        // paymentsService.createPayment currently returns CreateResponse (generic),
        // so we safely read the fields we expect from backend.
        const clientSecret =
          (payment as any).clientSecret || (payment as any).client_secret;

        if (!clientSecret) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error:
              "Unable to start payment: missing client secret from backend.",
          }));
          return;
        }

        setState((prev) => ({
          ...prev,
          clientSecret,
          paymentId: (payment as any).paymentId || null,
          amount: (payment as any).amount || null,
          currency: (payment as any).currency || null,
          loading: false,
        }));
      } catch (err) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error:
            err instanceof Error
              ? err.message
              : "Failed to initialize checkout.",
        }));
      }
    };

    initPayment();
  }, [router, shouldProceedWithPayment]);

  const handleCancelAndCreate = () => {
    setShowExistingSubscriptionModal(false);
    setShouldProceedWithPayment(true);
    // Re-initialize payment
    setState((prev) => ({ ...prev, loading: true, error: null }));
  };

  const handleContinueWithExisting = () => {
    setShowExistingSubscriptionModal(false);
    router.push("/dashboard");
  };

  if (!stripePromise) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md bg-white rounded-lg shadow-lg p-6 space-y-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Configuration Required
          </h1>
          <Alert variant="destructive">
            <AlertDescription>
              <p className="font-semibold mb-2">
                Stripe publishable key is not configured.
              </p>
              <p className="text-sm mb-2">
                To fix this:
              </p>
              <ol className="list-decimal list-inside text-sm space-y-1 ml-2">
                <li>Go to your Stripe Dashboard: <a href="https://dashboard.stripe.com/test/apikeys" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">https://dashboard.stripe.com/test/apikeys</a></li>
                <li>Copy your <strong>Publishable key</strong> (starts with <code className="bg-gray-100 px-1 rounded">pk_test_</code>)</li>
                <li>Open <code className="bg-gray-100 px-1 rounded">frontend-next/.env.local</code></li>
                <li>Replace <code className="bg-gray-100 px-1 rounded">pk_test_YOUR_PUBLISHABLE_KEY_HERE</code> with your actual key</li>
                <li>Restart the Next.js dev server</li>
              </ol>
            </AlertDescription>
          </Alert>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push("/")}
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  if (state.loading && !state.clientSecret) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Preparing your checkout...</p>
      </div>
    );
  }

  if (!state.clientSecret) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">
          Could not start checkout. {state.error || ""}
        </p>
      </div>
    );
  }

  return (
    <>
      <ExistingSubscriptionModal
        isOpen={showExistingSubscriptionModal}
        onClose={() => setShowExistingSubscriptionModal(false)}
        onCancelAndCreate={handleCancelAndCreate}
        onContinueWithExisting={handleContinueWithExisting}
        existingSubscription={existingSubscription}
      />

      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6 space-y-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Basic Qbank Subscription
        </h1>
        <p className="text-gray-600 mb-4">
          You are purchasing <strong>30 days</strong> of access to the Qbank
          (Basic package).
        </p>
        {state.amount && state.currency && (
          <p className="text-lg font-semibold mb-4">
            Amount: {state.amount} {state.currency}
          </p>
        )}

        {!state.success && (
          <Elements
            stripe={stripePromise}
            options={{ clientSecret: state.clientSecret }}
          >
            <CheckoutForm state={state} setState={setState} router={router} />
          </Elements>
        )}

        {state.success && (
          <div className="space-y-3 mt-4">
            <Button
              className="w-full"
              onClick={() => router.push("/dashboard")}
            >
              Go to Dashboard
            </Button>
            {state.subscriptionId && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push("/dashboard?tab=subscription")}
              >
                View My Subscription
              </Button>
            )}
          </div>
        )}

        {!state.success && (
          <Button
            variant="outline"
            className="w-full mt-2"
            onClick={() => router.push("/dashboard")}
          >
            Back to Dashboard
          </Button>
        )}
        </div>
      </div>
    </>
  );
}


