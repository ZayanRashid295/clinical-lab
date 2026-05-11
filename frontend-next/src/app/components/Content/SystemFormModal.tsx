import React, { useState, useEffect, useMemo } from "react";
import { X, Layers, Save, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { System, CreateSystemDto } from "../../types/content";
import { SystemsService } from "../../services/systems/systems.service";
import { ProductsService } from "../../services/products/products.service";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SELECT_EMPTY_VALUE,
} from "@/shared/ui/select";
import { getApiErrorMessage } from "@/app/services/base/api-http-error";

interface SystemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  system?: System | null;
  onSystemSaved: (system: System) => void;
  mode: "create" | "edit";
  onItemSaved?: (item: any) => void;
}

export default function SystemFormModal({ isOpen, onClose, system, onSystemSaved, mode, onItemSaved }: SystemFormModalProps) {
  const [formData, setFormData] = useState<CreateSystemDto>({ productId: "", name: "", description: "", order: 0, isActive: true });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const service = useMemo(() => new SystemsService(), []);
  const productsService = useMemo(() => new ProductsService(), []);
  const isCreateMode = mode === "create";

  // Load products when modal opens
  useEffect(() => {
    if (isOpen) {
      setLoadingProducts(true);
      productsService
        .getProducts({ status: "ACTIVE", listAll: true })
        .then((response) => {
          const data = Array.isArray(response) ? response : (response as any)?.data || [];
          setProducts(data);
        })
        .catch(() => setProducts([]))
        .finally(() => setLoadingProducts(false));
    }
  }, [isOpen, productsService, isCreateMode]);

  useEffect(() => {
    if (isOpen) {
      if (isCreateMode) { setFormData({ productId: "", name: "", description: "", order: 0, isActive: true }); }
      else if (system) { setFormData({ productId: system.productId, name: system.name, description: system.description || "", order: system.order, isActive: system.isActive }); }
      setError(null); setSuccess(false);
    }
  }, [isOpen, system, isCreateMode]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => { if (e.key === "Escape" && isOpen) onClose(); };
    if (isOpen) { document.addEventListener("keydown", handleEscape); document.body.style.overflow = "hidden"; }
    return () => { document.removeEventListener("keydown", handleEscape); document.body.style.overflow = "unset"; };
  }, [isOpen, onClose]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : name === "order" ? parseInt(value) || 0 : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) { setError("System name is required"); return; }
    if (!formData.productId.trim()) { setError("Please select a Product"); return; }
    setLoading(true); setError(null); setSuccess(false);
    try {
      const savedCallback = onItemSaved || onSystemSaved;
      if (isCreateMode) { const response = await service.createSystem(formData); setSuccess(true); setTimeout(() => { savedCallback(response as any); onClose(); }, 1000); }
      else if (system) { const response = await service.updateSystem(system.id, formData); setSuccess(true); setTimeout(() => { savedCallback(response as any); onClose(); }, 1000); }
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to save system"));
    }
    finally { setLoading(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center"><Layers className="h-6 w-6 text-indigo-600 mr-2" /><h2 className="text-xl font-semibold text-gray-900">{isCreateMode ? "Create System" : "Edit System"}</h2></div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="h-6 w-6" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          {error && (<div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-center"><AlertCircle className="h-5 w-5 text-red-500 mr-2" /><span className="text-red-700">{error}</span></div>)}
          {success && (<div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" /><span className="text-green-700">System saved successfully!</span></div>)}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product *</label>
              {loadingProducts ? (
                <div className="flex items-center gap-2 text-sm text-gray-500 py-2"><Loader2 className="h-4 w-4 animate-spin" />Loading products...</div>
              ) : (
                <Select
                  value={formData.productId || SELECT_EMPTY_VALUE}
                  onValueChange={(v) =>
                    setFormData((prev) => ({
                      ...prev,
                      productId: v === SELECT_EMPTY_VALUE ? "" : v,
                    }))
                  }
                >
                  <SelectTrigger className="h-10 w-full border-gray-300 focus:ring-2 focus:ring-indigo-500">
                    <SelectValue placeholder="Select a Product..." />
                  </SelectTrigger>
                  <SelectContent position="popper" className="w-[var(--radix-select-trigger-width)]">
                    <SelectItem value={SELECT_EMPTY_VALUE} className="text-gray-500">
                      Select a Product...
                    </SelectItem>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label><input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g., Cardiovascular System" required /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea name="description" value={formData.description} onChange={handleInputChange} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label><input type="number" name="order" value={formData.order} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" min={0} /></div>
            </div>
            <div className="flex items-center"><input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleInputChange} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" /><label className="ml-2 block text-sm text-gray-700">Active</label></div>
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center">
              {loading ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>) : (<><Save className="h-4 w-4 mr-2" />{isCreateMode ? "Create" : "Update"}</>)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
