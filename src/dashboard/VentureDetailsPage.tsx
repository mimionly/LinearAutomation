import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';

import {
  Kayak,
  ChevronDown,
  User,
  Check,
  Calendar as CalendarIcon,
  CircleDashed,
  Play,
  CheckCircle2,
  Trash2,
  PlusCircle,
  Paperclip,
  ExternalLink,
  ArrowLeft,
} from 'lucide-react';
import { useUser, useOrganization } from "@clerk/clerk-react";

import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────
interface Member {
  _id: string;
  name: string;
  email?: string;
  status?: string;
  avatarUrl?: string;
}

// ─── MemberAvatar ─────────────────────────────────────────────────
const MemberAvatar = ({ src, alt, size = 20 }: { src?: string; alt: string; size?: number }) => (
  <Avatar style={{ width: size, height: size }}>
    {src ? <AvatarImage src={src} alt={alt} className="object-cover" /> : null}
    <AvatarFallback className="text-[10px] bg-zinc-100 text-zinc-500 dark:bg-gray-800 dark:text-gray-400">
      {alt.slice(0, 2).toUpperCase()}
    </AvatarFallback>
  </Avatar>
);

// ─── StatusBadge ──────────────────────────────────────────────────
const statusConfig = {
  planned:   { label: 'Planned',   icon: <CircleDashed className="h-3.5 w-3.5 text-gray-500" />,                          color: 'text-gray-400' },
  active:    { label: 'Active',    icon: <Play className="h-3.5 w-3.5 text-emerald-500 fill-emerald-500/20" />,            color: 'text-emerald-400' },
  completed: { label: 'Completed', icon: <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400" />,                        color: 'text-indigo-400' },
};

// ─── OwnerDropdown ────────────────────────────────────────────────
const OwnerDropdown = ({
  owner,
  members,
  onSelect,
  disabled,
  className = '',
}: {
  owner: Member | null;
  members: Member[];
  onSelect: (member: Member | null) => void;
  disabled: boolean;
  className?: string;
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = useMemo(
    () => (members ?? []).filter((m) => m.name.toLowerCase().includes(query.toLowerCase())),
    [members, query]
  );

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => { setOpen((o) => !o); setQuery(''); }}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors min-w-[100px] justify-between
          ${disabled ? 'cursor-default' : 'hover:bg-zinc-100/40 dark:hover:bg-zinc-800/40'} ${className}`}
      >
        {owner ? (
          <span className="flex items-center gap-1.5 truncate">
            <MemberAvatar src={owner.avatarUrl} alt={owner.name} size={16} />
            <span className="truncate text-zinc-800 dark:text-zinc-200">{owner.name}</span>
          </span>
        ) : (
          <span className="text-zinc-400 dark:text-zinc-500">No owner</span>
        )}
        {!disabled && <ChevronDown className="h-3 w-3 text-gray-600 ml-1.5" />}
      </button>

      {open && !disabled && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-60 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#151516] shadow-xl p-1">
          <div className="px-2.5 py-1.5 border-b border-zinc-200 dark:border-zinc-800/40">
            <input
              autoFocus
              type="text"
              placeholder="Set owner..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-xs text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 outline-none border-none"
            />
          </div>
          <ul className="max-h-52 overflow-y-auto mt-1 no-scrollbar">
            {(!query || 'no owner'.includes(query.toLowerCase())) && (
              <li
                onClick={() => { onSelect(null); setOpen(false); }}
                className={`flex cursor-pointer items-center gap-2.5 px-2 py-1.5 text-xs transition-colors rounded-md mx-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 ${
                  !owner ? 'text-zinc-900 bg-zinc-100 dark:text-white dark:bg-zinc-800/30 font-medium' : 'text-zinc-500 dark:text-zinc-400'
                }`}
              >
                <div className="h-5 w-5 rounded-full bg-zinc-200 dark:bg-zinc-800/50 flex items-center justify-center text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/20 shrink-0">
                  <User className="h-3 w-3" />
                </div>
                <span className="flex-1">No owner</span>
              </li>
            )}
            {filtered.map((m) => {
              const isSelected = owner?._id === m._id;
              return (
                <li
                  key={m._id}
                  onClick={() => { onSelect(m); setOpen(false); }}
                  className={`flex cursor-pointer items-center gap-2.5 px-2 py-1.5 text-xs transition-colors rounded-md mx-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 ${
                    isSelected ? 'text-zinc-900 bg-zinc-100 dark:text-white dark:bg-zinc-800/30 font-medium' : 'text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <MemberAvatar src={m.avatarUrl} alt={m.name} size={20} />
                  <span className="flex-1 truncate">{m.name}</span>
                  {isSelected && <Check className="h-3 w-3 text-zinc-800 dark:text-zinc-300 flex-shrink-0" />}
                </li>
              );
            })}
            {filtered.length === 0 && (!query || !'no owner'.includes(query.toLowerCase())) && (
              <li className="px-2.5 py-2 text-xs text-zinc-500 italic">No members found</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

// ─── StatusDropdown ───────────────────────────────────────────────
const StatusDropdown = ({
  status,
  onSelect,
  disabled,
  className = '',
}: {
  status: 'active' | 'planned' | 'completed';
  onSelect: (status: 'active' | 'planned' | 'completed') => void;
  disabled: boolean;
  className?: string;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = statusConfig[status] || statusConfig.planned;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors min-w-[100px] justify-between
          ${disabled ? 'cursor-default' : 'hover:bg-zinc-100/40 dark:hover:bg-zinc-800/40'} ${className}`}
      >
        <span className="flex items-center gap-1.5">
          {current.icon}
          <span className="text-zinc-800 dark:text-zinc-200">{current.label}</span>
        </span>
        {!disabled && <ChevronDown className="h-3 w-3 text-gray-600 ml-1.5" />}
      </button>

      {open && !disabled && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-36 overflow-hidden rounded-xl border border-zinc-200 dark:border-gray-700/60 bg-white dark:bg-gray-900 shadow-xl py-1">
          {(['planned', 'active', 'completed'] as const).map((s) => {
            const isSelected = status === s;
            const item = statusConfig[s];
            return (
              <button
                key={s}
                type="button"
                onClick={() => { onSelect(s); setOpen(false); }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-zinc-100 dark:hover:bg-gray-800/60
                  ${isSelected ? 'bg-zinc-100 text-zinc-900 dark:bg-gray-800/40 dark:text-gray-200 font-medium' : 'text-zinc-500 dark:text-gray-400'}`}
              >
                {item.icon}
                <span className="flex-1">{item.label}</span>
                {isSelected && <Check className="h-3 w-3 text-indigo-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── DatePickerDropdown ───────────────────────────────────────────
const DatePickerDropdown = ({
  selectedDateStr,
  onSelectDate,
  disabled,
}: {
  selectedDateStr: string | undefined;
  onSelectDate: (dateStr: string) => void;
  disabled: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const parsedDate = useMemo(() => {
    if (!selectedDateStr) return undefined;
    if (selectedDateStr.includes('-')) {
      const parts = selectedDateStr.split('-');
      if (parts.length === 3) {
        const [y, m, d] = parts.map(Number);
        const date = new Date(y, m - 1, d);
        if (!isNaN(date.getTime())) return date;
      }
    }
    const fallbackDate = new Date(selectedDateStr);
    return isNaN(fallbackDate.getTime()) ? undefined : fallbackDate;
  }, [selectedDateStr]);

  const handleSelect = (date: Date | undefined) => {
    if (!date) {
      onSelectDate('');
    } else {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      onSelectDate(`${year}-${month}-${day}`);
    }
    setOpen(false);
  };

  const formattedDate = useMemo(() => {
    if (!selectedDateStr) return 'No date';
    let date: Date | undefined;
    if (selectedDateStr.includes('-')) {
      const parts = selectedDateStr.split('-');
      if (parts.length === 3) {
        const [y, m, d] = parts.map(Number);
        date = new Date(Date.UTC(y, m - 1, d));
      }
    }
    if (!date || isNaN(date.getTime())) {
      date = new Date(selectedDateStr);
    }
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    });
  }, [selectedDateStr]);

  return (
    <div ref={ref} className="relative">
      <button
        disabled={disabled}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors min-w-[100px] justify-between border border-zinc-200 dark:border-zinc-800
          ${disabled ? 'cursor-default' : 'hover:bg-zinc-100/40 dark:hover:bg-zinc-800/40'}
          ${selectedDateStr ? 'text-zinc-800 dark:text-zinc-200' : 'text-zinc-400 dark:text-zinc-500'}`}
      >
        <span className="flex items-center gap-1.5">
          <CalendarIcon className="h-3.5 w-3.5 text-gray-500" />
          <span>{formattedDate}</span>
        </span>
        {!disabled && <ChevronDown className="h-3 w-3 text-gray-600 ml-1.5" />}
      </button>

      {open && !disabled && (
        <div className="absolute right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-zinc-200 dark:border-gray-750 bg-white dark:bg-gray-950 shadow-xl p-1">
          <Calendar
            mode="single"
            selected={parsedDate}
            onSelect={handleSelect}
            disabled={{ before: today }}
          />
          {selectedDateStr && (
            <div className="border-t border-zinc-200 dark:border-gray-800/60 p-1">
              <button
                type="button"
                onClick={() => handleSelect(undefined)}
                className="w-full rounded-md py-1 text-center text-[10px] font-medium text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-gray-850 transition-colors"
              >
                Clear date
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Project status icon helper ───────────────────────────────────
const getProjectStatusIcon = (state?: string, className?: string) => {
  switch (state?.toLowerCase()) {
    case 'started':
    case 'in-progress':
    case 'in progress':
      return <Play className={cn('text-blue-500 shrink-0', className)} />;
    case 'completed':
      return <CheckCircle2 className={cn('text-emerald-500 shrink-0', className)} />;
    default:
      return <CircleDashed className={cn('text-zinc-400 dark:text-zinc-500 shrink-0', className)} />;
  }
};

// ═══════════════════════════════════════════════════════════════════
// ─── Main VentureDetailsPage ──────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════
export default function VentureDetailsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Extract venture ID from path: /ventures/:ventureId
  const ventureId = location.pathname.split('/')[2] || '';

  // Data and Auth
  const { user } = useUser();
  const { membership } = useOrganization();
  const dbVentures = useQuery(api.ventures.listVentures);
  const members = useQuery(api.members.listMembers) as Member[] | undefined;
  const currentUser = useQuery(api.members.getCurrentUser);
  const dbProjects = useQuery(api.linear.fetchProjects);

  const isClerkAdmin = 
    user?.publicMetadata?.role === 'admin' || 
    user?.publicMetadata?.role === 'Admin' ||
    membership?.role === 'admin' || 
    membership?.role === 'org:admin' ||
    user?.organizationMemberships?.some(m => m.role === 'admin' || m.role === 'org:admin');
  const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'admin' || isClerkAdmin;

  // Find current venture
  const venture = useMemo(() => {
    if (!dbVentures) return undefined;
    return dbVentures.find((v) => v._id === ventureId);
  }, [dbVentures, ventureId]);

  // Mutations
  const updateOwner = useMutation(api.ventures.updateOwner);
  const updateStatus = useMutation(api.ventures.updateStatus);
  const updateTargetDeadline = useMutation(api.ventures.updateTargetDeadline);
  const updateVentureFields = useMutation(api.ventures.updateVentureFields);
  const updateDocuments = useMutation(api.ventures.updateDocuments);

  const addStorageDocument = useMutation(api.ventures.addStorageDocument);
  const generateUploadUrl = useMutation(api.ventures.generateUploadUrl);

  // Editable field states
  const [name, setName] = useState('');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);

  // Document states
  const [isAddingDoc, setIsAddingDoc] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docUrl, setDocUrl] = useState('');
  const [docError, setDocError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);


  // Sync local state with DB
  useEffect(() => {
    if (venture) {
      setName(venture.name || '');
      setSummary(venture.summary || '');
      setDescription(venture.description || '');
      setIsEditingDesc(false);
      setIsAddingDoc(false);
      setDocTitle('');
      setDocUrl('');
      setDocError('');
    }
  }, [venture]);

  // Associated projects
  const ventureProjects = useMemo(() => {
    if (!dbProjects || !ventureId) return [];
    return dbProjects.filter((p) => p.ventureId === ventureId);
  }, [dbProjects, ventureId]);

  // Project stats
  const projectStats = useMemo(() => {
    const stats = { planned: 0, inProgress: 0, completed: 0, total: 0 };
    stats.total = ventureProjects.length;
    ventureProjects.forEach((p) => {
      const state = p.state?.toLowerCase() || '';
      if (state === 'completed') stats.completed++;
      else if (state === 'started' || state === 'in-progress' || state === 'in progress') stats.inProgress++;
      else stats.planned++;
    });
    return stats;
  }, [ventureProjects]);

  // Owner
  const owner = useMemo(() => {
    if (!venture || !members) return null;
    return members.find((m) => m._id === venture.ownerId) ?? null;
  }, [venture, members]);

  // ─── Save handlers ──────────────────────────────────────────────
  const handleNameBlur = useCallback(async () => {
    if (venture && name.trim() && name !== venture.name) {
      await updateVentureFields({ ventureId: venture._id, name: name.trim(), clerkAdminBypass: isClerkAdmin });
    }
  }, [venture, name, updateVentureFields, isClerkAdmin]);

  const handleSummaryBlur = useCallback(async () => {
    if (venture && summary.trim() !== (venture.summary || '')) {
      await updateVentureFields({ ventureId: venture._id, summary: summary.trim() || null, clerkAdminBypass: isClerkAdmin });
    }
  }, [venture, summary, updateVentureFields, isClerkAdmin]);

  const handleDescriptionBlur = useCallback(async () => {
    setIsEditingDesc(false);
    if (venture && description !== (venture.description || '')) {
      await updateVentureFields({ ventureId: venture._id, description: description.trim() || null, clerkAdminBypass: isClerkAdmin });
    }
  }, [venture, description, updateVentureFields, isClerkAdmin]);

  const handleOwnerSelect = useCallback(async (member: Member | null) => {
    if (!venture) return;
    await updateOwner({ ventureId: venture._id, ownerId: member?._id as Id<'members'> ?? null, clerkAdminBypass: isClerkAdmin });
  }, [venture, updateOwner, isClerkAdmin]);

  const handleStatusSelect = useCallback(async (status: 'active' | 'planned' | 'completed') => {
    if (!venture) return;
    await updateStatus({ ventureId: venture._id, status, clerkAdminBypass: isClerkAdmin });
  }, [venture, updateStatus, isClerkAdmin]);

  const handleTargetDateSelect = useCallback(async (dateStr: string) => {
    if (!venture) return;
    await updateTargetDeadline({ ventureId: venture._id, targetDeadline: dateStr || undefined, clerkAdminBypass: isClerkAdmin });
  }, [venture, updateTargetDeadline, isClerkAdmin]);

  // ─── Document handlers ──────────────────────────────────────────
  const handleAddDocument = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!venture) return;
    if (!docTitle.trim() || !docUrl.trim()) {
      setDocError('Both title and URL are required.');
      return;
    }
    let formattedUrl = docUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = 'https://' + formattedUrl;
    }
    const currentDocs = venture.documents || [];
    const updatedDocs = [...currentDocs, { title: docTitle.trim(), url: formattedUrl }];
    try {
      await updateDocuments({ ventureId: venture._id, documents: updatedDocs, clerkAdminBypass: isClerkAdmin });
      setDocTitle('');
      setDocUrl('');
      setIsAddingDoc(false);
      setDocError('');
    } catch (err: any) {
      setDocError(err?.message || 'Failed to add resource.');
    }
  }, [venture, docTitle, docUrl, updateDocuments, isClerkAdmin]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !venture) return;
    const file = files[0];
    setIsUploading(true);
    try {
      const uploadUrl = await generateUploadUrl({ clerkAdminBypass: isClerkAdmin });
      const result = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
      });
      if (!result.ok) throw new Error('Upload request failed.');
      const { storageId } = await result.json();
      await addStorageDocument({ ventureId: venture._id, title: file.name, storageId, clerkAdminBypass: isClerkAdmin });
    } catch (err: any) {
      alert(err?.message || 'Failed to upload file.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [venture, generateUploadUrl, addStorageDocument, isClerkAdmin]);

  const handleDeleteDocument = useCallback(async (indexToDelete: number) => {
    if (!venture) return;
    const currentDocs = venture.documents || [];
    const updatedDocs = currentDocs.filter((_, idx) => idx !== indexToDelete);
    await updateDocuments({ ventureId: venture._id, documents: updatedDocs, clerkAdminBypass: isClerkAdmin });
  }, [venture, updateDocuments, isClerkAdmin]);

  // ─── Loading state ──────────────────────────────────────────────
  if (dbVentures === undefined || members === undefined) {
    return (
      <div className="flex h-[80vh] items-center justify-center text-sm text-muted-foreground">
        Loading venture details...
      </div>
    );
  }

  // ─── Not found ──────────────────────────────────────────────────
  if (!venture) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center border rounded-xl bg-card mt-12">
        <h2 className="text-xl font-bold mb-2">Venture not found</h2>
        <p className="text-sm text-muted-foreground mb-6">
          The venture with ID &quot;{ventureId}&quot; does not exist.
        </p>
        <Button onClick={() => navigate('/ventures')} className="bg-indigo-600 text-white hover:bg-indigo-500">
          Back to Ventures
        </Button>
      </div>
    );
  }



  // ─── Render ─────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full px-5 py-4 max-w-[1400px] mx-auto text-zinc-800 dark:text-zinc-100">

      {/* ─── Breadcrumbs ─── */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3 mb-6">
        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <button
            onClick={() => navigate('/ventures')}
            className="hover:text-zinc-200 dark:hover:text-zinc-350 transition-colors font-medium"
          >
            Ventures
          </button>
          <span>&gt;</span>
          <span className="font-semibold text-zinc-200 dark:text-zinc-100 truncate max-w-[240px]">
            {venture.name}
          </span>
        </div>
        <button
          onClick={() => navigate('/ventures')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-400 hover:bg-zinc-100/40 dark:hover:bg-zinc-800/40 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Ventures list</span>
        </button>
      </div>

      {/* ─── Main Content ─── */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="flex flex-col gap-6 max-w-4xl">

          {/* Title Block */}
          <div className="flex items-start gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
            <div className="size-11 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-indigo-500/10 flex items-center justify-center shrink-0">
              <Kayak className="h-5 w-5 text-indigo-400" />
            </div>
            <div className="flex-1 flex flex-col gap-1 min-w-0">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={handleNameBlur}
                disabled={!isAdmin}
                placeholder="Venture name"
                className="w-full bg-transparent text-xl md:text-2xl font-bold text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 border-none outline-none focus:ring-0 p-0"
              />
              <input
                type="text"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                onBlur={handleSummaryBlur}
                disabled={!isAdmin}
                placeholder="Add a short summary..."
                className="w-full bg-transparent text-xs text-zinc-500 dark:text-zinc-400 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 border-none outline-none focus:ring-0 p-0 mt-0.5"
              />
            </div>
          </div>

          {/* Properties Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-zinc-50/40 dark:bg-zinc-950/20 p-4 rounded-xl border border-zinc-200/60 dark:border-zinc-800/50 shadow-sm">
            <div className="flex flex-col gap-1.5 text-xs">
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Status</span>
              <StatusDropdown
                status={venture.status}
                disabled={!isAdmin}
                onSelect={handleStatusSelect}
                className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-300 justify-between w-full shadow-sm rounded-lg"
              />
            </div>
            <div className="flex flex-col gap-1.5 text-xs">
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Owner</span>
              <OwnerDropdown
                owner={owner}
                members={members ?? []}
                disabled={!isAdmin}
                onSelect={handleOwnerSelect}
                className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-300 justify-between w-full font-medium shadow-sm rounded-lg"
              />
            </div>
            <div className="flex flex-col gap-1.5 text-xs">
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Target Date</span>
              <DatePickerDropdown
                selectedDateStr={venture.targetDeadline}
                disabled={!isAdmin}
                onSelectDate={handleTargetDateSelect}
              />
            </div>
          </div>

          {/* Description Section */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              Description
            </span>
            {isEditingDesc ? (
              <textarea
                autoFocus
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleDescriptionBlur}
                placeholder="Describe this venture in detail..."
                className="w-full min-h-[160px] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent p-3.5 text-sm text-zinc-800 dark:text-zinc-200 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 leading-relaxed"
              />
            ) : (
              <div
                onClick={() => isAdmin && setIsEditingDesc(true)}
                className={`min-h-[140px] rounded-xl border border-zinc-200 dark:border-zinc-800/85 bg-zinc-50/10 dark:bg-zinc-900/5 p-4 text-sm cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/10 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 leading-relaxed whitespace-pre-wrap ${!description && 'text-zinc-400 italic'}`}
              >
                {description || 'No description provided. Click to add one.'}
              </div>
            )}
          </div>

          {/* Resources Section */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800/40 pb-2">
              <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                Resources & Links
              </span>
              {isAdmin && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => setIsAddingDoc(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-zinc-200 dark:border-zinc-800 text-[10px] font-semibold text-zinc-650 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-200 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all duration-200 cursor-pointer"
                  >
                    <PlusCircle className="h-3 w-3 text-indigo-500" />
                    Add Link
                  </button>
                  <button
                    type="button"
                    disabled={isUploading || isAddingDoc}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-zinc-200 dark:border-zinc-800 text-[10px] font-semibold text-zinc-650 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-200 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all duration-200 cursor-pointer disabled:opacity-40"
                  >
                    <Paperclip className="h-3 w-3 text-emerald-500" />
                    {isUploading ? 'Uploading...' : 'Upload File'}
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                </div>
              )}
            </div>

            {isAddingDoc && (
              <form onSubmit={handleAddDocument} className="border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/30 dark:bg-[#1a1a1c]/30 rounded-xl p-3.5 flex flex-col gap-3 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Link Title (e.g. Design Spec)"
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                  <input
                    type="text"
                    placeholder="URL (e.g. figma.com/...)"
                    value={docUrl}
                    onChange={(e) => setDocUrl(e.target.value)}
                    className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>
                {docError && <p className="text-xs text-red-500">{docError}</p>}
                <div className="flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => { setIsAddingDoc(false); setDocTitle(''); setDocUrl(''); setDocError(''); }}
                    className="text-xs text-zinc-200 hover:text-zinc-300 dark:text-gray-500 dark:hover:text-gray-300 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-3 py-1 rounded text-xs transition-colors"
                  >
                    Add
                  </button>
                </div>
              </form>
            )}

            {venture.documents && venture.documents.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {venture.documents.map((doc, idx) => (
                  <div
                    key={idx}
                    className="group flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/10 px-3 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all duration-200 shadow-sm"
                  >
                    <ExternalLink className="h-3 w-3 text-zinc-400 shrink-0" />
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold hover:underline hover:text-indigo-600 dark:hover:text-indigo-400 truncate max-w-[200px]"
                    >
                      {doc.title}
                    </a>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleDeleteDocument(idx)}
                        className="text-zinc-400 hover:text-red-500 rounded shrink-0 p-0.5 ml-1 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-zinc-400 dark:text-zinc-600 italic">No resources added yet.</div>
            )}
          </div>

          {/* Associated Projects Section */}
          <div className="flex flex-col gap-3 pt-2 pb-6">
            <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              Associated Projects
            </span>

            {ventureProjects.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center bg-zinc-50/40 dark:bg-zinc-950/20 rounded-xl p-3.5 border border-zinc-200/60 dark:border-zinc-800/50 shadow-sm text-xs">
                <div className="flex flex-col">
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-wider">Planned</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200 mt-0.5 text-sm">{projectStats.planned}</span>
                </div>
                <div className="flex flex-col border-l border-zinc-200/60 dark:border-zinc-800/40">
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-wider">In Progress</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200 mt-0.5 text-sm">{projectStats.inProgress}</span>
                </div>
                <div className="flex flex-col border-l border-zinc-200/60 dark:border-zinc-800/40">
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-wider">Completed</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200 mt-0.5 text-sm">{projectStats.completed}</span>
                </div>
                <div className="flex flex-col border-l border-zinc-200/60 dark:border-zinc-800/40">
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-wider">Total</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 mt-0.5 text-sm">{projectStats.total}</span>
                </div>
              </div>
            )}

            {ventureProjects.length > 0 ? (
              <div className="flex flex-col gap-2">
                {ventureProjects.map((proj) => (
                  <div
                    key={proj._id}
                    onClick={() => navigate(`/projects/${proj.id}`)}
                    className="flex items-center justify-between rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/10 p-3.5 shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-900/20 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {getProjectStatusIcon(proj.state, 'h-4 w-4')}
                      <span className="text-base shrink-0">{proj.iconEmoji || '📁'}</span>
                      <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {proj.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[10px] capitalize text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded border border-zinc-200/50 dark:border-zinc-800/30 font-medium">
                        {proj.state || 'planned'}
                      </span>
                      <ExternalLink className="h-3.5 w-3.5 text-zinc-400 group-hover:text-indigo-500 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-zinc-400 dark:text-zinc-600 italic">No associated projects.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
