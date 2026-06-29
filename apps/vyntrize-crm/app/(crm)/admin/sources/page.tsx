"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Edit2, RefreshCw, Play, CheckCircle, XCircle, Loader2, Rss, Key, Database } from "lucide-react";
import {
  getSourceIntegrations,
  createSourceIntegration,
  updateSourceIntegration,
  deleteSourceIntegration,
} from "@/lib/actions/source-integration.actions";

type CrawlerStatus = "idle" | "running" | "success" | "error";

export default function SourcesAdminPage() {
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ provider: "", apiKey: "", config: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [crawlerStatus, setCrawlerStatus] = useState<CrawlerStatus>("idle");
  const [crawlerResult, setCrawlerResult] = useState<{ saved?: number; error?: string } | null>(null);

  const fetchSources = async () => {
    setLoading(true);
    const res = await getSourceIntegrations();
    if (res.success && res.data) setSources(res.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchSources();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let configData = null;
    if (form.config.trim()) {
      try { configData = JSON.parse(form.config); }
      catch { alert("Invalid JSON in Config field."); return; }
    }

    if (editingId) {
      await updateSourceIntegration(editingId, { apiKey: form.apiKey, config: configData });
    } else {
      await createSourceIntegration({ provider: form.provider, apiKey: form.apiKey, config: configData });
    }
    setForm({ provider: "", apiKey: "", config: "" });
    setEditingId(null);
    fetchSources();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this source?")) {
      await deleteSourceIntegration(id);
      fetchSources();
    }
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    await updateSourceIntegration(id, { isActive: !currentStatus });
    fetchSources();
  };

  const handleRunCrawler = async () => {
    setCrawlerStatus("running");
    setCrawlerResult(null);
    try {
      const res = await fetch("/api/crawler/run", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setCrawlerStatus("success");
        setCrawlerResult({ saved: data.saved });
      } else {
        setCrawlerStatus("error");
        setCrawlerResult({ error: data.error });
      }
    } catch (err: any) {
      setCrawlerStatus("error");
      setCrawlerResult({ error: err.message });
    }
  };

  const activeCount = sources.filter(s => s.isActive).length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Content Sources</h1>
          <p className="text-[var(--color-text-muted)] mt-1">
            Manage API integrations powering the Recommendation Engine
          </p>
        </div>
        <button
          onClick={fetchSources}
          className="p-2 border rounded-md hover:bg-[var(--color-bg-hover)] text-[var(--color-text)] transition-colors"
          title="Refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border bg-[var(--color-surface)] flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg"><Database className="h-5 w-5 text-blue-600" /></div>
          <div>
            <p className="text-xs text-[var(--color-text-muted)]">Total Sources</p>
            <p className="text-2xl font-bold text-[var(--color-text)]">{sources.length}</p>
          </div>
        </div>
        <div className="p-4 rounded-xl border bg-[var(--color-surface)] flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg"><Rss className="h-5 w-5 text-green-600" /></div>
          <div>
            <p className="text-xs text-[var(--color-text-muted)]">Active Sources</p>
            <p className="text-2xl font-bold text-[var(--color-text)]">{activeCount}</p>
          </div>
        </div>
        <div className="p-4 rounded-xl border bg-[var(--color-surface)] flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg"><Key className="h-5 w-5 text-purple-600" /></div>
          <div>
            <p className="text-xs text-[var(--color-text-muted)]">With API Key</p>
            <p className="text-2xl font-bold text-[var(--color-text)]">{sources.filter(s => s.apiKey).length}</p>
          </div>
        </div>
      </div>

      {/* Run Crawler Card */}
      <div className="p-5 rounded-xl border bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
        <div>
          <h2 className="font-semibold text-[var(--color-text)]">Recommendation Engine</h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
            Crawl all active sources, classify with AI, and save new articles to the database.
          </p>
          {crawlerResult && (
            <p className={`text-sm mt-2 font-medium ${crawlerStatus === "success" ? "text-green-600" : "text-red-600"}`}>
              {crawlerStatus === "success"
                ? `✓ Done! Saved ${crawlerResult.saved} new article${crawlerResult.saved === 1 ? "" : "s"}.`
                : `✗ Error: ${crawlerResult.error}`}
            </p>
          )}
        </div>
        <button
          onClick={handleRunCrawler}
          disabled={crawlerStatus === "running"}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors whitespace-nowrap shadow-sm"
        >
          {crawlerStatus === "running" ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Running...</>
          ) : crawlerStatus === "success" ? (
            <><CheckCircle className="h-4 w-4" /> Run Again</>
          ) : crawlerStatus === "error" ? (
            <><XCircle className="h-4 w-4" /> Retry</>
          ) : (
            <><Play className="h-4 w-4" /> Run Crawler Now</>
          )}
        </button>
      </div>

      {/* Main grid: form + table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add/Edit Form */}
        <div className="lg:col-span-1">
          <div className="p-5 border rounded-xl bg-[var(--color-surface)] shadow-sm sticky top-6">
            <h2 className="text-lg font-semibold mb-4 text-[var(--color-text)]">
              {editingId ? "Edit Source" : "Add New Source"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--color-text)]">Provider Name</label>
                <input
                  type="text"
                  required
                  disabled={!!editingId}
                  placeholder="e.g. NewsAPI, Reddit"
                  value={form.provider}
                  onChange={(e) => setForm({ ...form, provider: e.target.value })}
                  className="w-full p-2 border rounded-md bg-[var(--color-bg)] text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)] text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--color-text)]">API Key
                  <span className="text-[var(--color-text-subtle)] font-normal ml-1">(optional)</span>
                </label>
                <input
                  type="password"
                  value={form.apiKey}
                  onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                  className="w-full p-2 border rounded-md bg-[var(--color-bg)] text-[var(--color-text)] text-sm"
                  placeholder="Leave blank if unchanged"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--color-text)]">Config (JSON)
                  <span className="text-[var(--color-text-subtle)] font-normal ml-1">(optional)</span>
                </label>
                <textarea
                  value={form.config}
                  onChange={(e) => setForm({ ...form, config: e.target.value })}
                  className="w-full p-2 border rounded-md bg-[var(--color-bg)] text-[var(--color-text)] font-mono text-xs"
                  rows={5}
                  placeholder={'{"keywords": ["AI", "CRM"]}'}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 font-medium flex justify-center items-center gap-2 text-sm"
                >
                  <Plus className="h-4 w-4" /> {editingId ? "Update" : "Save Source"}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={() => { setEditingId(null); setForm({ provider: "", apiKey: "", config: "" }); }}
                    className="p-2 border rounded-md hover:bg-[var(--color-bg-hover)] text-[var(--color-text)] text-sm"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Sources Table */}
        <div className="lg:col-span-2">
          <div className="border rounded-xl bg-[var(--color-surface)] shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-[var(--color-text-muted)] flex flex-col items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                <span>Loading sources...</span>
              </div>
            ) : sources.length === 0 ? (
              <div className="p-12 text-center text-[var(--color-text-muted)]">
                <Database className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No sources configured yet.</p>
                <p className="text-sm mt-1">Add your first source using the form.</p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-[var(--color-bg-subtle)] border-b text-[var(--color-text-subtle)] text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Provider</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">API Key</th>
                    <th className="px-4 py-3 font-semibold">Config</th>
                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {sources.map((src) => (
                    <tr key={src.id} className="hover:bg-[var(--color-bg-hover)] transition-colors">
                      <td className="px-4 py-3 font-medium text-[var(--color-text)] text-sm">{src.provider}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggle(src.id, src.isActive)}
                          className={`px-2.5 py-1 rounded-full text-xs font-bold transition-colors ${
                            src.isActive
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {src.isActive ? "● Active" : "○ Inactive"}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        {src.apiKey ? (
                          <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                            <Key className="h-3 w-3" /> Set
                          </span>
                        ) : (
                          <span className="text-xs text-[var(--color-text-subtle)]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 max-w-[180px]">
                        <pre className="text-xs text-[var(--color-text-muted)] truncate">
                          {src.config ? JSON.stringify(src.config) : "—"}
                        </pre>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditingId(src.id);
                              setForm({
                                provider: src.provider,
                                apiKey: "",
                                config: src.config ? JSON.stringify(src.config, null, 2) : "",
                              });
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(src.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
