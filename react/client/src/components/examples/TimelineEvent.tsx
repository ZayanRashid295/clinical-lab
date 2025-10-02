import { TimelineEvent } from '../TimelineEvent'

export default function TimelineEventExample() {
  return (
    <div className="p-4">
      <TimelineEvent
        action="Obtained patient history"
        timestamp="2 min"
        status="correct"
        feedback="Comprehensive history with appropriate follow-up questions"
      />
      <TimelineEvent
        action="Ordered chest X-ray"
        timestamp="5 min"
        status="correct"
        feedback="Appropriate imaging for suspected pneumonia"
      />
      <TimelineEvent
        action="Ordered full body CT scan"
        timestamp="6 min"
        status="incorrect"
        feedback="Unnecessary imaging - targeted approach recommended"
        isLast={true}
      />
    </div>
  )
}
