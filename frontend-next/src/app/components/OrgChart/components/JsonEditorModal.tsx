import React from "react";

interface JsonEditorModalProps {
  showJsonEditor: boolean;
  jsonEditorValue: string;
  onValueChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export const JsonEditorModal: React.FC<JsonEditorModalProps> = ({
  showJsonEditor,
  jsonEditorValue,
  onValueChange,
  onSave,
  onCancel,
}) => {
  if (!showJsonEditor) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
      <div className="bg-gray-900 rounded-lg shadow-2xl border border-gray-700 w-[90%] h-[90%] max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 p-4 border-b border-gray-700 flex items-center justify-between rounded-t-lg">
          <h2 className="text-xl font-bold text-white">Edit JSON</h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white transition-colors"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Editor */}
        <div className="flex-1 p-4 overflow-auto">
          <textarea
            value={jsonEditorValue}
            onChange={(e) => onValueChange(e.target.value)}
            className="w-full h-full bg-gray-950 text-green-400 p-4 font-mono text-sm rounded border border-gray-700 focus:outline-none focus:border-blue-500 resize-none"
            spellCheck={false}
          />
        </div>

        {/* Footer */}
        <div className="bg-gray-800 p-4 border-t border-gray-700 flex gap-3 justify-end rounded-b-lg">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

