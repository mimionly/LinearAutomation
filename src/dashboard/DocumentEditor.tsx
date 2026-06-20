import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { ArrowLeft, Save, FileEdit, Eye, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function DocumentEditor() {
  const location = useLocation();
  const documentId = location.pathname.split('/')[2];
  const navigate = useNavigate();
  
  const doc = useQuery(api.documents.getDocument, documentId ? { id: documentId as Id<"appDocuments"> } : "skip");
  const updateDoc = useMutation(api.documents.updateDocument);
  const deleteDoc = useMutation(api.documents.deleteDocument);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isEditing, setIsEditing] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (doc && !hasUnsavedChanges && title === "" && content === "") {
      setTitle(doc.title);
      setContent(doc.content);
    }
  }, [doc]);

  const handleSave = async () => {
    if (!documentId) return;
    setIsSaving(true);
    try {
      await updateDoc({
        id: documentId as Id<"appDocuments">,
        title: title || "Untitled Document",
        content,
      });
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!documentId || !doc) return;
    if (window.confirm("Are you sure you want to delete this document?")) {
      await deleteDoc({ id: documentId as Id<"appDocuments"> });
      navigate(`/ventures/${doc.ventureId}`);
    }
  };

  if (doc === undefined) {
    return <div className="p-8 text-zinc-500">Loading document...</div>;
  }
  if (doc === null) {
    return <div className="p-8 text-red-500">Document not found.</div>;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#111112] text-zinc-900 dark:text-white flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/ventures/${doc.ventureId}`)}
            className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Venture
          </button>
          <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-700" />
         
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800/50 rounded-lg p-1 mr-2">
            <button
              onClick={() => setIsEditing(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                isEditing ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              <FileEdit className="h-3.5 w-3.5" />
              Edit
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                !isEditing ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              Preview
            </button>
          </div>
          
         
          
          <button
            onClick={handleSave}
            disabled={isSaving || !hasUnsavedChanges}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              hasUnsavedChanges && !isSaving
                ? "bg-indigo-600 text-white hover:bg-indigo-700"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
            }`}
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Saved"}
          </button>
           <button
            onClick={handleDelete}
            className="p-2 text-zinc-400 rounded-md transition-colors"
            title="Delete document"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto max-w-4xl w-full mx-auto p-8 pt-12">
        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setHasUnsavedChanges(true);
          }}
          placeholder="Document Title"
          className="w-full bg-transparent text-4xl font-bold text-zinc-900 dark:text-white outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-700 mb-8"
        />

        {isEditing ? (
          <textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              setHasUnsavedChanges(true);
            }}
            placeholder="Start typing your markdown content here..."
            className="w-full min-h-[500px] bg-transparent text-[15px] leading-relaxed text-zinc-800 dark:text-zinc-300 outline-none resize-none placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
          />
        ) : (
          <div className="prose prose-zinc dark:prose-invert max-w-none prose-headings:font-semibold prose-a:text-indigo-500">
            {content ? (
              <ReactMarkdown>{content}</ReactMarkdown>
            ) : (
              <p className="text-zinc-400 italic">No content to preview.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
