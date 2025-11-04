# Org Chart - Refactored Structure

This directory contains a refactored, modular implementation of the organizational chart viewer.

## Directory Structure

```
org-chart/
├── constants.ts                    # All constants (dimensions, colors, etc.)
├── org-chart-view.tsx             # Main component (orchestrates everything)
├── README.md                       # This file
│
├── utils/                          # Utility functions
│   ├── color-utils.ts             # Color hashing and assignment
│   ├── hierarchy-utils.ts         # Hierarchy traversal and manipulation
│   └── layout-utils.ts            # Layout algorithm and calculations
│
├── hooks/                          # Custom React hooks
│   ├── useOrgChartDrag.ts         # Drag & drop state and logic
│   ├── useOrgChartEdit.ts         # Inline editing functionality
│   └── useOrgChartJson.ts         # JSON import/export operations
│
└── components/                     # React components
    ├── ConnectionsLayer.tsx        # SVG connection lines
    ├── DebugPanel.tsx              # Debug log panel
    ├── JsonEditorModal.tsx         # Full-screen JSON editor
    ├── JsonPanel.tsx               # Side panel showing JSON
    ├── OrgChartNode.tsx            # Individual node component
    ├── Sidebar.tsx                 # Left sidebar with node list
    └── Toolbar.tsx                 # Top toolbar with controls
```

## Component Breakdown

### Main Component (`org-chart-view.tsx`)
- **Lines**: ~340 (down from 1746)
- **Purpose**: Orchestrates all sub-components and hooks
- **Responsibilities**:
  - State management for UI (zoom, panning, panels)
  - Composing all child components
  - Managing canvas interactions

### Utils

#### `color-utils.ts`
- Hash-based color assignment for nodes
- Ensures consistent colors across renders

#### `hierarchy-utils.ts`
- Flattening hierarchical data
- Finding nodes and paths
- Hierarchy manipulation (create, update, move)
- Descendant checking

#### `layout-utils.ts`
- Layout algorithm (calculatePositions)
- Canvas dimension calculations
- Connection building
- Two-pass compaction with overlap correction

### Hooks

#### `useOrgChartDrag.ts`
- Manages drag & drop state
- Handles drag start, over, end, and drop events
- Creates custom drag images with zoom support
- Debug logging for drag operations
- Returns: drag state and handlers

#### `useOrgChartEdit.ts`
- Inline editing for node roles and names
- Edit state management
- Save/cancel operations
- Returns: edit state and handlers

#### `useOrgChartJson.ts`
- JSON import/export functionality
- Clipboard operations (copy/paste)
- JSON editor modal state
- File download
- Returns: JSON operations and state

### Components

#### `OrgChartNode.tsx`
- Renders individual nodes
- Handles inline editing UI
- Shows drag indicators and drop zones
- Manages node styling based on state

#### `ConnectionsLayer.tsx`
- SVG layer for parent-child connections
- Right-angle path rendering

#### `Toolbar.tsx`
- Zoom controls
- JSON operations (copy, paste, edit, download)
- Panel toggles (sidebar, JSON, debug)
- Refresh button

#### `Sidebar.tsx`
- Shows list of all nodes
- Displays node level

#### `JsonPanel.tsx`
- Resizable side panel
- Live JSON display
- Syntax highlighting

#### `DebugPanel.tsx`
- Drag & drop debug log
- Shows drag-start, snap, and release events
- Color-coded event types
- Clear log functionality

#### `JsonEditorModal.tsx`
- Full-screen JSON editor
- Save/cancel operations
- Validation feedback

## Benefits of This Structure

### 1. **Maintainability**
- Each file has a single, clear responsibility
- Easy to find and fix bugs
- Clear separation of concerns

### 2. **Testability**
- Utilities can be unit tested independently
- Hooks can be tested with React Testing Library
- Components can be tested in isolation

### 3. **Reusability**
- Utilities and hooks can be reused in other projects
- Components are self-contained
- Layout algorithm can be used standalone

### 4. **Readability**
- Smaller files are easier to understand
- Clear naming conventions
- Logical grouping of related functionality

### 5. **Scalability**
- Easy to add new features (new hooks, components)
- Can parallelize development (different devs work on different files)
- Performance optimizations can be isolated

## Key Patterns Used

### Custom Hooks Pattern
- Encapsulates related state and logic
- Returns consistent API
- Follows React best practices

### Component Composition
- Small, focused components
- Props-based communication
- Single responsibility principle

### Utility Modules
- Pure functions where possible
- No side effects
- Easy to test and reason about

## Migration Notes

The refactored code maintains **100% feature parity** with the original:
- All drag & drop functionality works identically
- Layout algorithm is unchanged
- All UI panels and controls are preserved
- Debug logging intact
- JSON operations work the same

No breaking changes to external APIs or data structures.

## Development Workflow

### Adding a New Feature

1. **Utility Function**: Add to appropriate utils file
2. **State Logic**: Create or extend a custom hook
3. **UI Component**: Create new component or extend existing
4. **Integration**: Wire up in `org-chart-view.tsx`

### Modifying Existing Features

1. Identify the relevant file(s)
2. Make changes in the most specific location
3. Update tests if applicable
4. Check for linting errors

### Debugging

- Use `DebugPanel` for drag & drop issues
- Check console for layout algorithm details
- Examine hooks with React DevTools

