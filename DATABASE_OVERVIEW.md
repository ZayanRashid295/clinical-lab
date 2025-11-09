# Database Overview - Clinical Lab Project

## Database Type
- **Provider**: MySQL
- **ORM**: Prisma
- **Schema Location**: `backend/prisma/schema/`

## Database Structure

The database is organized into multiple modules, each with its own schema file:

### 1. **Base Module** (`base.schema.prisma`)
Core application tables:
- **User**: User accounts with email, password, phone, name, avatar
- **UserSettings**: User preferences (language, timezone, notifications, privacy)
- **Role**: System roles (admin, moderator, etc.)
- **Permission**: Granular permissions (resource + action)
- **UserRole**: Many-to-many relationship between users and roles
- **UserPermission**: Direct user permissions
- **RolePermission**: Role-based permissions
- **AuditLog**: System audit trail
- **SystemSettings**: Application-wide settings
- **Institution**: Educational institutions
- **InstitutionManager**: Institution administrators

### 2. **Product Module** (`product.schema.prisma`)
LMS product structure:
- **Product**: Main products (USMLE, SAT, etc.)
- **ProductTag**: Subject tags (Anatomy, Biochemistry, etc.)
- **ProductSubtype**: Product variants (Qbank, Self-Assessment, etc.)

### 3. **Content Module** (`content.schema.prisma`)
Hierarchical content organization:
- **Section**: Top-level content sections (General Principles, Clinical Sciences)
- **Chapter**: Chapters within sections (Biochemistry, Microbiology)
- **Topic**: Topics within chapters (Lipid metabolism, etc.)
- **Question**: Individual questions with difficulty, points, explanation
- **QuestionChoice**: Multiple choice options for questions

### 4. **Assessment Module** (`assessment.schema.prisma`)
User assessments and test papers:
- **QuestionPaper**: User-created test papers
- **QuestionPaperQuestion**: Questions in a paper with user answers and results

### 5. **Subscription Module** (`subscription.schema.prisma`)
Subscription management:
- **PackageFeatures**: Available features (Qbank, Self Assessment, etc.)
- **SubscriptionPackage**: Subscription tiers (Basic, Premium, Pro)
- **SubscriptionFeatures**: Features included in each package
- **Subscription**: User subscriptions with status, dates, auto-renew

### 6. **Payment Module** (`payment.schema.prisma`)
Payment and billing:
- **Payment**: Payment transactions with status, gateway, method
- **Refund**: Refund records
- **Wallet**: User wallet with balance
- **WalletTransaction**: Wallet transaction history
- **PaymentMethod**: Saved payment methods (cards, etc.)
- **PromoCode**: Discount codes
- **PromoCodeUsage**: Usage tracking for promo codes

### 7. **Chat Module** (`chat.schema.prisma`)
Messaging system:
- **ChatRoom**: Chat rooms (direct, group, support)
- **ChatParticipant**: Room participants with roles
- **ChatMessage**: Messages with content, type, metadata
- **ChatMessageReaction**: Message reactions (emojis)
- **ChatReadStatus**: Read receipts and last read tracking

### 8. **Notification Module** (`notification.schema.prisma`)
Notification system:
- **Notification**: User notifications
- **NotificationTemplate**: Reusable notification templates
- **NotificationPreference**: User notification preferences
- **NotificationQueue**: Queued notifications for processing
- **NotificationLog**: Delivery logs and status tracking

## Key Relationships

- Users can have multiple roles and permissions
- Users can create question papers and take assessments
- Users can have subscriptions to products
- Users can make payments and use wallets
- Users can participate in chat rooms
- Users receive notifications
- Content is organized hierarchically: Product → Section → Chapter → Topic → Question
- Questions can be tagged with product tags
- Subscriptions link to product subtypes and packages

## How to Access the Database

### Option 1: Prisma Studio (Recommended)
From the project root, run:
```bash
cd backend
npm run prisma:studio
```

Or with explicit schema path:
```bash
cd backend
npx prisma studio --schema=prisma/schema/schema.prisma
```

### Option 2: Direct MySQL Connection
Check your `.env` file in the `backend` directory for the `DATABASE_URL`:
```
DATABASE_URL="mysql://username:password@localhost:3306/database_name"
```

You can connect using:
- MySQL Workbench
- phpMyAdmin
- Command line: `mysql -u username -p database_name`
- Any MySQL client

### Option 3: Prisma CLI Commands
```bash
cd backend

# View database schema
npx prisma db pull

# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Push schema changes
npm run prisma:push
```

## Important Notes

1. The schema uses Prisma's `prismaSchemaFolder` preview feature, which allows splitting the schema across multiple files
2. All tables use `relationMode = "prisma"` which is required for MySQL
3. Most relationships use `onDelete: Cascade` for automatic cleanup
4. Timestamps are automatically managed with `@default(now())` and `@updatedAt`
5. IDs use `cuid()` for unique identifiers


