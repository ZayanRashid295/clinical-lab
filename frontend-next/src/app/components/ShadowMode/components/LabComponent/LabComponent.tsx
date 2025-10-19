import React from "react";
import { TestTube } from "lucide-react";

interface LabResult {
  id: string;
  orderedAt: string;
  tests: Array<{
    type: "urine" | "blood" | "LDL" | "HDL";
    status: "pending" | "completed";
    results?: any;
  }>;
}

interface LabComponentProps {
  labResults: LabResult[];
}

const LabComponent: React.FC<LabComponentProps> = ({ labResults }) => {
  const getTestIcon = (type: string) => {
    switch (type) {
      case "blood":
        return "🩸";
      case "urine":
        return "🧪";
      case "LDL":
        return "📊";
      case "HDL":
        return "📈";
      default:
        return "🔬";
    }
  };

  const getTestColor = (type: string) => {
    switch (type) {
      case "blood":
        return "bg-red-50 border-red-200";
      case "urine":
        return "bg-yellow-50 border-yellow-200";
      case "LDL":
        return "bg-orange-50 border-orange-200";
      case "HDL":
        return "bg-green-50 border-green-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const renderTestResults = (test: any) => {
    if (test.status === "pending") {
      return (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-gray-600">Processing...</span>
        </div>
      );
    }

    if (!test.results) return null;

    const { results } = test;

    switch (test.type) {
      case "blood":
        return (
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">RBC:</span>
              <span className="text-sm font-medium">{results.rbc} M/μL</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">WBC:</span>
              <span className="text-sm font-medium">{results.wbc} K/μL</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Hemoglobin:</span>
              <span className="text-sm font-medium">
                {results.hemoglobin} g/dL
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Platelets:</span>
              <span className="text-sm font-medium">
                {results.platelets} K/μL
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Hematocrit:</span>
              <span className="text-sm font-medium">{results.hematocrit}%</span>
            </div>
          </div>
        );

      case "urine":
        return (
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">pH:</span>
              <span className="text-sm font-medium">{results.pH}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Glucose:</span>
              <span className="text-sm font-medium">
                {results.glucose} mg/dL
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Protein:</span>
              <span className="text-sm font-medium">
                {results.protein} mg/dL
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">RBC:</span>
              <span className="text-sm font-medium">{results.rbc} /HPF</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">WBC:</span>
              <span className="text-sm font-medium">{results.wbc} /HPF</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Specific Gravity:</span>
              <span className="text-sm font-medium">
                {results.specificGravity}
              </span>
            </div>
          </div>
        );

      case "LDL":
        return (
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">LDL Cholesterol:</span>
              <span className="text-sm font-medium">{results.ldl} mg/dL</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Status:</span>
              <span
                className={`text-sm font-medium ${
                  results.ldl < 100
                    ? "text-green-600"
                    : results.ldl < 160
                    ? "text-yellow-600"
                    : "text-red-600"
                }`}
              >
                {results.ldl < 100
                  ? "Optimal"
                  : results.ldl < 160
                  ? "Borderline"
                  : "High"}
              </span>
            </div>
            <div className="text-xs text-gray-500">Normal: &lt;100 mg/dL</div>
          </div>
        );

      case "HDL":
        return (
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">HDL Cholesterol:</span>
              <span className="text-sm font-medium">{results.hdl} mg/dL</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Status:</span>
              <span
                className={`text-sm font-medium ${
                  results.hdl > 60
                    ? "text-green-600"
                    : results.hdl > 40
                    ? "text-yellow-600"
                    : "text-red-600"
                }`}
              >
                {results.hdl > 60
                  ? "High"
                  : results.hdl > 40
                  ? "Normal"
                  : "Low"}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              Normal: &gt;40 mg/dL (men), &gt;50 mg/dL (women)
            </div>
          </div>
        );

      default:
        return (
          <div className="text-sm text-gray-500">No results available</div>
        );
    }
  };

  if (labResults.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-3 h-full flex flex-col">
        <div className="flex items-center gap-1 mb-2">
          <TestTube className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-gray-800">Lab Results</h3>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <span className="text-gray-500 text-sm">
            No lab tests ordered yet
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-3 h-full flex flex-col">
      <div className="flex items-center gap-1 mb-2">
        <TestTube className="w-4 h-4 text-blue-600" />
        <h3 className="text-sm font-bold text-gray-800">Lab Results</h3>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3">
        {labResults.map((order) => (
          <div
            key={order.id}
            className="bg-blue-50 border border-blue-200 rounded-lg p-3"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-blue-800">
                Order #{order.id.slice(-4)}
              </span>
              <span className="text-xs text-gray-600">
                {new Date(order.orderedAt).toLocaleTimeString()}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {order.tests.map((test, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-2 ${getTestColor(test.type)}`}
                >
                  <div className="flex items-center gap-1 mb-2">
                    <span className="text-sm">{getTestIcon(test.type)}</span>
                    <span className="text-xs font-medium capitalize">
                      {test.type}
                    </span>
                    <span
                      className={`text-xs px-1 rounded ${
                        test.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {test.status}
                    </span>
                  </div>
                  {renderTestResults(test)}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LabComponent;
