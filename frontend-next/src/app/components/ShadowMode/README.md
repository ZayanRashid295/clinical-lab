# Shadow Mode - Medical Consultation Interface

This is a comprehensive medical consultation interface that simulates a doctor-patient interaction with real-time data processing and visualization.

## Components Structure

```
ShadowMode/
├── components/
│   ├── ZoomComm/           # Video communication interface
│   ├── ChatBox/            # Message display component
│   ├── DoctorsThoughts/    # Clinical reasoning display
│   ├── DiffDiag/           # Differential diagnosis with percentages
│   ├── StatsBar/           # Overall statistics display
│   ├── MemoryManager/      # Data structure visualization
│   └── index.ts            # Component exports
├── ShadowModeContent.tsx   # Main component
├── index.ts               # Main exports
└── README.md              # This file
```

## Features

### 1. ZoomComm Component

- Video communication interface simulation
- Doctor/Patient role switching
- Message input with real-time sending
- Visual representation of participants

### 2. ChatBox Component

- Real-time message display
- Color-coded messages by sender (Doctor/Patient)
- Scrollable chat history
- Emoji indicators for participants

### 3. DoctorsThoughts Component

- Clinical reasoning display
- Auto-generated thoughts based on patient messages
- Numbered thought entries
- Indigo-themed styling

### 4. DiffDiag Component

- Differential diagnosis with percentage bars
- Dynamic diagnosis updates
- Visual progress bars
- Sorted by probability

### 5. StatsBar Component

- Real-time statistics display
- Message counts, thoughts, diagnoses
- Color-coded metric cards
- Grid layout for easy reading

### 6. MemoryManager Component

- JSON data structure visualization
- Real-time data updates
- Terminal-style display
- Complete application state view

## Data Flow

1. **Message Input**: User sends messages through ZoomComm
2. **Processing**: Messages trigger thought generation and diagnosis updates
3. **Visualization**: All components update in real-time
4. **Persistence**: Complete state maintained in MemoryManager

## Usage

The component is accessible through the main menu as "Shadow Mode" and provides a fully interactive medical consultation simulation.

## Technical Details

- Built with React and TypeScript
- Uses Tailwind CSS for styling
- Implements real-time state management
- Responsive grid layout
- Modular component architecture
