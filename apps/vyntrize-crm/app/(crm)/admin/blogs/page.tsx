"use client";

import { useEffect, useState } from "react";
import { Trash2, Edit2, RefreshCw, ExternalLink, Loader2, Save, X, CheckSquare } from "lucide-react";
import {
  getArticles,
  deleteArticle,
  deleteArticles,
  updateArticle,
} from "@/lib/actions/article.actions";

export default function BlogsAdminPage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", category: "", score: 0 });

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchArticles = async (pageToFetch: number = currentPage) => {
    setLoading(true);
    const res = await getArticles(pageToFetch, 20);
    if (res.success && res.data) {
      setArticles(res.data);
      if (res.pagination) {
        setTotalPages(res.pagination.totalPages);
        setCurrentPage(res.pagination.page);
      }
      setSelectedIds(new Set());
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this article?")) {
      await deleteArticle(id);
      fetchArticles();
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedIds.size} articles?`)) {
      await deleteArticles(Array.from(selectedIds));
      fetchArticles();
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === articles.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(articles.map(a => a.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const startEdit = (article: any) => {
    setEditingId(article.id);
    setEditForm({
      title: article.title,
      category: article.category || "",
      score: article.score || 0,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    await updateArticle(editingId, {
      title: editForm.title,
      category: editForm.category,
      score: Number(editForm.score),
    });
    setEditingId(null);
    fetchArticles();
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      fetchArticles(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      fetchArticles(currentPage - 1);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Blog Management</h1>
          <p className="text-[var(--color-text-muted)] mt-1">
            Manage recommended articles fetched by the content crawler
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selectedIds.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="p-2 border border-red-500/20 bg-red-500/10 text-red-500 rounded-md hover:bg-red-500/20 transition-colors flex items-center gap-2"
              title="Delete Selected"
            >
              <Trash2 className="h-4 w-4" />
              <span className="text-sm font-medium">Delete ({selectedIds.size})</span>
            </button>
          )}
          <button
            onClick={() => fetchArticles()}
            className="p-2 border rounded-md hover:bg-[var(--color-bg-hover)] text-[var(--color-text)] transition-colors flex items-center gap-2"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="text-sm font-medium">Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-[var(--color-text-muted)]">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p>Loading articles...</p>
          </div>
        ) : articles.length === 0 ? (
          <div className="p-12 text-center text-[var(--color-text-muted)]">
            <p>No articles found. Try running the crawler from the Sources page.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] uppercase text-xs">
                <tr>
                  <th className="px-6 py-4 font-semibold w-12 text-center">
                    <input 
                      type="checkbox" 
                      className="rounded border-[var(--color-border)] bg-[var(--color-bg)] cursor-pointer"
                      checked={articles.length > 0 && selectedIds.size === articles.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-4 font-semibold">Article</th>
                  <th className="px-6 py-4 font-semibold">Source</th>
                  <th className="px-6 py-4 font-semibold">Category</th>
                  <th className="px-6 py-4 font-semibold">Score</th>
                  <th className="px-6 py-4 font-semibold">Published</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {articles.map((article) => {
                  const isEditing = editingId === article.id;
                  const isSelected = selectedIds.has(article.id);

                  return (
                    <tr key={article.id} className={`hover:bg-[var(--color-bg-hover)]/50 transition-colors ${isSelected ? 'bg-[var(--color-bg-hover)]' : ''}`}>
                      <td className="px-6 py-4 text-center">
                        <input 
                          type="checkbox" 
                          className="rounded border-[var(--color-border)] bg-[var(--color-bg)] cursor-pointer"
                          checked={isSelected}
                          onChange={() => toggleSelect(article.id)}
                        />
                      </td>
                      <td className="px-6 py-4 max-w-md">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.title}
                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                            className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded px-2 py-1 text-[var(--color-text)]"
                          />
                        ) : (
                          <div className="font-medium text-[var(--color-text)] line-clamp-2" title={article.title}>
                            {article.title}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-full text-xs font-medium text-[var(--color-text-muted)]">
                          {article.source}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.category}
                            onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                            className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded px-2 py-1 text-[var(--color-text)]"
                          />
                        ) : (
                          <span className="text-[var(--color-text-muted)]">{article.category || "Uncategorized"}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editForm.score}
                            onChange={(e) => setEditForm({ ...editForm, score: Number(e.target.value) })}
                            className="w-20 bg-[var(--color-bg)] border border-[var(--color-border)] rounded px-2 py-1 text-[var(--color-text)]"
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-[var(--color-text)]">{Math.round(article.score || 0)}</span>
                            <div className="w-16 h-1.5 bg-[var(--color-bg)] rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500" 
                                style={{ width: `${Math.min(100, Math.max(0, article.score || 0))}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-[var(--color-text-muted)]">
                        {new Date(article.publishedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isEditing ? (
                            <>
                              <button onClick={saveEdit} className="p-1.5 text-green-500 hover:bg-green-500/10 rounded transition-colors" title="Save">
                                <Save className="h-4 w-4" />
                              </button>
                              <button onClick={cancelEdit} className="p-1.5 text-gray-500 hover:bg-gray-500/10 rounded transition-colors" title="Cancel">
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <a 
                                href={article.url} 
                                target="_blank" 
                                rel="noreferrer"
                                className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded transition-colors"
                                title="View Original"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                              <button 
                                onClick={() => startEdit(article)}
                                className="p-1.5 text-orange-500 hover:bg-orange-500/10 rounded transition-colors"
                                title="Edit"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => handleDelete(article.id)}
                                className="p-1.5 text-red-500 hover:bg-red-500/10 rounded transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4">
          <div className="text-sm text-[var(--color-text-muted)]">
            Showing Page <span className="font-medium text-[var(--color-text)]">{currentPage}</span> of <span className="font-medium text-[var(--color-text)]">{totalPages}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] hover:bg-[var(--color-bg-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] hover:bg-[var(--color-bg-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
