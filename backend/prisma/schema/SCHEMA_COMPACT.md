## 👤 base.schema.prisma

**Purpose:** Core application entities & authentication

### Models (7):

- **User** `[id, email, password, phone, firstName, lastName, avatar, isActive, timestamps]`
  - Relations: settings, permissions, roles, rides, chats, payments, payouts, notifications, locations
- **UserSettings** `[id, userId, language, timezone, notifications, privacySettings, timestamps]`
- **Role** `[id, name, description, isActive, timestamps]`
- **Permission** `[id, name, description, resource, action, isActive, timestamps]`
- **UserRole** `[id, userId, roleId]` (junction)
- **UserPermission** `[id, userId, permissionId]` (junction)
- **RolePermission** `[id, roleId, permissionId]` (junction)
- **AuditLog** `[id, userId, action, resource, resourceId, details, ipAddress, userAgent, createdAt]`
- **SystemSettings** `[id, key, value, type, isActive, timestamps]`

---

## 💬 chat.schema.prisma

**Purpose:** Real-time messaging & chat functionality

### Models (4):

- **ChatRoom** `[id, name, type, isActive, timestamps]`
  - Relations: participants, messages, readStatus
- **ChatParticipant** `[id, chatRoomId, userId, role, joinedAt, leftAt]`
- **ChatMessage** `[id, chatRoomId, senderId, content, type, metadata, isEdited, editedAt, isDeleted, deletedAt, createdAt]`
  - Relations: reactions
- **ChatMessageReaction** `[id, messageId, userId, emoji, createdAt]`
- **ChatReadStatus** `[id, chatRoomId, userId, lastReadMessageId, lastReadAt]`

### Enums (3):

- **ChatType:** DIRECT, GROUP, SUPPORT, RIDE
- **ChatRole:** ADMIN, MODERATOR, MEMBER
- **MessageType:** TEXT, IMAGE, FILE, LOCATION, SYSTEM

---

## 📍 location.schema.prisma

**Purpose:** GPS tracking, mapping, geofencing

### Models (7):

- **Location** `[id, name, address, lat/lng, city, state, country, postalCode, createdAt]`
  - Relations: pickupRides, dropoffRides
- **DriverLocation** `[id, driverId, lat/lng, heading, speed, accuracy, isActive, createdAt]`
- **Address** `[id, userId, name, address, lat/lng, city, state, country, postalCode, isDefault, isActive, timestamps]`
- **Geofence** `[id, name, description, type, centerLat/Lng, radius, polygon, isActive, timestamps]`
  - Relations: events
- **GeofenceEvent** `[id, geofenceId, userId, eventType, lat/lng, createdAt]`
- **Route** `[id, name, originLat/Lng, destinationLat/Lng, waypoints, distance, duration, isActive, timestamps]`
- **TrafficData** `[id, lat/lng, congestion, speed, timestamp]`
- **ServiceArea** `[id, name, city, state, country, polygon, isActive, timestamps]`

### Enums (2):

- **GeofenceType:** CIRCULAR, POLYGON
- **GeofenceEventType:** ENTER, EXIT, DWELL

---

## 🔔 notification.schema.prisma

**Purpose:** Push notifications, alerts, messaging

### Models (5):

- **Notification** `[id, userId, type, title, message, data, isRead, isSent, sentAt, readAt, createdAt]`
- **NotificationTemplate** `[id, name, type, title, message, isActive, timestamps]`
- **NotificationPreference** `[id, userId, emailEnabled, smsEnabled, pushEnabled, preferences, timestamps]`
- **NotificationQueue** `[id, userId, type, title, message, data, channel, status, priority, attempts, maxAttempts, scheduledAt, processedAt, failedAt, error, timestamps]`
- **NotificationLog** `[id, notificationId, userId, type, channel, status, provider, providerId, error, sentAt, deliveredAt, readAt, createdAt]`

### Enums (4):

- **NotificationType:** RIDE_REQUEST, RIDE_ACCEPTED, RIDE_CANCELLED, RIDE_COMPLETED, PAYMENT_SUCCESS, PAYMENT_FAILED, PROMO_CODE, SECURITY_ALERT, SYSTEM_UPDATE, GENERAL
- **NotificationChannel:** EMAIL, SMS, PUSH, IN_APP
- **QueueStatus:** PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED
- **DeliveryStatus:** PENDING, SENT, DELIVERED, FAILED, BOUNCED, COMPLAINED

---

## 💳 payment.schema.prisma

**Purpose:** Billing, transactions, wallets, promo codes

### Models (6):

- **Payment** `[id, userId, rideId, amount, currency, status, method, transactionId, gateway, gatewayData, description, timestamps]`
  - Relations: refunds, walletTransaction, promoCodeUsages
- **Refund** `[id, paymentId, amount, reason, status, gatewayRefundId, processedAt, timestamps]`
- **Wallet** `[id, userId, balance, currency, isActive, timestamps]`
  - Relations: transactions
- **WalletTransaction** `[id, walletId, paymentId, type, amount, balance, description, reference, createdAt]`
- **PaymentMethod** `[id, userId, type, provider, providerId, isDefault, isActive, metadata, timestamps]`
- **PromoCode** `[id, code, description, type, value, minAmount, maxDiscount, usageLimit, usedCount, isActive, validFrom, validUntil, timestamps]`
  - Relations: usages
- **PromoCodeUsage** `[id, promoCodeId, userId, paymentId, discount, createdAt]`

### Enums (5):

- **PaymentStatus:** PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED, REFUNDED
- **PaymentMethodType:** CARD, WALLET, CASH, BANK_TRANSFER
- **PaymentGateway:** STRIPE, PAYPAL, RAZORPAY, SQUARE
- **RefundStatus:** PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED
- **WalletTransactionType:** CREDIT, DEBIT, REFUND, BONUS, PENALTY
- **PromoType:** PERCENTAGE, FIXED_AMOUNT, FREE_RIDE

---

## 💰 payout.schema.prisma

**Purpose:** Driver earnings, payouts, commission management

### Models (6):

- **Payout** `[id, driverId, amount, currency, status, payoutMethod, transactionId, description, scheduledAt, processedAt, timestamps]`
  - Relations: payoutItems, payoutMethodDetails, earnings
- **PayoutItem** `[id, payoutId, rideId, amount, fee, netAmount, createdAt]`
- **PayoutMethodDetails** `[id, payoutId, method, provider, providerId, accountDetails, metadata, timestamps]`
- **PayoutSchedule** `[id, driverId, frequency, dayOfWeek, dayOfMonth, minimumAmount, isActive, lastProcessedAt, nextScheduledAt, timestamps]`
- **PayoutSettings** `[id, driverId, defaultPayoutMethod, autoPayout, minimumPayoutAmount, payoutFrequency, taxSettings, notifications, timestamps]`
- **Earnings** `[id, driverId, rideId, grossEarnings, platformFee, netEarnings, payoutId, status, calculatedAt, paidOutAt, timestamps]`
- **PayoutFee** `[id, name, type, value, percentage, isActive, appliesTo, timestamps]`

### Enums (5):

- **PayoutStatus:** PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED
- **PayoutMethod:** BANK_TRANSFER, PAYPAL, STRIPE_CONNECT, CASH, WALLET
- **PayoutFrequency:** DAILY, WEEKLY, BIWEEKLY, MONTHLY, MANUAL
- **EarningsStatus:** PENDING, PAID_OUT, DISPUTED, REFUNDED
- **FeeType:** FIXED, PERCENTAGE

---

## 🚗 ride.schema.prisma

**Purpose:** Ride management, matching, reviews

### Models (3):

- **Ride** `[id, passengerId, driverId, status, fare, distance, duration, startTime, endTime, pickupLocationId, dropoffLocationId, pickupLat/Lng, dropoffLat/Lng, metadata, timestamps]`
  - Relations: payments, rideReviews, rideMessages, payoutItems, earnings
- **RideReview** `[id, rideId, reviewerId, revieweeId, rating, comment, createdAt]`
- **RideMessage** `[id, rideId, senderId, message, createdAt]`

### Enums (1):

- **RideStatus:** REQUESTED, ACCEPTED, ARRIVING, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW

---
