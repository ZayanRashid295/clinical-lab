import React, { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  Save,
  X,
} from "lucide-react";
import { MenuItem } from "../../types/menu";

const MenuManager = () => {
  const initialItems = [
    {
      id: "dashboard",
      label: "menu.dashboard",
      icon: "🏠",
      path: "/test-creation/new",
      roles: ["ADMIN", "FACULTY"],
    },
    {
      id: "study",
      label: "menu.study",
      icon: "📚",
      path: "/study",
      roles: ["ADMIN", "STUDENT", "FACULTY"],
      submenu: [
        {
          id: "question-bank",
          label: "menu.questionBank",
          icon: "🗂️",
          path: "/study/question-bank",
          roles: ["ADMIN", "STUDENT", "FACULTY"],
        },
        {
          id: "study-materials",
          label: "menu.studyMaterials",
          icon: "📄",
          path: "/study/materials",
          roles: ["ADMIN", "STUDENT", "FACULTY"],
        },
        {
          id: "flashcards",
          label: "menu.flashcards",
          icon: "🃏",
          path: "/study/flashcards",
          roles: ["ADMIN", "STUDENT", "FACULTY"],
        },
        {
          id: "notes",
          label: "menu.notes",
          icon: "📝",
          path: "/study/notes",
          roles: ["ADMIN", "STUDENT", "FACULTY"],
        },
      ],
    },
    {
      id: "payments",
      label: "menu.payments",
      icon: "💳",
      path: "/payments",
      roles: ["ADMIN", "DRIVER", "PASSENGER", "FLEET_MANAGER"],
      submenu: [
        {
          id: "payment-history",
          label: "menu.paymentHistory",
          icon: "📋",
          path: "/payments/history",
          roles: ["ADMIN", "DRIVER", "PASSENGER", "FLEET_MANAGER"],
        },
        {
          id: "payment-methods",
          label: "menu.paymentMethods",
          icon: "💳",
          path: "/payments/methods",
          roles: ["ADMIN", "DRIVER", "PASSENGER"],
        },
        {
          id: "payouts",
          label: "menu.payouts",
          icon: "💰",
          path: "/payments/payouts",
          roles: ["ADMIN", "DRIVER", "FLEET_MANAGER"],
        },
        {
          id: "invoices",
          label: "menu.invoices",
          icon: "🧾",
          path: "/payments/invoices",
          roles: ["ADMIN", "FLEET_MANAGER"],
        },
      ],
    },
    {
      id: "chat",
      label: "menu.messages",
      icon: "💬",
      path: "/chat",
      roles: ["ADMIN", "DRIVER", "PASSENGER", "FLEET_MANAGER"],
      submenu: [
        {
          id: "chat-rooms",
          label: "menu.chat",
          icon: "💬",
          path: "/chat/rooms",
          roles: ["ADMIN", "DRIVER", "PASSENGER", "FLEET_MANAGER"],
        },
        {
          id: "support",
          label: "menu.support",
          icon: "🆘",
          path: "/chat/support",
          roles: ["ADMIN", "DRIVER", "PASSENGER", "FLEET_MANAGER"],
        },
        {
          id: "notifications",
          label: "menu.notifications",
          icon: "🔔",
          path: "/chat/notifications",
          roles: ["ADMIN", "DRIVER", "PASSENGER", "FLEET_MANAGER"],
        },
      ],
    },
    {
      id: "test-creation",
      label: "menu.testCreation",
      icon: "✏️",
      path: "/test-creation",
      roles: ["ADMIN", "FACULTY"],
      submenu: [
        {
          id: "study-create-test",
          label: "menu.studyCreateTest",
          icon: "📝",
          path: "/test-creation/study-create",
          roles: ["ADMIN", "FACULTY"],
        },
        {
          id: "previous-tests",
          label: "menu.previousTests",
          icon: "📊",
          path: "/previous-tests",
          roles: ["ADMIN", "STUDENT", "FACULTY"],
        },
        {
          id: "test-templates",
          label: "menu.testTemplates",
          icon: "📋",
          path: "/test-creation/templates",
          roles: ["ADMIN", "FACULTY"],
        },
        {
          id: "question-builder",
          label: "menu.questionBuilder",
          icon: "🔨",
          path: "/test-creation/builder",
          roles: ["ADMIN", "FACULTY"],
        },
        {
          id: "new-question-builder",
          label: "menu.newQuestionBuilder",
          icon: "🆕",
          path: "/test-creation/new-builder",
          roles: ["ADMIN", "FACULTY"],
        },
        {
          id: "test-settings",
          label: "menu.testSettings",
          icon: "⚙️",
          path: "/test-creation/settings",
          roles: ["ADMIN", "FACULTY"],
        },
      ],
    },
    {
      id: "admin",
      label: "menu.admin",
      icon: "⚙️",
      path: "/admin",
      roles: ["ADMIN"],
      submenu: [
        {
          id: "users",
          label: "menu.users",
          icon: "👥",
          path: "/admin/users",
          roles: ["ADMIN"],
        },
        {
          id: "roles",
          label: "menu.roles",
          icon: "🔐",
          path: "/admin/roles",
          roles: ["ADMIN"],
        },
        {
          id: "system-settings",
          label: "menu.systemSettings",
          icon: "⚙️",
          path: "/admin/settings",
          roles: ["ADMIN"],
        },
        {
          id: "tables",
          label: "menu.tables",
          icon: "📊",
          path: "/admin/tables",
          roles: ["ADMIN"],
        },
      ],
    },
    {
      id: "subscriptions",
      label: "menu.subscriptions",
      icon: "💳",
      path: "/admin/subscriptions",
      roles: ["ADMIN"],
      submenu: [
        {
          id: "subscriptions-list",
          label: "menu.subscriptionsList",
          icon: "📋",
          path: "/admin/subscriptions",
          roles: ["ADMIN"],
        },
        {
          id: "subscription-packages",
          label: "menu.subscriptionPackages",
          icon: "📦",
          path: "/admin/subscriptions/packages",
          roles: ["ADMIN"],
        },
        {
          id: "package-features",
          label: "menu.packageFeatures",
          icon: "⭐",
          path: "/admin/subscriptions/features",
          roles: ["ADMIN"],
        },
      ],
    },
    {
      id: "products",
      label: "menu.products",
      icon: "📦",
      path: "/admin/products",
      roles: ["ADMIN"],
      submenu: [
        {
          id: "products-list",
          label: "menu.productsList",
          icon: "📋",
          path: "/admin/products",
          roles: ["ADMIN"],
        },
        {
          id: "product-tags",
          label: "menu.productTags",
          icon: "🏷️",
          path: "/admin/products/tags",
          roles: ["ADMIN"],
        },
        {
          id: "product-subtypes",
          label: "menu.productSubtypes",
          icon: "🔖",
          path: "/admin/products/subtypes",
          roles: ["ADMIN"],
        },
      ],
    },
    {
      id: "content",
      label: "menu.content",
      icon: "📚",
      path: "/admin/content",
      roles: ["ADMIN"],
      submenu: [
        {
          id: "sections",
          label: "menu.sections",
          icon: "📑",
          path: "/admin/content/sections",
          roles: ["ADMIN"],
        },
        {
          id: "chapters",
          label: "menu.chapters",
          icon: "📖",
          path: "/admin/content/chapters",
          roles: ["ADMIN"],
        },
        {
          id: "topics",
          label: "menu.topics",
          icon: "📝",
          path: "/admin/content/topics",
          roles: ["ADMIN"],
        },
        {
          id: "questions",
          label: "menu.questions",
          icon: "❓",
          path: "/admin/content/questions",
          roles: ["ADMIN"],
        },
        {
          id: "question-choices",
          label: "menu.questionChoices",
          icon: "⭕",
          path: "/admin/content/question-choices",
          roles: ["ADMIN"],
        },
      ],
    },
    {
      id: "assessments",
      label: "menu.assessments",
      icon: "📝",
      path: "/admin/assessments",
      roles: ["ADMIN"],
      submenu: [
        {
          id: "question-papers",
          label: "menu.questionPapers",
          icon: "📄",
          path: "/admin/assessments/question-papers",
          roles: ["ADMIN"],
        },
        {
          id: "question-paper-questions",
          label: "menu.questionPaperQuestions",
          icon: "❓",
          path: "/admin/assessments/question-paper-questions",
          roles: ["ADMIN"],
        },
      ],
    },
    {
      id: "misc",
      label: "Misc",
      icon: "⚙️",
      path: "/med-app",
      roles: ["ADMIN"],
      submenu: [
        {
          id: "zoom-simulation",
          label: "menu.zoomSimulation",
          icon: "📹",
          path: "/zoom",
          roles: ["ADMIN", "DRIVER", "PASSENGER", "FLEET_MANAGER"],
        },
        {
          id: "robotic",
          label: "menu.robotic",
          icon: "🤖",
          path: "/robotic",
          roles: ["ADMIN", "DRIVER", "PASSENGER", "FLEET_MANAGER"],
        },
      ],
    },
  ];

  const [items, setItems] = useState<MenuItem[]>(initialItems);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<MenuItem>({} as MenuItem);
  const [draggedItem, setDraggedItem] = useState<MenuItem | null>(null);
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const startEdit = (item: MenuItem) => {
    setEditingId(item.id);
    setEditData({ ...item });
  };

  const saveEdit = () => {
    const updateItem = (arr: MenuItem[]): MenuItem[] => {
      return arr.map((item: MenuItem) => {
        if (item.id === editingId) {
          return { ...editData };
        }
        if (item.submenu) {
          return { ...item, submenu: updateItem(item.submenu) };
        }
        return item;
      });
    };
    setItems(updateItem(items));
    setEditingId(null);
    setEditData({} as MenuItem);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({} as MenuItem);
  };

  const deleteItem = (id: string) => {
    const deleteFromArray = (arr: MenuItem[]): MenuItem[] => {
      return arr.filter((item: MenuItem) => {
        if (item.id === id) return false;
        if (item.submenu) {
          item.submenu = deleteFromArray(item.submenu);
        }
        return true;
      });
    };
    setItems(deleteFromArray(items));
  };

  const moveItem = (id: string, direction: "up" | "down") => {
    const moveInArray = (
      arr: MenuItem[],
      targetId: string,
      dir: "up" | "down"
    ): boolean => {
      const index = arr.findIndex((item: MenuItem) => item.id === targetId);
      if (index === -1) {
        for (let item of arr) {
          if (item.submenu) {
            const result = moveInArray(item.submenu, targetId, dir);
            if (result) return true;
          }
        }
        return false;
      }

      if (dir === "up" && index > 0) {
        [arr[index], arr[index - 1]] = [arr[index - 1], arr[index]];
        return true;
      } else if (dir === "down" && index < arr.length - 1) {
        [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
        return true;
      }
      return false;
    };

    const newItems = JSON.parse(JSON.stringify(items)) as MenuItem[];
    moveInArray(newItems, id, direction);
    setItems(newItems);
  };

  const promoteItem = (id: string) => {
    const promoteInArray = (
      arr: MenuItem[],
      targetId: string,
      depth = 0
    ): boolean => {
      for (let i = 0; i < arr.length; i++) {
        const submenu = arr[i].submenu;
        if (submenu && submenu.length > 0) {
          const subIndex = submenu.findIndex(
            (item: MenuItem) => item.id === targetId
          );
          if (subIndex !== -1) {
            const item = submenu[subIndex];
            submenu.splice(subIndex, 1);
            arr.splice(i + 1, 0, item);
            return true;
          }
          if (promoteInArray(submenu, targetId, depth + 1)) {
            return true;
          }
        }
      }
      return false;
    };

    const newItems = JSON.parse(JSON.stringify(items)) as MenuItem[];
    promoteInArray(newItems, id);
    setItems(newItems);
  };

  const demoteItem = (id: string) => {
    const demoteInArray = (arr: MenuItem[], targetId: string): boolean => {
      const index = arr.findIndex((item: MenuItem) => item.id === targetId);
      if (index === -1) {
        for (let item of arr) {
          if (item.submenu) {
            if (demoteInArray(item.submenu, targetId)) return true;
          }
        }
        return false;
      }

      if (index > 0) {
        const parentItem = arr[index - 1];
        if (!parentItem.submenu) {
          parentItem.submenu = [];
        }
        const item = arr.splice(index, 1)[0];
        parentItem.submenu.push(item);
        return true;
      }
      return false;
    };

    const newItems = JSON.parse(JSON.stringify(items)) as MenuItem[];
    demoteInArray(newItems, id);
    setItems(newItems);
  };

  const renderMenuTree = (menuItems: MenuItem[], depth = 0) => {
    return (
      <div className="space-y-1">
        {menuItems.map((item: MenuItem) => (
          <div key={item.id} className={`${depth > 0 ? "ml-6" : ""}`}>
            {editingId === item.id ? (
              <EditItemForm
                item={editData}
                onChange={setEditData}
                onSave={saveEdit}
                onCancel={cancelEdit}
              />
            ) : (
              <div
                draggable
                onDragStart={() => setDraggedItem(item)}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverItem(item.id);
                }}
                onDragLeave={() => setDragOverItem(null)}
                onDrop={() => {
                  if (draggedItem && draggedItem.id !== item.id) {
                    // Simple reorder - in production, implement full drag-drop logic
                  }
                  setDraggedItem(null);
                  setDragOverItem(null);
                }}
                className={`flex items-center gap-2 p-2 rounded border transition-all ${
                  dragOverItem === item.id
                    ? "bg-blue-100 border-blue-400"
                    : "bg-white border-gray-200 hover:bg-gray-50"
                } ${
                  draggedItem && draggedItem.id === item.id ? "opacity-50" : ""
                }`}
              >
                {item.submenu && item.submenu.length > 0 ? (
                  <button
                    onClick={() => toggleExpand(item.id)}
                    className="p-1 hover:bg-gray-200 rounded flex-shrink-0"
                  >
                    {expandedItems.has(item.id) ? (
                      <ChevronDown size={18} />
                    ) : (
                      <ChevronRight size={18} />
                    )}
                  </button>
                ) : (
                  <div className="w-6 flex-shrink-0" />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg flex-shrink-0">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900 truncate">
                        {item.label}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {item.path}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 mt-1 ml-6">
                    Roles: {item.roles.join(", ")}
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => moveItem(item.id, "up")}
                    className="p-1 hover:bg-blue-100 rounded text-blue-600 transition-colors"
                    title="Move up"
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    onClick={() => moveItem(item.id, "down")}
                    className="p-1 hover:bg-blue-100 rounded text-blue-600 transition-colors"
                    title="Move down"
                  >
                    <ArrowDown size={16} />
                  </button>
                  {depth > 0 && (
                    <button
                      onClick={() => promoteItem(item.id)}
                      className="p-1 hover:bg-green-100 rounded text-green-600 transition-colors"
                      title="Promote to parent level"
                    >
                      <ArrowUp size={16} />
                    </button>
                  )}
                  {depth === 0 && (
                    <button
                      onClick={() => demoteItem(item.id)}
                      className="p-1 hover:bg-yellow-100 rounded text-yellow-600 transition-colors"
                      title="Demote to submenu"
                    >
                      <ArrowDown size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => startEdit(item)}
                    className="p-1 hover:bg-orange-100 rounded text-orange-600 transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="p-1 hover:bg-red-100 rounded text-red-600 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )}

            {expandedItems.has(item.id) &&
              item.submenu &&
              item.submenu.length > 0 && (
                <div className="mt-1">
                  {renderMenuTree(item.submenu, depth + 1)}
                </div>
              )}
          </div>
        ))}
      </div>
    );
  };

  const downloadJSON = () => {
    const dataStr = JSON.stringify({ items }, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "menu-config.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const copyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify({ items }, null, 2));
    alert("Menu configuration copied to clipboard!");
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 bg-white">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Menu Manager</h1>
        <p className="text-sm text-gray-600">
          Manage your menu system with drag-drop, edit, delete, and
          promote/demote functionality
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-sm text-blue-900 mb-3">Controls:</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm text-blue-800">
          <div className="flex items-center gap-2">
            <span className="font-semibold">↑/↓</span> Move within level
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-green-100 px-2 py-1 rounded font-semibold">
              ↑
            </span>{" "}
            Promote item
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-yellow-100 px-2 py-1 rounded font-semibold">
              ↓
            </span>{" "}
            Demote item
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">✏️</span> Edit details
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">🗑️</span> Delete item
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">🖱️</span> Drag & drop
          </div>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg p-4 max-h-screen overflow-y-auto bg-gray-50 mb-6">
        {renderMenuTree(items)}
      </div>

      <div className="flex gap-3 mb-6">
        <button
          onClick={copyJSON}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm"
        >
          Copy JSON
        </button>
        <button
          onClick={downloadJSON}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors text-sm"
        >
          Download JSON
        </button>
      </div>

      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="font-semibold text-sm text-gray-900 mb-3">
          JSON Output:
        </h3>
        <pre className="text-xs bg-white p-3 rounded border border-gray-300 overflow-auto max-h-64 text-gray-700 font-mono">
          {JSON.stringify({ items }, null, 2)}
        </pre>
      </div>
    </div>
  );
};

interface EditItemFormProps {
  item: MenuItem;
  onChange: (item: MenuItem) => void;
  onSave: () => void;
  onCancel: () => void;
}

const EditItemForm = ({
  item,
  onChange,
  onSave,
  onCancel,
}: EditItemFormProps) => {
  return (
    <div className="p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Label
          </label>
          <input
            type="text"
            value={item.label}
            onChange={(e) => onChange({ ...item, label: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Icon
          </label>
          <input
            type="text"
            value={item.icon}
            onChange={(e) => onChange({ ...item, icon: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Path
          </label>
          <input
            type="text"
            value={item.path}
            onChange={(e) => onChange({ ...item, path: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ID
          </label>
          <input
            type="text"
            value={item.id}
            onChange={(e) => onChange({ ...item, id: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Roles (comma-separated)
          </label>
          <input
            type="text"
            value={item.roles.join(", ")}
            onChange={(e) =>
              onChange({
                ...item,
                roles: e.target.value
                  .split(",")
                  .map((r) => r.trim())
                  .filter((r) => r),
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
        </div>
      </div>
      <div className="flex gap-2 justify-end pt-2 border-t border-yellow-200">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <X size={16} /> Cancel
        </button>
        <button
          onClick={onSave}
          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <Save size={16} /> Save
        </button>
      </div>
    </div>
  );
};

export default MenuManager;

