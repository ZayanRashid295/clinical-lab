import React, { useState } from 'react';
import { Video, MessageSquare, Brain, BarChart3, Database } from 'lucide-react';

// ZoomComm - Video communication interface
const ZoomComm = ({ onSendMessage }) => {
const [message, setMessage] = useState('');
const [sender, setSender] = useState('patient');

const handleSend = () => {
if (message.trim()) {
onSendMessage({
sender,
text: message,
timestamp: new Date().toLocaleTimeString()
});
setMessage('');
}
};

const handleKeyPress = (e) => {
if (e.key === 'Enter') {
handleSend();
}
};

return (
<div className="bg-white rounded-lg shadow p-3 h-full flex flex-col">
<div className="flex items-center gap-1 mb-2">
<Video className="w-4 h-4 text-blue-600" />
<h3 className="text-sm font-bold text-gray-800">Zoom</h3>
</div>

      <div className="grid grid-cols-2 gap-2 mb-2">
        <div className="bg-blue-100 rounded p-2 flex items-center justify-center">
          <span className="text-xl">👨‍⚕️</span>
        </div>
        <div className="bg-green-100 rounded p-2 flex items-center justify-center">
          <span className="text-xl">🤒</span>
        </div>
      </div>

      <div className="space-y-2 mt-auto">
        <div className="flex gap-1">
          <button
            onClick={() => setSender('doctor')}
            className={`flex-1 px-2 py-1 rounded text-xs ${
              sender === 'doctor' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            Doctor
          </button>
          <button
            onClick={() => setSender('patient')}
            className={`flex-1 px-2 py-1 rounded text-xs ${
              sender === 'patient' ? 'bg-green-600 text-white' : 'bg-gray-200'
            }`}
          >
            Patient
          </button>
        </div>

        <div className="flex gap-1">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`As ${sender}...`}
            className="flex-1 px-2 py-1 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            onClick={handleSend}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
          >
            Send
          </button>
        </div>
      </div>
    </div>

);
};

// ChatBox - Display conversation
const ChatBox = ({ messages }) => {
return (
<div className="bg-white rounded-lg shadow p-3 h-full flex flex-col">
<div className="flex items-center gap-1 mb-2">
<MessageSquare className="w-4 h-4 text-purple-600" />
<h3 className="text-sm font-bold text-gray-800">Chat</h3>
</div>

      <div className="bg-gray-50 rounded p-2 flex-1 overflow-y-auto space-y-2 text-xs">
        {messages.length === 0 ? (
          <p className="text-gray-400 italic text-center">No messages...</p>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.sender === 'doctor' ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-xs px-2 py-1 rounded ${
                  msg.sender === 'doctor'
                    ? 'bg-blue-100 text-blue-900'
                    : 'bg-green-100 text-green-900'
                }`}
              >
                <p className="font-semibold text-xs">
                  {msg.sender === 'doctor' ? '👨‍⚕️' : '🤒'}
                </p>
                <p className="text-xs">{msg.text}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>

);
};

// DoctorsThoughts - Clinical reasoning
const DoctorsThoughts = ({ thoughts }) => {
return (
<div className="bg-white rounded-lg shadow p-3 h-full flex flex-col">
<div className="flex items-center gap-1 mb-2">
<Brain className="w-4 h-4 text-indigo-600" />
<h3 className="text-sm font-bold text-gray-800">Thoughts</h3>
</div>

      <div className="bg-indigo-50 rounded p-2 flex-1 overflow-y-auto">
        {thoughts.length === 0 ? (
          <p className="text-gray-400 italic text-xs">No thoughts...</p>
        ) : (
          <ul className="space-y-1">
            {thoughts.map((thought, idx) => (
              <li key={idx} className="bg-white p-2 rounded text-xs border-l-2 border-indigo-500">
                <span className="text-xs text-gray-500">#{idx + 1}</span>
                <p className="text-xs mt-1">{thought}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>

);
};

// DiffDiag - Differential diagnosis percentages
const DiffDiag = ({ diagnoses }) => {
return (
<div className="bg-white rounded-lg shadow p-3 h-full flex flex-col">
<div className="flex items-center gap-1 mb-2">
<BarChart3 className="w-4 h-4 text-red-600" />
<h3 className="text-sm font-bold text-gray-800">Diagnosis</h3>
</div>

      <div className="space-y-2 overflow-y-auto flex-1">
        {diagnoses.length === 0 ? (
          <p className="text-gray-400 italic text-xs">No diagnoses...</p>
        ) : (
          diagnoses.map((diag, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-xs">{diag.name}</span>
                <span className="text-xs font-bold text-red-600">{diag.percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${diag.percentage}%` }}
                ></div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>

);
};

// StatsBar - Overall statistics
const StatsBar = ({ stats }) => {
return (
<div className="bg-white rounded-lg shadow p-3">
<div className="flex items-center gap-1 mb-2">
<BarChart3 className="w-4 h-4 text-orange-600" />
<h3 className="text-sm font-bold text-gray-800">Stats</h3>
</div>

      <div className="grid grid-cols-4 gap-2">
        <div className="bg-blue-50 p-2 rounded text-center">
          <p className="text-lg font-bold text-blue-600">{stats.totalMessages}</p>
          <p className="text-xs text-gray-600">Messages</p>
        </div>
        <div className="bg-green-50 p-2 rounded text-center">
          <p className="text-lg font-bold text-green-600">{stats.patientMessages}</p>
          <p className="text-xs text-gray-600">Patient</p>
        </div>
        <div className="bg-indigo-50 p-2 rounded text-center">
          <p className="text-lg font-bold text-indigo-600">{stats.doctorThoughts}</p>
          <p className="text-xs text-gray-600">Thoughts</p>
        </div>
        <div className="bg-red-50 p-2 rounded text-center">
          <p className="text-lg font-bold text-red-600">{stats.activeDiagnoses}</p>
          <p className="text-xs text-gray-600">Diagnoses</p>
        </div>
      </div>
    </div>

);
};

// MemoryManager - Data structure display
const MemoryManager = ({ data }) => {
return (
<div className="bg-white rounded-lg shadow p-3 h-full flex flex-col">
<div className="flex items-center gap-1 mb-2">
<Database className="w-4 h-4 text-teal-600" />
<h3 className="text-sm font-bold text-gray-800">Memory</h3>
</div>

      <div className="bg-gray-900 text-green-400 rounded p-2 flex-1 overflow-y-auto font-mono text-xs">
        <pre className="text-xs">{JSON.stringify(data, null, 2)}</pre>
      </div>
    </div>

);
};

// Main App
export default function App() {
const [memoryData, setMemoryData] = useState({
chat: [],
thoughts: [],
diagnoses: [],
stats: {
totalMessages: 0,
patientMessages: 0,
doctorMessages: 0,
doctorThoughts: 0,
activeDiagnoses: 0
}
});

const handleSendMessage = (message) => {
const newChat = [...memoryData.chat, message];

    let newThoughts = [...memoryData.thoughts];
    if (message.sender === 'patient') {
      const thoughtTemplates = [
        `Patient mentions: "${message.text.substring(0, 30)}..." - Need to investigate further.`,
        `Symptom noted: Consider differential diagnoses.`,
        `Patient communication suggests potential concern. Monitoring closely.`,
        `Clinical observation: Requires follow-up questions.`,
        `Important detail from patient. Cross-referencing with known conditions.`
      ];
      const randomThought = thoughtTemplates[Math.floor(Math.random() * thoughtTemplates.length)];
      newThoughts = [...newThoughts, randomThought];
    }

    let newDiagnoses = [...memoryData.diagnoses];
    if (memoryData.chat.length % 3 === 0) {
      const possibleDiagnoses = [
        'Common Cold',
        'Seasonal Allergies',
        'Migraine',
        'Anxiety Disorder',
        'Gastritis',
        'Viral Infection',
        'Sinusitis',
        'Tension Headache'
      ];

      const unusedDiagnoses = possibleDiagnoses.filter(
        d => !newDiagnoses.find(nd => nd.name === d)
      );

      if (unusedDiagnoses.length > 0) {
        const newDiag = unusedDiagnoses[Math.floor(Math.random() * unusedDiagnoses.length)];
        newDiagnoses = [...newDiagnoses, {
          name: newDiag,
          percentage: Math.floor(Math.random() * 30) + 10
        }];
      }
    }

    newDiagnoses = newDiagnoses.map(d => ({
      ...d,
      percentage: Math.min(100, Math.max(5, d.percentage + Math.floor(Math.random() * 21) - 10))
    }));

    newDiagnoses.sort((a, b) => b.percentage - a.percentage);

    const newStats = {
      totalMessages: newChat.length,
      patientMessages: newChat.filter(m => m.sender === 'patient').length,
      doctorMessages: newChat.filter(m => m.sender === 'doctor').length,
      doctorThoughts: newThoughts.length,
      activeDiagnoses: newDiagnoses.length
    };

    setMemoryData({
      chat: newChat,
      thoughts: newThoughts,
      diagnoses: newDiagnoses,
      stats: newStats
    });

};

return (
<div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 overflow-hidden">
<div className="h-full max-w-7xl mx-auto flex flex-col gap-3">
<div className="text-center">
<h1 className="text-2xl font-bold text-gray-800">Medical Consultation</h1>
</div>

        <div className="flex-1 grid grid-cols-3 gap-3 overflow-hidden">
          <div className="flex flex-col gap-3">
            <div className="h-1/2">
              <ZoomComm onSendMessage={handleSendMessage} />
            </div>
            <div className="h-1/2">
              <ChatBox messages={memoryData.chat} />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="h-1/2">
              <DoctorsThoughts thoughts={memoryData.thoughts} />
            </div>
            <div className="h-1/2">
              <DiffDiag diagnoses={memoryData.diagnoses} />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <StatsBar stats={memoryData.stats} />
            <div className="flex-1">
              <MemoryManager data={memoryData} />
            </div>
          </div>
        </div>
      </div>
    </div>

);
}
