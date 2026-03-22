# Target Expiration Feature

## Overview
This feature implements automatic deletion of expired targets for "This Week", "This Month", and "This Year" target types. Unlike "Tomorrow" targets which are migrated to today's tasks, these longer-term targets are automatically deleted when their time periods end.

## How It Works

### Target Types and Expiration Logic
- **Tomorrow**: Migrated to today's tasks when due (existing behavior, unchanged)
- **This Week**: Automatically deleted after the end of the week (Sunday)
- **This Month**: Automatically deleted after the last day of the month
- **This Year**: Automatically deleted after December 31st

### When Expiration Check Runs
The expiration check runs automatically:
1. **Daily**: When the app loads and the date has changed since last check
2. **Per User**: Each user's targets are checked independently
3. **Once Per Day**: Uses localStorage to prevent multiple checks on the same day

### Target Date Calculation
When targets are created, their `target_date` is set based on type:
- **Week**: End of current week (Sunday)
- **Month**: Last day of current month
- **Year**: December 31st of current year

### Expiration Logic
A target is considered expired when:
```
today > target_date
```
Where both dates are normalized to start of day (00:00:00) for accurate comparison.

## Implementation Details

### Files Modified
1. **`src/utils/migrateTargets.ts`**
   - Added `isTargetExpired()` function
   - Added `deleteExpiredTargets()` function
   - Added `manuallyDeleteExpiredTargets()` for testing
   - Updated `checkAndMigrateTargets()` to include expiration cleanup

2. **`src/components/TodayView.tsx`**
   - Updated to show notifications for deleted expired targets
   - Enhanced migration result handling

3. **`src/hooks/useTargets.ts`**
   - Updated to handle new return structure with deletion counts
   - Added notifications for expired target cleanup

### New Functions

#### `isTargetExpired(targetType: string, targetDate: string): boolean`
Determines if a target has expired based on its type and target date.

#### `deleteExpiredTargets(userId: string)`
Finds and deletes all expired targets for a user. Returns:
```typescript
{
  success: boolean;
  deletedCount: number;
  deletedTargets?: Array<{title: string, type: string, targetDate: string}>;
}
```

#### `manuallyDeleteExpiredTargets(userId: string)`
Manual function for testing or immediate cleanup of expired targets.

### Updated Return Types
The `checkAndMigrateTargets()` function now returns:
```typescript
{
  success: boolean;
  migratedCount: number;
  createdTasks: Task[];
  deletedCount: number;
  deletedTargets?: Array<{title: string, type: string, targetDate: string}>;
}
```

## User Experience

### Notifications
Users receive notifications when:
1. **Targets Migrated**: "X target(s) moved to today's tasks!"
2. **Expired Targets Cleaned**: "X expired target(s) automatically removed."

### Behavior Examples
- **June 30th target in July**: Automatically deleted
- **Current month target**: Kept until month ends
- **Current year target**: Kept until year ends
- **Tomorrow targets**: Still migrated to tasks (unchanged)

## Testing
The implementation includes comprehensive date logic testing to ensure:
- Past targets are correctly identified as expired
- Current period targets are preserved
- Tomorrow targets are never auto-deleted
- Date comparisons work across month/year boundaries

## Benefits
1. **Automatic Cleanup**: No manual intervention needed
2. **Prevents Clutter**: Old targets don't accumulate
3. **Preserves Important Data**: Only deletes truly expired targets
4. **User Awareness**: Clear notifications about what happened
5. **Maintains Existing Behavior**: Tomorrow targets still work as before

## Safety Features
- **Type-specific Logic**: Only affects week/month/year targets
- **Date Validation**: Robust date comparison logic
- **Error Handling**: Graceful failure with logging
- **User Feedback**: Clear notifications about actions taken
- **Preservation of Tomorrow Targets**: Existing migration behavior unchanged
