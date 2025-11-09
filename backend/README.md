# Uber Backend API

A comprehensive backend API for an Uber-like application built with NestJS, Prisma, and Swagger, featuring a multi-file Prisma schema architecture.

## 🚀 Features

- **Multi-file Prisma Schema**: Organized schema files for different modules
- **NestJS Framework**: Modern, scalable Node.js framework
- **Swagger Documentation**: Auto-generated API documentation
- **JWT Authentication**: Secure user authentication
- **Modular Architecture**: Well-organized modules for different features
- **TypeScript**: Full type safety throughout the application

## 📁 Project Structure

```
backend/
├── prisma/
│   ├── schemas/
│   │   ├── base.schema.prisma          # Core tables (users, roles, permissions)
│   │   ├── ride.schema.prisma          # Ride-related tables
│   │   ├── chat.schema.prisma          # Chat and messaging tables
│   │   ├── payment.schema.prisma       # Payment and billing tables
│   │   ├── notification.schema.prisma  # Notification system tables
│   │   └── location.schema.prisma      # Location and mapping tables
│   └── schema.prisma                   # Main schema file (imports all schemas)
├── src/
│   ├── common/
│   │   └── prisma/                     # Prisma service and module
│   ├── modules/
│   │   ├── auth/                       # Authentication module
│   │   ├── users/                      # User management
│   │   ├── rides/                      # Ride management
│   │   ├── payments/                   # Payment processing
│   │   ├── notifications/              # Notification system
│   │   ├── chat/                       # Chat and messaging
│   │   └── locations/                  # Location services
│   ├── app.module.ts
│   └── main.ts
├── package.json
├── tsconfig.json
└── README.md
```

## 🗄️ Database Schema

### Base Schema (`base.schema.prisma`)
- **Users**: Core user information
- **UserSettings**: User preferences and settings
- **Roles & Permissions**: Role-based access control
- **AuditLog**: System audit trail
- **SystemSettings**: Application configuration

### Module Schemas
- **Ride Schema**: Rides, reviews, messages, locations
- **Chat Schema**: Chat rooms, messages, participants
- **Payment Schema**: Payments, wallets, refunds, promo codes
- **Notification Schema**: Notifications, templates, preferences
- **Location Schema**: Driver locations, addresses, geofences

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run prisma:generate
   
   # Push schema to database
   npm run prisma:push
   
   # Or run migrations
   npm run prisma:migrate
   ```

5. **Start the application**
   ```bash
   # Development mode
   npm run start:dev
   
   # Production mode
   npm run build
   npm run start:prod
   ```

## 📚 API Documentation

Once the application is running, you can access the Swagger documentation at:
- **Swagger UI**: `http://localhost:3001/api/docs`

## 🔧 Available Scripts

- `npm run start:dev` - Start in development mode with hot reload
- `npm run build` - Build the application
- `npm run start:prod` - Start in production mode
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:push` - Push schema changes to database
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio

## 🔐 Authentication

The API uses JWT-based authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 📋 API Endpoints

### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login user
- `GET /auth/profile` - Get user profile

### Users
- `GET /users` - Get all users
- `GET /users/:id` - Get user by ID
- `PATCH /users/:id` - Update user
- `DELETE /users/:id` - Deactivate user

### Rides
- `POST /rides` - Create ride request
- `GET /rides` - Get all rides
- `GET /rides/:id` - Get ride by ID
- `PATCH /rides/:id` - Update ride status

### Payments
- `POST /payments` - Process payment
- `GET /payments` - Get all payments
- `GET /payments/:id` - Get payment by ID

### Notifications
- `POST /notifications` - Create notification
- `GET /notifications` - Get all notifications
- `GET /notifications/user/:userId` - Get user notifications
- `POST /notifications/:id/read` - Mark notification as read

### Chat
- `POST /chat/rooms` - Create chat room
- `POST /chat/messages` - Send message
- `GET /chat/rooms/user/:userId` - Get user chat rooms
- `GET /chat/rooms/:roomId/messages` - Get room messages

### Locations
- `POST /locations/driver/:driverId/location` - Update driver location
- `GET /locations/driver/:driverId/location` - Get driver location
- `GET /locations/nearby-drivers` - Get nearby drivers
- `POST /locations/addresses` - Create address
- `GET /locations/addresses/user/:userId` - Get user addresses

## 🏗️ Multi-file Prisma Schema

The project uses a multi-file Prisma schema approach for better organization:

1. **Base Schema**: Contains core application tables
2. **Module Schemas**: Each feature module has its own schema file
3. **Main Schema**: Imports all schema files using the `import` directive

This approach provides:
- Better code organization
- Easier maintenance
- Clear separation of concerns
- Team collaboration benefits

## 🚀 Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Set up production environment variables**

3. **Run database migrations**
   ```bash
   npm run prisma:migrate
   ```

4. **Start the application**
   ```bash
   npm run start:prod
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
