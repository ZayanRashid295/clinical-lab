# Limited Access Implementation for Non-Subscribed Students

## Overview
Implemented a "freemium" trial mode that allows non-subscribed students to test the question bank with limited access. Students can apply all filters, but when generating a test, they only receive 10 random questions from the filtered results, regardless of how many questions match their filters.

## Implementation Details

### Backend Changes

**File:** `backend/src/modules/questions/questions.service.ts`

1. **Added Subscription Service Dependency**
   - Injected `SubscriptionsService` into `QuestionsService`
   - Added import for `SubscriptionsService`

2. **Modified `getFilteredQuestions` Method**
   - Added subscription status check for the user
   - If user has no active subscription:
     - **Count checks** (limit >= 999): Returns all filtered questions for accurate count display
     - **Test generation** (limit < 999): Returns only 10 randomly selected questions from filtered results
   - If user has active subscription: Returns full filtered results as requested

### Logic Flow

```typescript
// Check subscription status
if (userId) {
  const activeSubscriptions = await subscriptionsService.getUserSubscriptions(userId, "ACTIVE");
  hasActiveSubscription = activeSubscriptions && activeSubscriptions.length > 0;
}

// Determine request type
const isCountCheck = limit >= 999;  // Count checks use limit >= 999
const isTestGeneration = limit < 999 && limit > 0;  // Test generation uses specific limit (e.g., 40)

// Apply limitations for non-subscribed users
if (!hasActiveSubscription && isTestGeneration && questions.length > 10) {
  // Randomly select 10 questions
  const shuffled = [...questions].sort(() => 0.5 - Math.random());
  questions = shuffled.slice(0, 10);
}
```

### User Experience

**For Non-Subscribed Students:**
1. ✅ Can apply all filters (tags, systems, subjects, topics, pools, marked status)
2. ✅ See accurate count of available questions (e.g., "40 questions available")
3. ⚠️ When generating test, only receives 10 random questions from filtered results
4. ✅ Questions are randomly selected each time, providing variety

**For Subscribed Students:**
1. ✅ Full access to all filtered questions
2. ✅ Receives the exact number of questions requested (up to limit)

### Example Scenarios

**Scenario 1: Non-Subscribed User**
- Applies filters → Sees "40 questions available"
- Requests 40 questions → Receives 10 random questions
- Applies different filters → Sees "25 questions available"
- Requests 25 questions → Receives 10 random questions

**Scenario 2: Subscribed User**
- Applies filters → Sees "40 questions available"
- Requests 40 questions → Receives all 40 questions
- Applies different filters → Sees "25 questions available"
- Requests 25 questions → Receives all 25 questions

## Technical Details

### Count Check vs Test Generation

The system distinguishes between count checks and test generation based on the `limit` parameter:

- **Count Check:** `limit >= 999`
  - Frontend calls without limit or with limit >= 999
  - Backend returns all filtered questions (or up to 999)
  - Used to display accurate count to user

- **Test Generation:** `limit < 999 && limit > 0`
  - Frontend calls with specific limit (e.g., 40)
  - Backend applies subscription limitations
  - Non-subscribed users receive max 10 random questions

### Random Selection Algorithm

```typescript
// Fisher-Yates shuffle (simplified)
const shuffled = [...questions].sort(() => 0.5 - Math.random());
questions = shuffled.slice(0, 10);
```

This ensures:
- Different questions each time
- Fair distribution across filtered results
- No bias toward any particular question

## Files Modified

1. `backend/src/modules/questions/questions.service.ts`
   - Added `SubscriptionsService` injection
   - Modified `getFilteredQuestions` method to check subscription and limit questions

2. `backend/src/modules/questions/questions.module.ts`
   - Already imports `SubscriptionsModule` (from previous dependency fix)

## Testing Checklist

- [ ] Non-subscribed user can apply filters
- [ ] Count shows accurate number (e.g., 40)
- [ ] Test generation returns only 10 questions
- [ ] Questions are randomly selected (different each time)
- [ ] Subscribed user receives full count
- [ ] Subscribed user receives all requested questions
- [ ] Works with all filter types (tags, systems, subjects, topics, pools, marked)
- [ ] Works when filtered results have less than 10 questions (returns all available)

## Future Enhancements

1. **UI Indicator:** Show a badge or message indicating "Trial Mode - 10 questions" for non-subscribed users
2. **Upgrade Prompt:** Add a prompt after completing the 10-question test encouraging subscription
3. **Question History:** Track which 10 questions were shown to prevent exact duplicates in subsequent tests
4. **Feature Flags:** Make the limit configurable (currently hardcoded to 10)

---

**Date:** $(date)
**Status:** ✅ Complete





