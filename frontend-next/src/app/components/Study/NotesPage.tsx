"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { Badge } from "@/shared/ui/badge";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  FileText,
  Save,
  X,
  Star,
  Clock,
  Loader2,
  RefreshCw,
  Pin,
  PinOff,
} from "lucide-react";
import {
  notesService,
  type StudentNote,
  type CreateNotePayload,
} from "@/app/services/student";
import { getApiErrorMessage } from "@/app/services/base/api-http-error";
import { APP_GLASS_CARD, APP_PAGE_PADDING, APP_PAGE_SHELL } from "@/app/config/app-shell";
import { cn } from "@/shared/utils/cn";

const COLOR_CHOICES = [
  { id: "yellow", className: "bg-yellow-100 dark:bg-yellow-900/30" },
  { id: "blue", className: "bg-blue-100 dark:bg-blue-900/30" },
  { id: "green", className: "bg-green-100 dark:bg-green-900/30" },
  { id: "pink", className: "bg-pink-100 dark:bg-pink-900/30" },
  { id: "purple", className: "bg-purple-100 dark:bg-purple-900/30" },
];

const blankNote: CreateNotePayload = {
  title: "",
  body: "",
  color: "yellow",
  pinned: false,
  tags: [],
};

export default function NotesPage() {
  const [notes, setNotes] = useState<StudentNote[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    pinned: number;
    recent: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<StudentNote | null>(null);
  const [draft, setDraft] = useState<CreateNotePayload>(blankNote);
  const [tagInput, setTagInput] = useState("");
  const [showEditor, setShowEditor] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, s] = await Promise.all([
        notesService.list({ search: search || undefined }),
        notesService.stats(),
      ]);
      setNotes(list);
      setStats(s);
    } catch (e: any) {
      setError(getApiErrorMessage(e, "Failed to load notes"));
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  // Debounced server search so very large note libraries stay snappy
  useEffect(() => {
    const handle = setTimeout(() => {
      load();
    }, 250);
    return () => clearTimeout(handle);
  }, [load]);

  const filtered = useMemo(() => {
    if (!search) return notes;
    const s = search.toLowerCase();
    return notes.filter(
      (n) =>
        n.title.toLowerCase().includes(s) ||
        n.body.toLowerCase().includes(s) ||
        (n.tags ?? []).some((t) => t.toLowerCase().includes(s))
    );
  }, [notes, search]);

  const openCreate = () => {
    setEditing(null);
    setDraft(blankNote);
    setTagInput("");
    setShowEditor(true);
  };

  const openEdit = (n: StudentNote) => {
    setEditing(n);
    setDraft({
      title: n.title,
      body: n.body,
      color: n.color || "yellow",
      pinned: n.pinned,
      tags: n.tags ?? [],
    });
    setTagInput("");
    setShowEditor(true);
  };

  const save = async () => {
    if (!draft.title.trim() || !draft.body.trim()) return;
    setBusy(true);
    try {
      if (editing) {
        await notesService.update(editing.id, draft);
      } else {
        await notesService.create(draft);
      }
      setShowEditor(false);
      await load();
    } catch (e: any) {
      setError(getApiErrorMessage(e, "Could not save note"));
    } finally {
      setBusy(false);
    }
  };

  const togglePin = async (n: StudentNote) => {
    try {
      await notesService.update(n.id, { pinned: !n.pinned });
      await load();
    } catch (e: any) {
      setError(getApiErrorMessage(e, "Failed to toggle pin"));
    }
  };

  const remove = async (n: StudentNote) => {
    if (!confirm(`Delete note "${n.title}"?`)) return;
    try {
      await notesService.remove(n.id);
      await load();
    } catch (e: any) {
      setError(getApiErrorMessage(e, "Failed to delete note"));
    }
  };

  const addTag = () => {
    if (!tagInput.trim()) return;
    setDraft((d) => ({
      ...d,
      tags: Array.from(new Set([...(d.tags ?? []), tagInput.trim()])),
    }));
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setDraft((d) => ({ ...d, tags: (d.tags ?? []).filter((t) => t !== tag) }));
  };

  const colorClass = (c?: string | null) =>
    COLOR_CHOICES.find((x) => x.id === c)?.className ??
    "bg-white dark:bg-white/5";

  return (
    <div className={cn(APP_PAGE_SHELL, APP_PAGE_PADDING, "space-y-6")}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Notes</h1>
          <p className="text-muted-foreground mt-2">
            Capture pearls, mnemonics and review pieces in one place
          </p>
        </div>
        <div className="flex items-center gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin text-gray-500" />}
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" /> New Note
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatTile
          label="Total notes"
          value={stats?.total ?? notes.length}
          icon={FileText}
          color="text-primary-600 dark:text-primary-400"
        />
        <StatTile
          label="Pinned"
          value={stats?.pinned ?? notes.filter((n) => n.pinned).length}
          icon={Star}
          color="text-primary-600 dark:text-primary-400"
        />
        <StatTile
          label="Updated this week"
          value={stats?.recent ?? 0}
          icon={Clock}
          color="text-primary-600 dark:text-primary-400"
        />
      </div>

      <Card className={cn(APP_GLASS_CARD)}>
        <CardContent className="p-4">
          <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
              placeholder="Search title, body, tag…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((n) => (
          <Card
            key={n.id}
            className={cn(
              colorClass(n.color),
              "border border-slate-200/90 shadow-sm dark:border-white/10"
            )}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base font-semibold text-gray-900 dark:text-white line-clamp-2">
                  {n.title}
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => togglePin(n)}
                    aria-label="Toggle pin"
                  >
                    {n.pinned ? (
                      <Pin className="h-4 w-4 fill-yellow-400 text-yellow-500" />
                    ) : (
                      <PinOff className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(n)}
                    aria-label="Edit note"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(n)}
                    aria-label="Delete note"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
            </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap line-clamp-6">
                {n.body}
              </p>
              {(n.tags ?? []).length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {(n.tags ?? []).map((t) => (
                    <Badge key={t} variant="secondary" className="text-xs">
                      {t}
                    </Badge>
                  ))}
              </div>
              )}
              <div className="mt-3 text-xs text-gray-500">
                Updated {new Date(n.updatedAt).toLocaleDateString()}
            </div>
          </CardContent>
        </Card>
        ))}
        {!loading && filtered.length === 0 && (
          <Card className={cn(APP_GLASS_CARD, "md:col-span-2 lg:col-span-3")}>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No notes yet</h3>
              <p className="text-muted-foreground mb-4">
                Capture quick pearls or detailed write-ups so you can come back
                to them while practicing.
              </p>
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4 mr-2" /> Create your first note
              </Button>
          </CardContent>
        </Card>
      )}
      </div>

      {showEditor && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <Card className={cn(APP_GLASS_CARD, "w-full max-w-2xl max-h-[90vh] overflow-y-auto")}>
          <CardHeader>
            <div className="flex items-center justify-between">
                <CardTitle>{editing ? "Edit note" : "New note"}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEditor(false)}
                >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
                placeholder="Title"
                value={draft.title}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, title: e.target.value }))
                }
              />
              <Textarea
                placeholder="Write your note…"
                value={draft.body}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, body: e.target.value }))
                }
                rows={8}
              />
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Color</p>
                <div className="flex gap-2">
                  {COLOR_CHOICES.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setDraft((d) => ({ ...d, color: c.id }))}
                      className={`w-8 h-8 rounded-full ${c.className} border ${
                        draft.color === c.id
                          ? "ring-2 ring-primary border-transparent"
                          : "border-gray-300"
                      }`}
                      aria-label={`Color ${c.id}`}
                    />
              ))}
            </div>
            </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Tags</p>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add tag and press Enter"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={addTag}>
                    Add
                    </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(draft.tags ?? []).map((t) => (
                    <Badge
                      key={t}
                      variant="secondary"
                      className="text-xs cursor-pointer"
                      onClick={() => removeTag(t)}
                    >
                      {t} <X className="inline ml-1 h-3 w-3" />
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                  variant={draft.pinned ? "default" : "outline"}
                  onClick={() => setDraft((d) => ({ ...d, pinned: !d.pinned }))}
                >
                  {draft.pinned ? (
                    <Pin className="h-4 w-4 mr-2" />
                  ) : (
                    <PinOff className="h-4 w-4 mr-2" />
                  )}
                  {draft.pinned ? "Pinned" : "Pin"}
                        </Button>
                <div className="flex-1" />
                        <Button
                          variant="outline"
                  onClick={() => setShowEditor(false)}
                  disabled={busy}
                >
                  Cancel
                </Button>
                <Button onClick={save} disabled={busy}>
                  {busy ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save
                        </Button>
                </div>
              </CardContent>
            </Card>
        </div>
      )}
    </div>
  );
}

function StatTile({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: any;
  color: string;
}) {
  return (
    <Card className={cn(APP_GLASS_CARD)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <Icon className={`h-8 w-8 ${color}`} />
        </div>
      </CardContent>
    </Card>
  );
}
