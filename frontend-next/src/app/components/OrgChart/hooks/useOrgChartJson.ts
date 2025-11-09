import { useState, useCallback } from "react";
import { OrgChartData } from "@/app/components/OrgChart/org-chart-types/org-chart-model";

export function useOrgChartJson(
  data: OrgChartData,
  setData: React.Dispatch<React.SetStateAction<OrgChartData>>
) {
  const [showJsonEditor, setShowJsonEditor] = useState<boolean>(false);
  const [jsonEditorValue, setJsonEditorValue] = useState<string>("");

  const handlePasteJSON = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      const parsedData = JSON.parse(text);

      if (!parsedData.hierarchy || !Array.isArray(parsedData.hierarchy)) {
        alert("Invalid JSON format. Must contain a 'hierarchy' array.");
        return;
      }

      setData({
        organizationName: parsedData.organizationName || "Organization",
        description: parsedData.description || "Organizational hierarchy",
        hierarchy: parsedData.hierarchy,
      });

      alert("Chart updated successfully!");
    } catch (error) {
      console.error("Error parsing JSON:", error);
      alert("Failed to parse JSON. Please check the format and try again.");
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
        alert("Invalid JSON format. Must contain a 'hierarchy' array.");
        return;
      }

      setData({
        organizationName: parsedData.organizationName || "Organization",
        description: parsedData.description || "Organizational hierarchy",
        hierarchy: parsedData.hierarchy,
      });

      setShowJsonEditor(false);
      alert("Chart updated successfully!");
    } catch (error) {
      console.error("Error parsing JSON:", error);
      alert("Failed to parse JSON. Please check the format and try again.");
    }
  }, [jsonEditorValue, setData]);

  const handleCancelJsonEdit = useCallback(() => {
    setShowJsonEditor(false);
    setJsonEditorValue("");
  }, []);

  const copyJSON = useCallback(() => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    alert("JSON copied to clipboard!");
  }, [data]);

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
