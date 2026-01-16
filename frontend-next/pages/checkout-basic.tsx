"use client";

import { useEffect, useState, useRef } from "react";
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
import { SubscriptionPackagesService } from "@/app/services/subscriptions/subscription-packages.service";
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
      // Only log errors in development
      if (process.env.NODE_ENV === "development") {
        console.error("Stripe payment error:", error);
      }
      
      // Provide user-friendly error messages for common Stripe errors
      let userFriendlyError = error.message || "Payment failed";
      
      if (error.message?.includes("test mode") && error.message?.includes("non-test card")) {
        userFriendlyError = "This is a test environment. Please use a Stripe test card:\n\n" +
          "Test Card: 4242 4242 4242 4242\n" +
          "Expiry: Any future date (e.g., 12/25)\n" +
          "CVC: Any 3 digits (e.g., 123)\n" +
          "ZIP: Any 5 digits (e.g., 12345)\n\n" +
          "For more test cards, visit: https://stripe.com/docs/testing";
      } else if (error.message?.includes("card was declined")) {
        userFriendlyError = "Your card was declined. " + 
          (error.message.includes("test mode") 
            ? "Please use a Stripe test card (4242 4242 4242 4242) for testing."
            : "Please check your card details or try a different payment method.");
      } else if (error.message?.includes("insufficient funds")) {
        userFriendlyError = "Insufficient funds. Please use a different card or contact your bank.";
      } else if (error.message?.includes("expired card")) {
        userFriendlyError = "Your card has expired. Please use a different card.";
      } else if (error.message?.includes("incorrect cvc") || error.message?.includes("incorrect_cvc")) {
        userFriendlyError = "Incorrect CVC code. Please check and try again.";
      } else if (error.message?.includes("incorrect number") || error.message?.includes("invalid_number")) {
        userFriendlyError = "Invalid card number. Please check and try again.";
      }
      
      setState({
        ...state,
        loading: false,
        error: userFriendlyError,
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
                // Only log errors in development
                if (process.env.NODE_ENV === "development") {
                  console.error("Sync error:", syncError);
                }
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
          <AlertDescription>
            <div className="font-semibold mb-2">❌ {state.error.split('\n')[0]}</div>
            {state.error.includes('\n') && (
              <div className="text-sm mt-2 whitespace-pre-line">
                {state.error.split('\n').slice(1).join('\n')}
              </div>
            )}
            {state.error.includes("test mode") && (
              <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-200">
                <div className="text-sm font-semibold mb-2">Test Card Information:</div>
                <div className="text-xs space-y-1">
                  <div><strong>Card:</strong> 4242 4242 4242 4242</div>
                  <div><strong>Expiry:</strong> Any future date (e.g., 12/25)</div>
                  <div><strong>CVC:</strong> Any 3 digits (e.g., 123)</div>
                  <div><strong>ZIP:</strong> Any 5 digits (e.g., 12345)</div>
                </div>
                <a 
                  href="https://stripe.com/docs/testing" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 underline mt-2 inline-block"
                >
                  View all test cards →
                </a>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {state.success && (
        <Alert variant="default" className="bg-green-50 border-green-300 border-2">
          <AlertDescription className="text-green-900">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="font-bold text-lg">Payment Successful!</div>
            </div>
            <div className="text-sm font-medium">
              Your subscription has been activated successfully. You can now access all premium features.
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
  const [packageInfo, setPackageInfo] = useState<any>(null);
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Prevent multiple initializations
    if (hasInitialized.current && state.clientSecret) {
      return;
    }

    // Only initialize if router is ready and we don't have a client secret yet
    if (!router.isReady || state.clientSecret || hasInitialized.current) {
      return;
    }

    const initPayment = async () => {
      // Double-check to prevent race conditions
      if (hasInitialized.current) {
        return;
      }
      
      // Mark as initialized immediately to prevent concurrent calls
      hasInitialized.current = true;

      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        // Check if user is authenticated first
        if (!authService.isAuthenticated()) {
          // Reset initialization flag and redirect
          hasInitialized.current = false;
          router.push("/landing-page");
          return;
        }

        // Ensure user is logged in and get profile
        let profile;
        let userId;
        try {
          profile = await authService.getProfile();
          userId = profile?.id;
        } catch (authError) {
          // Only log errors in development
          if (process.env.NODE_ENV === "development") {
            console.error("Authentication error:", authError);
          }
          // Clear invalid auth data and redirect immediately
          if (typeof window !== "undefined") {
            localStorage.removeItem("authToken");
            localStorage.removeItem("userData");
          }
          hasInitialized.current = false;
          router.push("/landing-page");
          return;
        }

        if (!userId) {
          // Reset initialization flag and redirect
          hasInitialized.current = false;
          router.push("/landing-page");
          return;
        }

        // Get packageId from query params or use default
        const packageId = (router.query.packageId as string) || DEFAULT_PACKAGE_ID;

        // Check for existing ACTIVE subscription (only on first load, not when user explicitly wants to proceed)
        if (!shouldProceedWithPayment) {
          try {
            const userSubscriptions = await subscriptionsService.getUserSubscriptions(userId, "ACTIVE");
            if (userSubscriptions && userSubscriptions.length > 0) {
              setExistingSubscription(userSubscriptions[0]);
              setShowExistingSubscriptionModal(true);
              setState((prev) => ({ ...prev, loading: false }));
              // Reset hasInitialized to allow re-initialization when user proceeds
              hasInitialized.current = false;
              return;
            }
            // No existing subscription found, continue to payment creation below
          } catch (subError) {
            // Only log errors in development
            if (process.env.NODE_ENV === "development") {
              console.error("Error checking existing subscriptions:", subError);
            }
            // Continue with payment creation if check fails
          }
        }
        
        // Proceed with payment creation (either no existing subscription or user explicitly wants to proceed)
        // hasInitialized is already set at the start of initPayment

        // Fetch package information first to display details
        try {
          const packagesService = new SubscriptionPackagesService();
          const pkg = await packagesService.getPackage(packageId);
          setPackageInfo(pkg);
        } catch (pkgError) {
          // Continue without package info
          if (process.env.NODE_ENV === "development") {
            console.warn("Could not fetch package info:", pkgError);
          }
        }

        // Create payment on backend for selected subscription package
        const paymentResponse = await paymentsService.createPayment({
          userId,
          subscriptionPackageId: packageId,
          description: "Subscription purchase",
        });

        // Backend returns: { paymentId, clientSecret, amount, currency }
        // But frontend service might wrap it, so check both structures
        const payment = paymentResponse as any;
        const clientSecret = payment?.clientSecret || payment?.client_secret || payment?.data?.clientSecret;
        const paymentId = payment?.paymentId || payment?.id || payment?.data?.paymentId;
        const amount = payment?.amount || payment?.data?.amount;
        const currency = payment?.currency || payment?.data?.currency;

        if (!clientSecret || !paymentId) {
          if (process.env.NODE_ENV === "development") {
            console.error("Missing payment data in response:", { clientSecret, paymentId, paymentResponse });
          }
          // Reset and redirect - don't show error modal
          hasInitialized.current = false;
          router.push("/landing-page");
          return;
        }

        // Use package info if available, otherwise use payment response
        const finalAmount = amount || (packageInfo?.price ? Number(packageInfo.price) : null);
        const finalCurrency = currency || (packageInfo?.currency || "USD");

        setState((prev) => ({
          ...prev,
          clientSecret,
          paymentId,
          amount: finalAmount,
          currency: finalCurrency,
          loading: false,
        }));
      } catch (err) {
        // Reset initialization flag on error so user can retry
        hasInitialized.current = false;
        
        // Only log errors in development
        if (process.env.NODE_ENV === "development") {
          console.error("Checkout initialization error:", err);
        }
        
        const errorMessage = err instanceof Error ? err.message : String(err) || "Failed to initialize checkout.";
        
        // Handle specific error cases with automatic redirects
        if (errorMessage.includes("401") || errorMessage.includes("Unauthorized")) {
          // Clear invalid auth data and redirect
          if (typeof window !== "undefined") {
            localStorage.removeItem("authToken");
            localStorage.removeItem("userData");
          }
          router.push("/landing-page");
          return;
        }
        
        // For all other errors, redirect to landing page immediately
        // No error modal will be shown
        router.push("/landing-page");
      }
    };

    // Call initPayment
    initPayment();
  }, [router.isReady, router.query.packageId, shouldProceedWithPayment]);

  const handleCancelAndCreate = () => {
    setShowExistingSubscriptionModal(false);
    hasInitialized.current = false; // Reset initialization flag
    setShouldProceedWithPayment(true);
    // Re-initialize payment by resetting state and letting useEffect handle it
    setState((prev) => ({ ...prev, loading: true, error: null, clientSecret: null, paymentId: null }));
  };

  const handleContinueWithExisting = () => {
    setShowExistingSubscriptionModal(false);
    router.push("/landing-page");
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

  // No error modal - errors redirect immediately, so this check is not needed

  return (
    <>
      <ExistingSubscriptionModal
        isOpen={showExistingSubscriptionModal}
        onClose={() => setShowExistingSubscriptionModal(false)}
        onCancelAndCreate={handleCancelAndCreate}
        onContinueWithExisting={handleContinueWithExisting}
        existingSubscription={existingSubscription}
      />

      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6 space-y-4">
        {state.success && (
          <Alert variant="default" className="bg-green-50 border-green-400 border-2 mb-4">
            <AlertDescription className="text-green-900">
              <div className="flex items-center gap-3">
                <svg className="w-8 h-8 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <div className="font-bold text-lg mb-1">🎉 Subscription Activated Successfully!</div>
                  <div className="text-sm font-medium">
                    Your payment was successful and your subscription is now active. Enjoy full access to all premium features!
                  </div>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {state.success ? "Subscription Complete" : (packageInfo?.name || "Subscription") + " Checkout"}
        </h1>
        {packageInfo?.description && (
          <p className="text-gray-600 mb-2">
            {packageInfo.description}
          </p>
        )}
        {packageInfo?.validityDays && (
          <p className="text-gray-600 mb-4">
            <strong>{packageInfo.validityDays} days</strong> of access
          </p>
        )}
        {state.amount && state.currency && (
          <p className="text-lg font-semibold mb-4">
            Amount: <strong>${Number(state.amount).toFixed(2)}</strong> {state.currency}
          </p>
        )}

        {/* Test Mode Notice */}
        {process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.includes("pk_test_") && (
          <Alert variant="default" className="bg-blue-50 border-blue-200 mb-4">
            <AlertDescription className="text-blue-800 text-sm">
              <div className="font-semibold mb-1">🧪 Test Mode</div>
              <div>Use Stripe test card: <code className="bg-blue-100 px-1 rounded">4242 4242 4242 4242</code></div>
              <div className="text-xs mt-1">Expiry: Any future date | CVC: Any 3 digits | ZIP: Any 5 digits</div>
            </AlertDescription>
          </Alert>
        )}

        {!state.success && state.clientSecret && state.clientSecret.length > 0 && (
          <Elements
            stripe={stripePromise}
            options={{ clientSecret: state.clientSecret }}
          >
            <CheckoutForm state={state} setState={setState} router={router} />
          </Elements>
        )}

        {!state.success && (!state.clientSecret || state.clientSecret.length === 0) && !state.loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Preparing checkout form...</p>
          </div>
        )}

        {state.success && (
          <div className="space-y-3 mt-4">
            <Button
              className="w-full"
              onClick={() => router.push("/dashboard?subscriptionSuccess=true")}
            >
              Go to Dashboard
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push("/landing-page")}
            >
              Back to Home
            </Button>
            {state.subscriptionId && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push("/admin/subscriptions")}
              >
                See My Subscription
              </Button>
            )}
          </div>
        )}

        {!state.success && (
          <Button
            variant="outline"
            className="w-full mt-2"
            onClick={() => router.push("/landing-page")}
          >
            Back to Home
          </Button>
        )}
        </div>
      </div>
    </>
  );
}


