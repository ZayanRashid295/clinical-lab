/**
 * Test file for PaymentService transformation
 * This helps verify that backend data is properly transformed
 */

import { paymentService } from "../paymentService";

// Sample backend data (from your actual backend response)
const sampleBackendData = [
  {
    id: "cmft2glv4002943adu6iziimg",
    userId: "cmft2glrx000i43adbyhxwqhe",
    rideId: "cmft2gluw002543adbdu24t8t",
    amount: "15.5",
    currency: "USD",
    status: "COMPLETED",
    method: "CARD",
    transactionId: "txn_1234567890",
    gateway: "STRIPE",
    gatewayData: {
      chargeId: "ch_1234567890",
      balanceTransaction: "txn_1234567890",
    },
    description: "Ride payment for trip #1",
    createdAt: "2025-09-21T02:16:38.320Z",
    updatedAt: "2025-09-21T02:16:38.320Z",
    user: {
      id: "cmft2glrx000i43adbyhxwqhe",
      email: "john.doe@example.com",
      password: "$2a$10$1Z6dAvLBzBjfrtLgnJQm/OpMasbT1jCo9/KxAE8zjrlUeIzFKv18u",
      phone: "+1234567890",
      firstName: "John",
      lastName: "Doe",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      isActive: true,
      createdAt: "2025-09-21T02:16:38.206Z",
      updatedAt: "2025-09-22T12:06:37.015Z",
    },
    ride: {
      id: "cmft2gluw002543adbdu24t8t",
      passengerId: "cmft2glrx000i43adbyhxwqhe",
      driverId: "cmft2gls6000k43adgxixk6b2",
      status: "COMPLETED",
      fare: "15.5",
      distance: 5.2,
      duration: 18,
      startTime: "2024-01-15T10:00:00.000Z",
      endTime: "2024-01-15T10:18:00.000Z",
      createdAt: "2025-09-21T02:16:38.312Z",
      updatedAt: "2025-09-21T02:16:38.312Z",
      pickupLocationId: "cmft2gltq001h43ad9dmgbp7a",
      dropoffLocationId: "cmft2gltt001i43adpo3xc5dt",
      pickupLatitude: 40.7128,
      pickupLongitude: -74.006,
      dropoffLatitude: 40.6892,
      dropoffLongitude: -74.1745,
      metadata: null,
    },
  },
];

// Test function to verify transformation
export function testPaymentTransformation() {
  console.log("🧪 Testing Payment Transformation");
  console.log("=====================================");

  // Access the private transformPayment method for testing
  const paymentServiceInstance = paymentService as any;

  try {
    const transformedPayment = paymentServiceInstance.transformPayment(
      sampleBackendData[0]
    );

    console.log("✅ Transformation successful!");
    console.log("Original backend data:", sampleBackendData[0]);
    console.log("Transformed payment:", transformedPayment);

    // Verify key transformations
    console.log("\n🔍 Verification:");
    console.log(
      "- Amount converted to number:",
      typeof transformedPayment.amount === "number"
    );
    console.log("- User name constructed:", transformedPayment.user?.name);
    console.log("- Gateway data preserved:", !!transformedPayment.gatewayData);
    console.log("- Ride data included:", !!transformedPayment.ride);

    return transformedPayment;
  } catch (error) {
    console.error("❌ Transformation failed:", error);
    return null;
  }
}

// Test function to verify response handling
export function testResponseHandling() {
  console.log("\n🧪 Testing Response Handling");
  console.log("==============================");

  const paymentServiceInstance = paymentService as any;

  try {
    // Test array response (your current backend format)
    const arrayResponse = sampleBackendData;
    const result1 = paymentServiceInstance.handleBackendResponse(
      arrayResponse,
      { page: 1, limit: 10 }
    );
    console.log("✅ Array response handling successful!");
    console.log("Result:", result1);

    // Test paginated response (if backend changes format)
    const paginatedResponse = {
      data: sampleBackendData,
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      },
    };
    const result2 = paymentServiceInstance.handleBackendResponse(
      paginatedResponse,
      { page: 1, limit: 10 }
    );
    console.log("✅ Paginated response handling successful!");
    console.log("Result:", result2);
  } catch (error) {
    console.error("❌ Response handling failed:", error);
  }
}

// Run tests if this file is executed directly
if (typeof window !== "undefined") {
  // Browser environment
  (window as any).testPaymentTransformation = testPaymentTransformation;
  (window as any).testResponseHandling = testResponseHandling;
  console.log("🧪 Test functions available in browser console:");
  console.log("- testPaymentTransformation()");
  console.log("- testResponseHandling()");
}
