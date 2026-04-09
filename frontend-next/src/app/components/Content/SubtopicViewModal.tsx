import React, { useEffect } from "react";
import { X, FileText, Calendar } from "lucide-react";
import { Subtopic } from "../../types/content";

interface SubtopicViewModalProps { isOpen: boolean; onClose: () => void; subtopic?: Subtopic | null; }

export default function SubtopicViewModal({ isOpen, onClose, subtopic }: SubtopicViewModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => { if (e.key === "Escape" && isOpen) onClose(); };
    if (isOpen) { document.addEventListener("keydown", handleEscape); document.body.style.overflow = "hidden"; }
    return () => { document.removeEventListener("keydown", handleEscape); document.body.style.overflow = "unset"; };
  }, [isOpen, onClose]);

  if (!isOpen || !subtopic) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center"><FileText className="h-6 w-6 text-indigo-600 mr-2" /><h2 className="text-xl font-semibold text-gray-900">Subtopic Details</h2></div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="h-6 w-6" /></button>
        </div>
        <div className="p-6 space-y-6">
          <h3 className="text-2xl font-bold text-gray-900">{subtopic.name}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div><p className="text-sm text-gray-500">Status</p><span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${subtopic.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{subtopic.isActive ? "Active" : "Inactive"}</span></div>
            <div><p className="text-sm text-gray-500">Display Order</p><p className="text-sm font-medium text-gray-900">{subtopic.order}</p></div>
            <div><p className="text-sm text-gray-500">Topic</p><p className="text-sm font-medium text-gray-900">{subtopic.topic?.name || subtopic.topicId}</p></div>
            <div><p className="text-sm text-gray-500">Questions</p><p className="text-sm font-medium text-gray-900">{subtopic._count?.questions ?? 0}</p></div>
            <div><p className="text-sm text-gray-500">Created</p><div className="flex items-center gap-1"><Calendar className="h-4 w-4 text-gray-400" /><p className="text-sm text-gray-900">{new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(new Date(subtopic.createdAt))}</p></div></div>
          </div>
          {subtopic.description && (<div><p className="text-sm text-gray-500 mb-1">Description</p><p className="text-sm text-gray-900">{subtopic.description}</p></div>)}
        </div>
        <div className="flex justify-end p-6 border-t border-gray-200"><button onClick={onClose} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Close</button></div>
      </div>
    </div>
  );
}
