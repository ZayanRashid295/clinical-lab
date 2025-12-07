# Test Creation Page UI - v0 Export

This folder contains the standalone UI components for the test creation page that can be copied to v0 by Vercel for UI improvements.

## Structure

```
v0-ui-export/
├── components/
│   ├── TestModeSelector.tsx      # Tutor/Timed mode selector
│   ├── QuestionPoolSelector.tsx  # Question pool selection (unused, incorrect, etc.)
│   ├── SubjectSelector.tsx       # Tag/Subject selector
│   └── SystemSelector.tsx        # System/Subject/Topic hierarchical selector
├── TestCreationPage.tsx          # Main page component combining all components
└── README.md                     # This file
```

## Usage

1. Copy the entire `v0-ui-export` folder to your v0 project
2. Update the import paths to match your UI component library:
   - Replace `@/components/ui/*` with your actual UI component paths
   - Ensure you have: Card, Checkbox, Label, Switch, ScrollArea, Button, Input, Tooltip components
3. The components use mock data, so they work standalone without API calls
4. All components maintain their original UI/UX behavior including:
   - Indeterminate checkbox states for partial selections
   - Cascading selections (systems → subjects → topics)
   - Validation and error handling
   - Loading states

## Components

### TestModeSelector
- Two independent switches for Tutor and Timed modes
- Both can be enabled simultaneously
- Tooltip with mode descriptions

### QuestionPoolSelector
- Radio-style selection for question pools (Unused, Incorrect, Omitted, Correct)
- Shows counts for each pool
- Static counts (not affected by filters)

### SubjectSelector
- Checkbox list for tags/subjects
- Select all with indeterminate state
- Grid layout with counts

### SystemSelector
- Hierarchical selector: Systems → Subjects → Topics
- Expandable/collapsible structure
- Cascading selection logic
- Indeterminate states for partial selections
- Filtered counts based on selected tags

### TestCreationPage
- Main page combining all components
- Form validation
- Error/success messaging
- Question count input with validation

## Mock Data

All components use mock data instead of API calls:
- Question pool stats are hardcoded
- Tags/subjects are mock data
- Systems/subjects/topics are mock data with realistic structure

## Notes

- All routes and navigation logic have been removed
- API service calls replaced with mock data
- Original UI/UX behavior preserved
- All validation and state management logic intact
- Ready to be styled/improved in v0





















