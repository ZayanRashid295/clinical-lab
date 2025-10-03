import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

export async function seedBase(prisma: PrismaClient) {
  console.log("🌱 Starting database seeding...");

  // Create roles
  console.log("📝 Creating roles...");
  const passengerRole = await prisma.role.upsert({
    where: { name: "PASSENGER" },
    update: {},
    create: {
      name: "PASSENGER",
      description: "Regular users who book rides",
      isActive: true,
    },
  });

  const driverRole = await prisma.role.upsert({
    where: { name: "DRIVER" },
    update: {},
    create: {
      name: "DRIVER",
      description: "Users who provide ride services",
      isActive: true,
    },
  });

  const adminRole = await prisma.role.upsert({
    where: { name: "ADMIN" },
    update: {},
    create: {
      name: "ADMIN",
      description: "Platform administrators",
      isActive: true,
    },
  });

  const supportRole = await prisma.role.upsert({
    where: { name: "SUPPORT" },
    update: {},
    create: {
      name: "SUPPORT",
      description: "Customer support agents",
      isActive: true,
    },
  });

  const fleetManagerRole = await prisma.role.upsert({
    where: { name: "FLEET_MANAGER" },
    update: {},
    create: {
      name: "FLEET_MANAGER",
      description: "Fleet management personnel",
      isActive: true,
    },
  });

  // Create permissions
  console.log("🔐 Creating permissions...");
  const permissions = [
    // User permissions
    {
      name: "user:read",
      description: "Read user information",
      resource: "user",
      action: "read",
    },
    {
      name: "user:update",
      description: "Update user information",
      resource: "user",
      action: "update",
    },
    {
      name: "user:delete",
      description: "Delete user",
      resource: "user",
      action: "delete",
    },

    // Ride permissions
    {
      name: "ride:create",
      description: "Create ride request",
      resource: "ride",
      action: "create",
    },
    {
      name: "ride:read",
      description: "Read ride information",
      resource: "ride",
      action: "read",
    },
    {
      name: "ride:update",
      description: "Update ride status",
      resource: "ride",
      action: "update",
    },
    {
      name: "ride:accept",
      description: "Accept ride requests",
      resource: "ride",
      action: "accept",
    },

    // Payment permissions
    {
      name: "payment:create",
      description: "Process payments",
      resource: "payment",
      action: "create",
    },
    {
      name: "payment:read",
      description: "View payment information",
      resource: "payment",
      action: "read",
    },
    {
      name: "payment:refund",
      description: "Process refunds",
      resource: "payment",
      action: "refund",
    },

    // Admin permissions
    {
      name: "admin:all",
      description: "Full admin access",
      resource: "admin",
      action: "all",
    },
    {
      name: "analytics:read",
      description: "View analytics",
      resource: "analytics",
      action: "read",
    },
    {
      name: "support:manage",
      description: "Manage support tickets",
      resource: "support",
      action: "manage",
    },
  ];

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: {},
      create: permission,
    });
  }

  // Create users
  console.log("👥 Creating users...");
  const hashedPassword = await bcrypt.hash("password123", 10);

  // Passenger users
  const passenger1 = await prisma.user.upsert({
    where: { email: "john.doe@example.com" },
    update: {},
    create: {
      email: "john.doe@example.com",
      password: hashedPassword,
      firstName: "John",
      lastName: "Doe",
      phone: "+1234567890",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      isActive: true,
    },
  });

  const passenger2 = await prisma.user.upsert({
    where: { email: "jane.smith@example.com" },
    update: {},
    create: {
      email: "jane.smith@example.com",
      password: hashedPassword,
      firstName: "Jane",
      lastName: "Smith",
      phone: "+1234567891",
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
      isActive: true,
    },
  });

  // Driver users
  const driver1 = await prisma.user.upsert({
    where: { email: "mike.wilson@example.com" },
    update: {},
    create: {
      email: "mike.wilson@example.com",
      password: hashedPassword,
      firstName: "Mike",
      lastName: "Wilson",
      phone: "+1234567892",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      isActive: true,
    },
  });

  const driver2 = await prisma.user.upsert({
    where: { email: "sarah.johnson@example.com" },
    update: {},
    create: {
      email: "sarah.johnson@example.com",
      password: hashedPassword,
      firstName: "Sarah",
      lastName: "Johnson",
      phone: "+1234567893",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      isActive: true,
    },
  });

  // Admin user
  const admin = await prisma.user.upsert({
    where: { email: "admin@uber.com" },
    update: {},
    create: {
      email: "admin@uber.com",
      password: hashedPassword,
      firstName: "Admin",
      lastName: "User",
      phone: "+1234567894",
      isActive: true,
    },
  });

  // Support user
  const support = await prisma.user.upsert({
    where: { email: "support@uber.com" },
    update: {},
    create: {
      email: "support@uber.com",
      password: hashedPassword,
      firstName: "Support",
      lastName: "Agent",
      phone: "+1234567895",
      isActive: true,
    },
  });

  // Fleet manager
  const fleetManager = await prisma.user.upsert({
    where: { email: "fleet@uber.com" },
    update: {},
    create: {
      email: "fleet@uber.com",
      password: hashedPassword,
      firstName: "Fleet",
      lastName: "Manager",
      phone: "+1234567896",
      isActive: true,
    },
  });

  // Assign roles to users
  console.log("🔗 Assigning roles to users...");

  // Passenger roles
  await prisma.userRole.upsert({
    where: {
      userId_roleId: { userId: passenger1.id, roleId: passengerRole.id },
    },
    update: {},
    create: { userId: passenger1.id, roleId: passengerRole.id },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: { userId: passenger2.id, roleId: passengerRole.id },
    },
    update: {},
    create: { userId: passenger2.id, roleId: passengerRole.id },
  });

  // Driver roles
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: driver1.id, roleId: driverRole.id } },
    update: {},
    create: { userId: driver1.id, roleId: driverRole.id },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: driver2.id, roleId: driverRole.id } },
    update: {},
    create: { userId: driver2.id, roleId: driverRole.id },
  });

  // Admin role
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: adminRole.id } },
    update: {},
    create: { userId: admin.id, roleId: adminRole.id },
  });

  // Support role
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: support.id, roleId: supportRole.id } },
    update: {},
    create: { userId: support.id, roleId: supportRole.id },
  });

  // Fleet manager role
  await prisma.userRole.upsert({
    where: {
      userId_roleId: { userId: fleetManager.id, roleId: fleetManagerRole.id },
    },
    update: {},
    create: { userId: fleetManager.id, roleId: fleetManagerRole.id },
  });

  // Create user settings
  console.log("⚙️ Creating user settings...");
  const users = [
    passenger1,
    passenger2,
    driver1,
    driver2,
    admin,
    support,
    fleetManager,
  ];

  for (const user of users) {
    await prisma.userSettings.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        language: "en",
        timezone: "UTC",
        notifications: {
          email: true,
          push: true,
          sms: false,
        },
        privacySettings: {
          shareLocation: true,
          sharePhone: false,
        },
      },
    });
  }

  // Create locations
  console.log("📍 Creating locations...");
  const locations = [
    {
      name: "Downtown Office",
      address: "123 Main St, Downtown, City, State 12345",
      latitude: 40.7128,
      longitude: -74.006,
      city: "New York",
      state: "NY",
      country: "USA",
      postalCode: "10001",
    },
    {
      name: "Airport Terminal",
      address: "456 Airport Blvd, Airport, City, State 12345",
      latitude: 40.6892,
      longitude: -74.1745,
      city: "New York",
      state: "NY",
      country: "USA",
      postalCode: "10002",
    },
    {
      name: "Shopping Mall",
      address: "789 Mall Ave, Shopping District, City, State 12345",
      latitude: 40.7589,
      longitude: -73.9851,
      city: "New York",
      state: "NY",
      country: "USA",
      postalCode: "10003",
    },
  ];

  // Create wallets
  console.log("💰 Creating wallets...");
  await prisma.wallet.create({
    data: {
      userId: passenger1.id,
      balance: 50.0,
      currency: "USD",
      isActive: true,
    },
  });

  await prisma.wallet.create({
    data: {
      userId: passenger2.id,
      balance: 25.0,
      currency: "USD",
      isActive: true,
    },
  });

  await prisma.wallet.create({
    data: {
      userId: driver1.id,
      balance: 150.0,
      currency: "USD",
      isActive: true,
    },
  });

  await prisma.wallet.create({
    data: {
      userId: driver2.id,
      balance: 200.0,
      currency: "USD",
      isActive: true,
    },
  });

  // Create payment methods
  console.log("💳 Creating payment methods...");
  await prisma.paymentMethod.create({
    data: {
      userId: passenger1.id,
      type: "CARD",
      provider: "stripe",
      providerId: "pm_1234567890",
      isDefault: true,
      isActive: true,
      metadata: {
        last4: "4242",
        brand: "visa",
        expMonth: 12,
        expYear: 2025,
      },
    },
  });

  await prisma.paymentMethod.create({
    data: {
      userId: passenger2.id,
      type: "CARD",
      provider: "stripe",
      providerId: "pm_0987654321",
      isDefault: true,
      isActive: true,
      metadata: {
        last4: "5555",
        brand: "mastercard",
        expMonth: 8,
        expYear: 2026,
      },
    },
  });

  // Create chat rooms
  console.log("💬 Creating chat rooms...");
  const chatRoom1 = await prisma.chatRoom.create({
    data: {
      name: "Ride Chat - Trip #1",
      type: "RIDE",
      isActive: true,
    },
  });

  const chatRoom2 = await prisma.chatRoom.create({
    data: {
      name: "Ride Chat - Trip #2",
      type: "RIDE",
      isActive: true,
    },
  });

  // Add participants to chat rooms
  await prisma.chatParticipant.create({
    data: {
      chatRoomId: chatRoom1.id,
      userId: passenger1.id,
      role: "MEMBER",
    },
  });

  await prisma.chatParticipant.create({
    data: {
      chatRoomId: chatRoom1.id,
      userId: driver1.id,
      role: "MEMBER",
    },
  });

  await prisma.chatParticipant.create({
    data: {
      chatRoomId: chatRoom2.id,
      userId: passenger2.id,
      role: "MEMBER",
    },
  });

  await prisma.chatParticipant.create({
    data: {
      chatRoomId: chatRoom2.id,
      userId: driver2.id,
      role: "MEMBER",
    },
  });

  // Create chat messages
  console.log("📝 Creating chat messages...");
  await prisma.chatMessage.create({
    data: {
      chatRoomId: chatRoom1.id,
      senderId: passenger1.id,
      content: "Hi, I'm at the pickup location. I'm wearing a blue jacket.",
      type: "TEXT",
    },
  });

  await prisma.chatMessage.create({
    data: {
      chatRoomId: chatRoom1.id,
      senderId: driver1.id,
      content: "Perfect! I can see you. I'll be there in 2 minutes.",
      type: "TEXT",
    },
  });

  // Create notification preferences
  console.log("🔕 Creating notification preferences...");
  const allUsers = [
    passenger1,
    passenger2,
    driver1,
    driver2,
    admin,
    support,
    fleetManager,
  ];

  for (const user of allUsers) {
    await prisma.notificationPreference.create({
      data: {
        userId: user.id,
        emailEnabled: true,
        smsEnabled: false,
        pushEnabled: true,
        preferences: {
          rideUpdates: true,
          promotions: true,
          security: true,
          marketing: false,
        },
      },
    });
  }

  // Create promo codes
  console.log("🎟️ Creating promo codes...");
  await prisma.promoCode.create({
    data: {
      code: "WELCOME10",
      description: "Welcome bonus for new users",
      type: "PERCENTAGE",
      value: 10.0,
      minAmount: 20.0,
      maxDiscount: 5.0,
      usageLimit: 1000,
      usedCount: 0,
      isActive: true,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
  });

  await prisma.promoCode.create({
    data: {
      code: "FIRSTRIDE",
      description: "Free first ride up to $10",
      type: "FIXED_AMOUNT",
      value: 10.0,
      minAmount: 10.0,
      maxDiscount: 10.0,
      usageLimit: 500,
      usedCount: 0,
      isActive: true,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
    },
  });

  // Create system settings
  console.log("⚙️ Creating system settings...");
  const systemSettings = [
    { key: "app_name", value: "Uber Clone", type: "string" },
    { key: "max_ride_distance", value: "50", type: "number" },
    { key: "base_fare", value: "2.50", type: "number" },
    { key: "per_km_rate", value: "1.50", type: "number" },
    { key: "per_minute_rate", value: "0.25", type: "number" },
    { key: "maintenance_mode", value: "false", type: "boolean" },
    {
      key: "supported_currencies",
      value: '["USD", "EUR", "GBP"]',
      type: "json",
    },
  ];

  for (const setting of systemSettings) {
    await prisma.systemSettings.create({
      data: setting,
    });
  }

  console.log("✅ Database seeding completed successfully!");
  console.log("\n📊 Summary:");
  console.log(`- Users created: ${allUsers.length}`);
  console.log(`- Roles created: 5`);
  console.log(`- Permissions created: ${permissions.length}`);
  console.log(`- Rides created: 2`);
  console.log(`- Chat rooms created: 2`);
  console.log(`- Notifications created: 2`);
  console.log(`- Promo codes created: 2`);
  console.log(`- System settings created: ${systemSettings.length}`);
  console.log(`- Payout fees created: 3`);
  console.log(`- Payout settings created: 2`);
  console.log(`- Earnings created: 1`);
  console.log(`- Payouts created: 2`);
  console.log(`- Payout schedules created: 2`);

  console.log("\n🔑 Test Credentials:");
  console.log("Passenger: john.doe@example.com / password123");
  console.log("Driver: mike.wilson@example.com / password123");
  console.log("Admin: admin@uber.com / password123");
  console.log("Support: support@uber.com / password123");
  console.log("Fleet Manager: fleet@uber.com / password123");
}
