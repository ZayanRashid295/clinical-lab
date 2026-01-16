# Test Credentials - Access Control Testing

## 🔐 Quick Reference

All test users have password: **`password123`**

---

## 👨‍💼 ADMIN User

**Email**: `admin@uber.com`  
**Password**: `password123`  
**Role**: ADMIN

**Access Capabilities**:
- ✅ Full system access
- ✅ Can create/edit/delete questions
- ✅ Can manage users
- ✅ Can access admin panel
- ✅ Bypasses subscription checks
- ✅ Can access all endpoints

**Test Scenarios**:
1. Login and verify admin dashboard access
2. Try to create a question (should succeed)
3. Try to access Qbank without subscription (should succeed - admin bypass)
4. Try to manage users (should succeed)

---

## 🏫 INSTITUTION_MANAGER User

**Email**: `jane.smith@example.com`  
**Password**: `password123`  
**Role**: INSTITUTION_MANAGER

**Access Capabilities**:
- ✅ Can manage institution students
- ✅ Can create study plans
- ✅ Can access institution dashboard
- ⚠️ Cannot create/edit questions (requires ADMIN)
- ⚠️ Requires subscription for Qbank access

**Test Scenarios**:
1. Login and verify institution dashboard
2. Try to create a study plan (should succeed if implemented)
3. Try to create a question (should fail - requires ADMIN)
4. Try to access Qbank without subscription (should fail)

---

## 👨‍🎓 STUDENT Users

### Student 1
**Email**: `john.doe@example.com`  
**Password**: `password123`  
**Role**: STUDENT

### Student 2
**Email**: `mike.wilson@example.com`  
**Password**: `password123`  
**Role**: STUDENT

### Student 3
**Email**: `sarah.johnson@example.com`  
**Password**: `password123`  
**Role**: STUDENT

**Access Capabilities** (Without Subscription):
- ❌ Cannot access Qbank questions
- ❌ Cannot create assessments
- ❌ Cannot access premium features
- ✅ Can view landing page
- ✅ Can subscribe to packages
- ✅ Can access account settings

**Access Capabilities** (With Basic Subscription - Qbank Access):
- ✅ Can access Qbank questions
- ✅ Can view question statistics
- ✅ Can create question papers
- ❌ Cannot access Self Assessment
- ❌ Cannot access Study Planner
- ❌ Cannot access Flashcards

**Access Capabilities** (With Premium Subscription - All Features):
- ✅ Can access Qbank questions
- ✅ Can access Self Assessment
- ✅ Can access Study Planner
- ✅ Can access Flashcards
- ✅ Can create assessments
- ❌ Cannot create/edit questions (requires ADMIN)

**Test Scenarios**:

**Without Subscription**:
1. Login as student
2. Try to access `/questions` endpoint (should fail - 403 Forbidden)
3. Try to access dashboard (should show subscription modal)
4. Try to create question paper (should fail - requires subscription)

**With Basic Subscription**:
1. Purchase Basic subscription (Qbank Access only)
2. Try to access `/questions` endpoint (should succeed)
3. Try to access Self Assessment (should fail - feature not included)
4. Try to create question paper (should succeed)

**With Premium Subscription**:
1. Purchase Premium subscription (all features)
2. Try to access all features (should succeed)
3. Try to create question (should fail - requires ADMIN role)

---

## 🧪 Testing Checklist

### Backend API Testing

- [ ] **ADMIN can access all endpoints**
  - Login as `admin@uber.com`
  - Test: `GET /questions` (should succeed)
  - Test: `POST /questions` (should succeed)
  - Test: `GET /assessments` (should succeed)

- [ ] **STUDENT without subscription is blocked**
  - Login as `john.doe@example.com`
  - Test: `GET /questions` (should return 403 - Qbank Access required)
  - Test: `POST /assessments` (should return 403 - Active subscription required)

- [ ] **STUDENT with subscription can access features**
  - Login as student
  - Purchase subscription with "Qbank Access"
  - Test: `GET /questions` (should succeed)
  - Test: `POST /assessments` (should succeed if subscription active)

- [ ] **STUDENT cannot create questions**
  - Login as student (even with subscription)
  - Test: `POST /questions` (should return 403 - Admin role required)

- [ ] **INSTITUTION_MANAGER has limited access**
  - Login as `jane.smith@example.com`
  - Test: `POST /questions` (should return 403 - Admin role required)
  - Test: `GET /questions` (should return 403 - Qbank Access required, unless has subscription)

### Frontend Testing

- [ ] **ADMIN sees admin features**
  - Login as `admin@uber.com`
  - Verify admin panel is visible
  - Verify "Create Question" button is visible

- [ ] **STUDENT without subscription sees upgrade prompts**
  - Login as student
  - Verify subscription modal appears
  - Verify Qbank features are hidden/disabled
  - Verify upgrade prompts are visible

- [ ] **STUDENT with subscription sees features**
  - Login as student with active subscription
  - Verify Qbank is accessible
  - Verify features match subscription tier

- [ ] **Protected routes redirect properly**
  - Try to access `/dashboard` without subscription
  - Should show access denied or redirect to pricing

---

## 📊 Role Summary

| Role | Count | Users |
|------|-------|-------|
| ADMIN | 1 | admin@uber.com |
| INSTITUTION_MANAGER | 1 | jane.smith@example.com |
| STUDENT | 15 | john.doe@example.com, mike.wilson@example.com, etc. |

---

## 🔄 Re-running Migrations

If you need to reassign roles or add indexes again:

```bash
cd backend

# Add indexes only
npm run migrate:indexes

# Assign roles only
npm run migrate:roles

# Run both
npm run migrate:all
```

---

## 📝 Notes

1. **Password**: All users have the same password: `password123`
2. **Roles**: Each user has exactly one role assigned
3. **Subscriptions**: Students need to purchase subscriptions to access features
4. **Admin Bypass**: ADMIN role bypasses subscription checks
5. **JWT Tokens**: Roles are included in JWT tokens for fast access checks

---

## 🐛 Troubleshooting

### Issue: User can't access features they should have
1. Check user's role: Login and check JWT token or database
2. Check subscription status: Verify active subscription exists
3. Check subscription features: Verify subscription includes required features
4. Clear browser cache and localStorage
5. Re-login to refresh JWT token

### Issue: Admin can't access admin features
1. Verify user has ADMIN role in database
2. Re-login to refresh JWT token with roles
3. Check backend logs for guard failures

### Issue: Indexes not improving performance
1. Verify indexes exist: `SHOW INDEX FROM user_roles;`
2. Check query execution plans
3. Ensure database is using indexes (not full table scans)

---

**Last Updated**: Migration completed successfully  
**Status**: ✅ Ready for testing



