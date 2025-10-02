# API Integration Guide

This document explains how the Next.js frontend integrates with the NestJS backend API.

## 🚀 Quick Start

### 1. Environment Setup

Create a `.env.local` file in the Next.js project root:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_USE_REAL_API=true

# App Configuration
NEXT_PUBLIC_APP_NAME=RideShare Pro
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### 2. Start the Backend

```bash
cd backend
npm install
npm run start:dev
```

The backend will run on `http://localhost:3000` with Swagger docs at `http://localhost:3000/api/docs`.

### 3. Start the Frontend

```bash
cd nextjs
npm install
npm run dev
```

The frontend will run on `http://localhost:3001`.

## 🔧 API Service Architecture

### Core Components

1. **API Service** (`src/shared/services/api.service.ts`)

   - Handles all HTTP requests to the backend
   - Includes authentication headers automatically
   - Provides error handling and logging
   - Supports all backend endpoints

2. **Auth Context** (`src/shared/contexts/auth-context.tsx`)

   - Manages authentication state
   - Integrates with API service for login/logout
   - Handles token storage and user data
   - Supports both real API and mock data modes

3. **Configuration** (`src/shared/config/api.config.ts`)
   - Centralized API configuration
   - Environment-based settings
   - Endpoint definitions

### API Endpoints

The API service supports all backend endpoints:

#### Authentication

- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `GET /auth/profile` - Get user profile
- `POST /auth/logout` - User logout

#### Users

- `GET /users` - Get all users
- `GET /users/:id` - Get user by ID
- `PATCH /users/:id` - Update user

#### Rides

- `GET /rides` - Get all rides
- `GET /rides/:id` - Get ride by ID
- `POST /rides` - Create ride
- `PATCH /rides/:id` - Update ride

#### Payments

- `GET /payments` - Get all payments
- `GET /payments/:id` - Get payment by ID
- `POST /payments` - Create payment

#### Notifications

- `GET /notifications` - Get all notifications
- `GET /notifications/user/:userId` - Get user notifications
- `POST /notifications` - Create notification
- `POST /notifications/:id/read` - Mark as read

#### Chat

- `GET /chat/rooms` - Get chat rooms
- `GET /chat/rooms/user/:userId` - Get user chat rooms
- `POST /chat/rooms` - Create chat room
- `GET /chat/rooms/:roomId/messages` - Get messages
- `POST /chat/messages` - Send message

#### Locations

- `POST /locations/driver/:driverId/location` - Update driver location
- `GET /locations/driver/:driverId/location` - Get driver location
- `GET /locations/nearby-drivers` - Get nearby drivers
- `POST /locations/addresses` - Create address
- `GET /locations/addresses/user/:userId` - Get user addresses

## 🔐 Authentication Flow

### Login Process

1. User submits login form
2. Auth context validates credentials
3. API service calls `POST /auth/login`
4. Backend returns JWT token and user data
5. Token stored in localStorage
6. User profile fetched via `GET /auth/profile`
7. User state updated in context

### Logout Process

1. User clicks logout
2. API service calls `POST /auth/logout`
3. Token blacklisted on backend
4. Local storage cleared
5. User state reset

### Token Management

- JWT tokens stored in localStorage as `access_token`
- Automatically included in API requests via Authorization header
- Token validation handled by backend
- Automatic logout on token expiration

## 🎭 Development vs Production

### Development Mode

- Uses mock data by default (set `NEXT_PUBLIC_USE_REAL_API=false`)
- Detailed console logging
- Simulated API delays
- No real backend required

### Production Mode

- Always uses real API
- Minimal logging
- Real backend integration required
- Error handling optimized

## 🛠️ Usage Examples

### Using the API Service

```typescript
import { apiService } from "../shared/services/api.service";

// Login
const response = await apiService.login({
  email: "user@example.com",
  password: "password123",
});

// Get user profile
const profile = await apiService.getProfile();

// Get rides
const rides = await apiService.getRides();

// Create a ride
const newRide = await apiService.createRide({
  pickupLocation: "123 Main St",
  dropoffLocation: "456 Oak Ave",
  // ... other ride data
});
```

### Using the Auth Context

```typescript
import { useAuth } from "../shared/contexts/auth-context";

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();

  const handleLogin = async () => {
    try {
      await login("user@example.com", "password123");
      // User is now logged in
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = async () => {
    await logout();
    // User is now logged out
  };

  return (
    <div>
      {isAuthenticated ? (
        <div>
          <p>Welcome, {user?.name}!</p>
          <button onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  );
}
```

## 🐛 Error Handling

The API service provides comprehensive error handling:

```typescript
try {
  const data = await apiService.login(credentials);
} catch (error) {
  if (error.status === 401) {
    // Invalid credentials
    console.error("Login failed: Invalid credentials");
  } else if (error.status === 0) {
    // Network error
    console.error("Network error: Check your connection");
  } else {
    // Other errors
    console.error("Login failed:", error.message);
  }
}
```

## 🔍 Debugging

### Console Logs

The API service provides detailed logging:

- `🌐 Making API request to: [URL]` - Request initiation
- `📋 Request options: [details]` - Request configuration
- `✅ API request successful: [data]` - Successful response
- `❌ API request failed: [error]` - Error response

### Network Tab

Check the browser's Network tab to see:

- Request/response headers
- Request/response bodies
- Response status codes
- Timing information

## 🚀 Deployment

### Environment Variables

Set these environment variables in production:

```bash
NEXT_PUBLIC_API_URL=https://your-api-domain.com
NEXT_PUBLIC_USE_REAL_API=true
NEXT_PUBLIC_APP_NAME=RideShare Pro
```

### CORS Configuration

Ensure your backend allows requests from your frontend domain:

```typescript
// In your NestJS main.ts
app.enableCors({
  origin: ["http://localhost:3001", "https://your-frontend-domain.com"],
  credentials: true,
});
```

## 📚 Additional Resources

- [Backend API Documentation](../backend/README.md)
- [Angular Implementation Reference](../angular/README.md)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Next.js Documentation](https://nextjs.org/docs)
