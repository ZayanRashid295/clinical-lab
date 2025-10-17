# Next.js Uber Portal

A dynamic, role-based dashboard application built with Next.js, TypeScript, and Tailwind CSS, featuring API integration and authentication.

## Features

- **Dynamic Menu System**: Role-based navigation with hierarchical menu structure
- **Authentication**: JWT-based authentication with API integration and fallback
- **Role-Based Access Control**: Different user experiences for Admin, Driver, Passenger, and Fleet Manager
- **API Integration**: Centralized API service with graceful fallback to mock data
- **Responsive Design**: Mobile-friendly interface using Tailwind CSS
- **TypeScript**: Full type safety throughout the application

## Getting Started

First, install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## API Integration

This frontend includes API integration with fallback to mock authentication:

- **API Service**: Centralized service for all backend API calls
- **Authentication**: Real API calls with graceful fallback
- **Environment**: Configurable API base URL via `NEXT_PUBLIC_API_URL`

### Environment Setup

Create a `.env.local` file for API configuration:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Demo Users

The system works with or without a backend API:

- **With API**: Uses real backend authentication
- **Without API**: Falls back to mock authentication

Available demo users (all use password: `password123`):

- **Admin**: `test@example.com` - Full access to all features
- **Driver**: `driver@example.com` - Driver-specific features
- **Passenger**: `passenger@example.com` - Basic ride and payment features
- **Fleet Manager**: `fleet@example.com` - Fleet management and analytics

## Project Structure

```
src/
├── components/
├── config/
│   └── menu.config.ts          # Menu configuration and permissions
├── services/
│   ├── api.service.ts          # Centralized API service
│   └── auth.service.ts         # Authentication service
└── pages/
    ├── index.tsx               # Main page with auth check
    └── login.tsx               # Login page
```

## Key Features

### Dynamic Menu System

- Role-based menu filtering
- Hierarchical submenu support
- Icon mapping system
- User context integration

### Authentication

- JWT token management
- API integration with fallback
- Role-based user data
- Secure logout functionality

### API Service

- Centralized API management
- Automatic token handling
- Error handling and fallback
- TypeScript support

## Documentation

- [Dynamic Menu System](./DYNAMIC_MENU_README.md) - Detailed menu implementation
- [API Integration](./API_INTEGRATION_README.md) - API service documentation
- [Login Implementation](./LOGIN_README.md) - Authentication flow

## Technologies Used

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Fetch API** - HTTP requests

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Environment Variables

- `NEXT_PUBLIC_API_URL` - Backend API base URL (default: http://localhost:3000)

## Production Deployment

1. Set up environment variables
2. Configure API endpoints
3. Build the application: `npm run build`
4. Start production server: `npm run start`

## Security Considerations

- Use HTTPS in production
- Implement proper CORS configuration
- Use secure token storage (httpOnly cookies)
- Add request rate limiting
- Implement token refresh mechanism

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of a code template collection for multi-file schema applications.
