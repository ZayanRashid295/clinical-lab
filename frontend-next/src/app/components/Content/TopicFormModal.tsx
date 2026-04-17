import React, { useState, useEffect, useMemo } from "react";
import { X, FileText, Save, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { Topic, System, CreateTopicDto, UpdateTopicDto } from "../../types/content";
import { TopicsService } from "../../services/content/topics.service";
import { SystemsService } from "../../services/systems/systems.service";
import { CreateResponse } from "../../services/base/api-types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SELECT_EMPTY_VALUE,
} from "@/shared/ui/select";

interface TopicFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  topic?: Topic | null;
  onTopicSaved: (topic: Topic) => void;
  mode: "create" | "edit";
  onItemSaved?: (item: any) => void;
}

export default function TopicFormModal({ isOpen, onClose, topic, onTopicSaved, mode, onItemSaved }: TopicFormModalProps) {
  const [formData, setFormData] = useState<CreateTopicDto>({ systemId: "", name: "", description: "", order: 0, isActive: true });
  const [systems, setSystems] = useState<System[]>([]);
  const [loadingSystems, setLoadingSystems] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const topicsService = useMemo(() => new TopicsService(), []);
  const systemsService = useMemo(() => new SystemsService(), []);
  const isCreateMode = mode === "create";

  useEffect(() => {
    if (isOpen) {
      setLoadingSystems(true);
      systemsService.getSystems({ status: "ACTIVE", listAll: true })
        .then((response) => { setSystems(Array.isArray(response) ? response : response.data || []); })
        .catch(() => setSystems([]))
        .finally(() => setLoadingSystems(false));

      if (isCreateMode) { setFormData({ systemId: "", name: "", description: "", order: 0, isActive: true }); }
      else if (topic) { setFormData({ systemId: topic.systemId, name: topic.name, description: topic.description || "", order: topic.order, isActive: topic.isActive }); }
      setError(null); setSuccess(false);
    }
  }, [isOpen, topic, isCreateMode, systemsService]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => { if (e.key === "Escape" && isOpen) onClose(); };
    if (isOpen) { document.addEventListener("keydown", handleEscape); document.body.style.overflow = "hidden"; }
    return () => { document.removeEventListener("keydown", handleEscape); document.body.style.overflow = "unset"; };
  }, [isOpen, onClose]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : type === "number" ? parseInt(value) || 0 : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.systemId.trim()) { setError("System is required"); return; }
    if (!formData.name.trim()) { setError("Topic name is required"); return; }
    setLoading(true); setError(null); setSuccess(false);
    try {
      const savedCallback = onItemSaved || onTopicSaved;
      if (isCreateMode) {
        const response = await topicsService.createTopic(formData);
        setSuccess(true);
        setTimeout(() => {
          if ("systemId" in response && "name" in response) { savedCallback(response); onClose(); }
          else { topicsService.getTopic((response as CreateResponse).id).then((entity) => { savedCallback(entity); onClose(); }).catch(() => onClose()); }
        }, 1000);
      } else if (topic) {
        const response = await topicsService.updateTopic(topic.id, formData);
        setSuccess(true);
        setTimeout(() => {
          if ("systemId" in response && "name" in response) { savedCallback(response); onClose(); }
          else { topicsService.getTopic(topic.id).then((entity) => { savedCallback(entity); onClose(); }).catch(() => onClose()); }
        }, 1000);
      }
    } catch (err: any) { setError(err?.response?.data?.message || err?.message || "Failed to save topic"); }
    finally { setLoading(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center"><FileText className="h-6 w-6 text-green-600 mr-2" /><h2 className="text-xl font-semibold text-gray-900">{isCreateMode ? "Create Topic" : "Edit Topic"}</h2></div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="h-6 w-6" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          {error && (<div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-center"><AlertCircle className="h-5 w-5 text-red-500 mr-2" /><span className="text-red-700">{error}</span></div>)}
          {success && (<div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" /><span className="text-green-700">Topic saved successfully!</span></div>)}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">System *</label>
              {loadingSystems ? (<div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">Loading systems...</div>) : (
                <Select
                  value={formData.systemId || SELECT_EMPTY_VALUE}
                  onValueChange={(v) =>
                    setFormData((prev) => ({
                      ...prev,
                      systemId: v === SELECT_EMPTY_VALUE ? "" : v,
                    }))
                  }
                >
                  <SelectTrigger className="h-10 w-full border-gray-300 focus:ring-2 focus:ring-green-500">
                    <SelectValue placeholder="Select a system" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="w-[var(--radix-select-trigger-width)]">
                    <SelectItem value={SELECT_EMPTY_VALUE} className="text-gray-500">
                      Select a system
                    </SelectItem>
                    {systems.map((sys) => (
                      <SelectItem key={sys.id} value={sys.id}>
                        {sys.name}
                        {sys.product ? ` (${sys.product.name})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Topic Name *</label><input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" required /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea name="description" value={formData.description} onChange={handleInputChange} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Order</label><input type="number" name="order" value={formData.order} onChange={handleInputChange} min="0" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" /></div>
            <div className="flex items-center"><input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleInputChange} className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded" /><label className="ml-2 block text-sm text-gray-700">Active</label></div>
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" disabled={loading || loadingSystems} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center">
              {loading ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>) : (<><Save className="h-4 w-4 mr-2" />{isCreateMode ? "Create" : "Update"}</>)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
