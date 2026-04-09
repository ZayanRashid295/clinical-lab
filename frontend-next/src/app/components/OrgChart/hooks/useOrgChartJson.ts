import { useState, useCallback } from "react";
import { useToast } from "@/shared/ui/use-toast";
import { OrgChartData } from "@/app/components/OrgChart/org-chart-types/org-chart-model";

export function useOrgChartJson(
  data: OrgChartData,
  setData: React.Dispatch<React.SetStateAction<OrgChartData>>
) {
  const { toast } = useToast();
  const [showJsonEditor, setShowJsonEditor] = useState<boolean>(false);
  const [jsonEditorValue, setJsonEditorValue] = useState<string>("");

  const handlePasteJSON = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      const parsedData = JSON.parse(text);

      if (!parsedData.hierarchy || !Array.isArray(parsedData.hierarchy)) {
        toast({
          title: "Invalid JSON",
          description: "Invalid JSON format. Must contain a 'hierarchy' array.",
          variant: "destructive",
        });
        return;
      }

      setData({
        organizationName: parsedData.organizationName || "Organization",
        description: parsedData.description || "Organizational hierarchy",
        hierarchy: parsedData.hierarchy,
      });

      toast({
        title: "Success",
        description: "Chart updated successfully!",
      });
    } catch (error) {
      console.error("Error parsing JSON:", error);
      toast({
        title: "Error",
        description: "Failed to parse JSON. Please check the format and try again.",
        variant: "destructive",
      });
    }
  }, [setData]);

  const handleOpenJsonEditor = useCallback(() => {
    setJsonEditorValue(JSON.stringify(data, null, 2));
    setShowJsonEditor(true);
  }, [data]);

  const handleSaveJsonEdit = useCallback(() => {
    try {
      const parsedData = JSON.parse(jsonEditorValue);

      if (!parsedData.hierarchy || !Array.isArray(parsedData.hierarchy)) {
        toast({
          title: "Invalid JSON",
          description: "Invalid JSON format. Must contain a 'hierarchy' array.",
          variant: "destructive",
        });
        return;
      }

      setData({
        organizationName: parsedData.organizationName || "Organization",
        description: parsedData.description || "Organizational hierarchy",
        hierarchy: parsedData.hierarchy,
      });

      setShowJsonEditor(false);
      toast({
        title: "Success",
        description: "Chart updated successfully!",
      });
    } catch (error) {
      console.error("Error parsing JSON:", error);
      toast({
        title: "Error",
        description: "Failed to parse JSON. Please check the format and try again.",
        variant: "destructive",
      });
    }
  }, [jsonEditorValue, setData]);

  const handleCancelJsonEdit = useCallback(() => {
    setShowJsonEditor(false);
    setJsonEditorValue("");
  }, []);

  const copyJSON = useCallback(() => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    toast({
      title: "Copied",
      description: "JSON copied to clipboard!",
    });
  }, [data, toast]);

  const downloadJSON = useCallback(() => {
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "org-chart-config.json";
    link.click();
    URL.revokeObjectURL(url);
  }, [data]);

  return {
    showJsonEditor,
    jsonEditorValue,
    setJsonEditorValue,
    handlePasteJSON,
    handleOpenJsonEditor,
    handleSaveJsonEdit,
    handleCancelJsonEdit,
    copyJSON,
    downloadJSON,
  };
}
