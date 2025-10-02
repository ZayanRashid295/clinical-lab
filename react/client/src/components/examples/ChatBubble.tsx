import { ChatBubble } from '../ChatBubble'

export default function ChatBubbleExample() {
  return (
    <div className="space-y-4 p-4">
      <ChatBubble 
        role="doctor"
        message="Can you tell me about your symptoms?"
        timestamp="2:34 PM"
      />
      <ChatBubble 
        role="patient"
        message="I've been experiencing chest pain for the past hour. It's a sharp pain that gets worse when I breathe deeply."
        timestamp="2:35 PM"
      />
      <ChatBubble 
        role="system"
        message="Teachable Moment: Consider asking about radiation of pain"
      />
    </div>
  )
}
