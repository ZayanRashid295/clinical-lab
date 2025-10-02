# Ride Sharing App - Next.js Frontend

A parallel Next.js application with login functionality and user dashboard, matching the Angular version's features and design.

## Features

- **Login Page**: React forms with validation
- **Dashboard**: Displays logged-in user information
- **Routing**: Next.js App Router with automatic redirection
- **State Management**: Context-based authentication state
- **Responsive Design**: Identical styling to Angular version
- **Adaptive Layout**: Vertical/horizontal menu options
- **Multi-lingual Support**: English/Arabic localization
- **Color Themes**: 8 predefined color schemes
- **Dark/Light Modes**: Real-time theme switching
- **Theme System**: Comprehensive customization options

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn

### Installation

1. Navigate to the nextjs directory:

   ```bash
   cd nextjs
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open your browser and go to `http://localhost:3001`

## Usage

1. **Login**: Enter any email and password to login (demo mode)
2. **Dashboard**: After login, you'll see your user information
3. **Theme Customization**: Use theme toggle and color picker
4. **Language**: Switch between English and Arabic
5. **Layout**: Toggle between vertical and horizontal menu layouts
6. **Logout**: Click the logout button to return to the login page

## Project Structure

```
nextjs/
├── src/
│   ├── app/
│   │   ├── features/
│   │   │   ├── admin/
│   │   │   ├── analytics/
│   │   │   ├── communication/
│   │   │   ├── dashboard/
│   │   │   ├── fleet/
│   │   │   ├── locations/
│   │   │   ├── payments/
│   │   │   └── rides/
│   │   ├── layout/
│   │   │   ├── adaptive-layout/
│   │   │   ├── header/
│   │   │   ├── sidebar/
│   │   │   └── footer/
│   │   ├── components/
│   │   │   ├── settings-modal/
│   │   │   └── login-form/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   ├── loading.tsx
│   │   └── error.tsx
│   ├── shared/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   ├── header/
│   │   │   ├── layout/
│   │   │   ├── login/
│   │   │   ├── menu-system/
│   │   │   ├── navigation/
│   │   │   ├── settings/
│   │   │   ├── sidebar/
│   │   │   ├── theme-toggle/
│   │   │   ├── color-picker/
│   │   │   └── language-switcher/
│   │   ├── services/
│   │   │   ├── auth/
│   │   │   ├── theme/
│   │   │   ├── api/
│   │   │   ├── language/
│   │   │   ├── menu/
│   │   │   ├── responsive/
│   │   │   ├── performance/
│   │   │   └── toast/
│   │   ├── types/
│   │   ├── config/
│   │   ├── guards/
│   │   ├── utils/
│   │   └── index.ts
│   ├── locales/
│   │   ├── en.json
│   │   └── ar.json
│   ├── styles/
│   │   ├── components/
│   │   ├── layouts/
│   │   └── themes/
│   └── utils/
├── public/
│   ├── images/
│   ├── icons/
│   └── locales/
├── next.config.js
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

## Next.js Features Used

- **App Router**: Next.js 13+ App Router for routing
- **Server Components**: Server-side rendering capabilities
- **Client Components**: Interactive client-side components
- **Context API**: State management with React Context
- **TypeScript**: Full TypeScript support with interfaces
- **Tailwind CSS**: Utility-first CSS framework
- **Internationalization**: Multi-language support

## Comparison with Angular Version

Both applications provide identical functionality:

| Feature          | Angular                   | Next.js                    |
| ---------------- | ------------------------- | -------------------------- |
| Login Form       | Reactive Forms            | React Hook Form            |
| State Management | Service + BehaviorSubject | Context + useReducer       |
| Routing          | Angular Router            | Next.js App Router         |
| Validation       | Built-in validators       | React Hook Form validation |
| Styling          | Global + component CSS    | Tailwind CSS + CSS modules |
| Theme System     | CSS Variables + Services  | CSS Variables + Context    |
| i18n             | Angular i18n              | next-intl                  |

## Demo

This is a demo application. You can use any email and password combination to login. The app will extract a username from the email address and display it on the dashboard.

## Future Enhancements

- Connect to backend API for real authentication
- Add Next.js middleware for route protection
- Implement server-side authentication
- Add user registration functionality
- Include password reset functionality
- Add user profile management
- Implement real-time features with WebSockets
