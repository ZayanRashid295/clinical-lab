export interface CreateCustomerParams {
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}

export interface CreateCustomerResult {
  customerId: string;
}

export interface CreateSetupIntentParams {
  customerId: string;
  metadata?: Record<string, string>;
}

export interface CreateSetupIntentResult {
  clientSecret: string;
  setupIntentId: string;
}

export interface AttachPaymentMethodParams {
  customerId: string;
  paymentMethodId: string;
}

export interface CreateSubscriptionParams {
  customerId: string;
  priceId: string;
  paymentMethodId: string;
  trialDays?: number;
  couponId?: string;
  metadata?: Record<string, string>;
}

export interface CreateSubscriptionResult {
  subscriptionId: string;
  status: string;
  trialEnd?: Date;
  currentPeriodEnd?: Date;
}

export interface UpdateSubscriptionParams {
  subscriptionId: string;
  priceId?: string;
  cancelAtPeriodEnd?: boolean;
  paymentMethodId?: string;
}

export interface CreatePriceParams {
  productId: string;
  amount: number;
  currency: string;
  interval: "month" | "year";
}

export interface CreatePriceResult {
  priceId: string;
}

export interface CreateProductParams {
  name: string;
  description?: string;
  metadata?: Record<string, string>;
}

export interface CreateProductResult {
  productId: string;
}

export interface PaymentProvider {
  readonly name: string;
  createCustomer(params: CreateCustomerParams): Promise<CreateCustomerResult>;
  createSetupIntent(params: CreateSetupIntentParams): Promise<CreateSetupIntentResult>;
  attachPaymentMethod(params: AttachPaymentMethodParams): Promise<void>;
  setDefaultPaymentMethod(customerId: string, paymentMethodId: string): Promise<void>;
  createSubscription(params: CreateSubscriptionParams): Promise<CreateSubscriptionResult>;
  updateSubscription(params: UpdateSubscriptionParams): Promise<void>;
  cancelSubscription(subscriptionId: string, atPeriodEnd?: boolean): Promise<void>;
  resumeSubscription(subscriptionId: string): Promise<void>;
  createProduct(params: CreateProductParams): Promise<CreateProductResult>;
  createPrice(params: CreatePriceParams): Promise<CreatePriceResult>;
  updateProduct(productId: string, params: Partial<CreateProductParams>): Promise<void>;
  retrievePaymentMethod(paymentMethodId: string): Promise<{
    brand?: string;
    last4?: string;
    expMonth?: number;
    expYear?: number;
  }>;
  verifyWebhook(payload: string | Buffer, signature: string): unknown;
}

export const PAYMENT_PROVIDER = Symbol("PAYMENT_PROVIDER");
