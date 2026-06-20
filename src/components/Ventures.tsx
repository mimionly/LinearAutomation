import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  CheckCircle2,
  Kayak,
  ChevronDown,
  User,
  Check,
  Calendar as CalendarIcon,
  CircleDashed,
  Play,
} from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { useUser, useOrganization } from "@clerk/clerk-react";

// ─── shadcn/ui components ─────────────────────────────────────────
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Calendar } from '@/components/ui/calendar';


// ─── Types ─────────────────────────────────────────────────────────
interface Member {
  _id: string;
  name: string;
  email?: string;
  status?: string;
  avatarUrl?: string;
  teams?: { name: string; iconEmoji: string }[];
}

// ─── shadcn Avatar wrapper ─────────────────────────────────────────
const MemberAvatar = ({ src, alt, size = 20 }: { src?: string; alt: string; size?: number }) => (
  <Avatar style={{ width: size, height: size }}>
    {src ? (
      <AvatarImage src={src} alt={alt} className="object-cover" />
    ) : null}
    <AvatarFallback className="text-[10px] bg-zinc-100 text-zinc-500 dark:bg-gray-800 dark:text-gray-400">
      {alt.slice(0, 2).toUpperCase()}
    </AvatarFallback>
  </Avatar>
);

// ─── TabButton (shadcn Button) ─────────────────────────────────────
const TabButton = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <Button
    variant="outline"
    size="sm"
    onClick={onClick}
    className={`
      rounded-full px-3 py-1 text-sm font-medium transition-colors
      ${
        active
          ? 'border-zinc-400 text-zinc-900 dark:border-gray-400 dark:text-gray-200 bg-transparent hover:bg-zinc-100 dark:hover:bg-gray-800/40'
          : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:text-gray-500 dark:hover:text-gray-300 hover:border-zinc-200 dark:hover:border-gray-700 hover:bg-transparent'
      }
    `}
  >
    {label}
  </Button>
);

// ─── OwnerDropdown component ───────────────────────────────────────
const OwnerDropdown = ({
  owner,
  members,
  onSelect,
  disabled,
  placeholder = "No owner",
  className = ""
}: {
  owner: Member | null;
  members: Member[];
  onSelect: (member: Member | null) => void;
  disabled: boolean;
  placeholder?: string;
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

  const filtered = useMemo(() =>
    (members ?? []).filter((m) =>
      m.name.toLowerCase().includes(query.toLowerCase())
    ),
    [members, query]
  );

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => { setOpen((o) => !o); setQuery(''); }}
        className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors
          ${disabled ? 'cursor-default' : 'hover:bg-zinc-100 dark:hover:bg-gray-800/60'} ${className}`}
      >
        {owner ? (
          <>
            <MemberAvatar src={owner.avatarUrl} alt={owner.name} size={18} />
            <span className="text-zinc-800 dark:text-gray-300">{owner.name}</span>
          </>
        ) : (
          <span className="text-gray-500">{placeholder}</span>
        )}
        {!disabled && <ChevronDown className="h-3 w-3 text-gray-600" />}
      </button>

      {open && !disabled && (
        <div className="absolute right-0 sm:right-auto sm:left-0 top-full z-50 mt-1.5 w-60 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#151516] shadow-xl p-1">
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
                <span className="text-[10px] text-zinc-500 bg-zinc-100 dark:bg-zinc-800/50 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700/30 font-mono shrink-0">
                  0
                </span>
              </li>
            )}

            {filtered.map((m) => {
              const isSelected = owner?._id === m._id;
              const isInvited = m.status === 'invited' || m.status === 'pending' || m.email?.includes('invited');
              return (
                <li
                  key={m._id}
                  onClick={() => { onSelect(m); setOpen(false); }}
                  className={`flex cursor-pointer items-center gap-2.5 px-2 py-1.5 text-xs transition-colors rounded-md mx-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 ${
                    isSelected ? 'text-zinc-900 bg-zinc-100 dark:text-white dark:bg-zinc-800/30 font-medium' : 'text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <MemberAvatar src={m.avatarUrl} alt={m.name} size={20} />
                  <div className="flex-1 min-w-0 flex items-center gap-1.5">
                    <span className="truncate">{m.name}</span>
                    {isInvited && (
                      <span className="text-[9px] text-zinc-500 bg-zinc-100 dark:bg-zinc-800/40 px-1 py-0.5 rounded border border-zinc-200 dark:border-zinc-700/10 shrink-0">
                        Invited
                      </span>
                    )}
                  </div>
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

// ─── DateSelectorDropdown component ───────────────────────────────────
const DateSelectorDropdown = ({
  selectedDateStr,
  onSelectDate,
  disabled
}: {
  selectedDateStr: string;
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
    const [year, month, day] = selectedDateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
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

  return (
    <div ref={ref} className="relative">
      <button
        disabled={disabled}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-md border border-zinc-200 dark:border-gray-800 bg-zinc-50/50 dark:bg-gray-900/40 hover:bg-zinc-100 dark:hover:bg-gray-850 px-2.5 py-1 text-xs text-zinc-700 dark:text-gray-400 transition-colors"
      >
        <CalendarIcon className="h-3.5 w-3.5 text-gray-500" />
        <span>
          {selectedDateStr ? (
            new Date(selectedDateStr).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              timeZone: 'UTC'
            })
          ) : (
            'Target date'
          )}
        </span>
      </button>

      {open && !disabled && (
        <div className="absolute right-0 sm:right-auto sm:left-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-zinc-200 dark:border-gray-750 bg-white dark:bg-gray-950 shadow-xl p-1">
          <Calendar
            mode="single"
            selected={parsedDate}
            onSelect={handleSelect}
            disabled={{ before: today }}
          />
        </div>
      )}
    </div>
  );
};

// ─── VentureDateDropdown component ───────────────────────────────────
const VentureDateDropdown = ({
  selectedDateStr,
  onSelectDate,
  disabled,
  className = ""
}: {
  selectedDateStr: string | undefined;
  onSelectDate: (dateStr: string) => void;
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
    const spaceParts = selectedDateStr.split(' ');
    if (spaceParts.length === 2) {
      const yymm = spaceParts[0];
      const d = Number(spaceParts[1]);
      if (yymm.length === 6) {
        const y = Number(yymm.slice(0, 4));
        const m = Number(yymm.slice(4, 6));
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
    if (!selectedDateStr) return '--';
    let date: Date | undefined;
    if (selectedDateStr.includes('-')) {
      const parts = selectedDateStr.split('-');
      if (parts.length === 3) {
        const [y, m, d] = parts.map(Number);
        date = new Date(Date.UTC(y, m - 1, d));
      }
    } else {
      const spaceParts = selectedDateStr.split(' ');
      if (spaceParts.length === 2) {
        const yymm = spaceParts[0];
        const d = Number(spaceParts[1]);
        if (yymm.length === 6) {
          const y = Number(yymm.slice(0, 4));
          const m = Number(yymm.slice(4, 6));
          date = new Date(Date.UTC(y, m - 1, d));
        }
      }
    }
    if (!date || isNaN(date.getTime())) {
      date = new Date(selectedDateStr);
    }
    if (isNaN(date.getTime())) return '--';
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC'
    });
  }, [selectedDateStr]);

  return (
    <div ref={ref} className="relative inline-block text-right w-full">
      <button
        disabled={disabled}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center justify-end gap-1.5 rounded-md px-2 py-1 text-xs transition-colors w-full
          ${disabled ? 'cursor-default' : 'hover:bg-zinc-100 dark:hover:bg-gray-800/60'}
          ${selectedDateStr ? 'text-zinc-800 dark:text-gray-300' : 'text-zinc-500 dark:text-gray-600 font-medium'} ${className}`}
      >
        <CalendarIcon
          className={`h-3.5 w-3.5 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
            open ? 'opacity-100' : ''
          }`}
        />
        <span>{formattedDate}</span>
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
                className="w-full rounded-md py-1 text-center text-[10px] font-medium text-zinc-500 hover:text-zinc-900  dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-gray-850 transition-colors"
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

// ─── StatusDropdown component ───────────────────────────────────────
const StatusDropdown = ({
  status,
  onSelect,
  disabled,
  className = ""
}: {
  status:  "planned"|"active" | "completed";
  onSelect: (status: "planned"| "active"  | "completed") => void;
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

  const config = {
    planned: { label: "Planned", icon: <CircleDashed className="h-3.5 w-3.5 text-gray-500" />, color: "text-gray-400" },
    active: { label: "Active", icon: <Play className="h-3.5 w-3.5 text-emerald-500 fill-emerald-500/20" />, color: "text-emerald-400" },
    completed: { label: "Completed", icon: <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400" />, color: "text-indigo-400" },
  };

  const current = config[status] || config.planned;

  const handleSelectStatus = (newStatus: "active" | "planned" | "completed") => {
    onSelect(newStatus);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors
          ${disabled ? 'cursor-default' : 'hover:bg-zinc-100 dark:hover:bg-gray-800/60'} ${className}`}
      >
        {current.icon}
        <span className="text-zinc-800 dark:text-gray-300">{current.label}</span>
        {!disabled && <ChevronDown className="h-3 w-3 text-gray-600" />}
      </button>

      {open && !disabled && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-36 overflow-hidden rounded-xl border border-zinc-200 dark:border-gray-700/60 bg-white dark:bg-gray-900 shadow-xl py-1">
          {(["planned", "active", "completed"] as const).map((s) => {
            const isSelected = status === s;
            const item = config[s];
            return (
              <button
                key={s}
                type="button"
                onClick={() => handleSelectStatus(s)}
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

// ─── Tab definitions ────────────────────────────────────────────────
const tabs = ['All', 'Planned', 'Active', 'Completed'];

// ─── Main Page ─────────────────────────────────────────────────────
export default function Ventures() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Active');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form states
  const [newName, setNewName] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [newOwner, setNewOwner] = useState<Member | null>(null);
  const [newStatus, setNewStatus] = useState<'active' | 'planned' | 'completed'>('planned');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { user } = useUser();
  const { membership } = useOrganization();
  const currentUser = useQuery(api.members.getCurrentUser);
  const isClerkAdmin = 
    user?.publicMetadata?.role === 'admin' || 
    user?.publicMetadata?.role === 'Admin' ||
    membership?.role === 'admin' || 
    membership?.role === 'org:admin' ||
    user?.organizationMemberships?.some(m => m.role === 'admin' || m.role === 'org:admin');
  const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'admin' || isClerkAdmin;
  const dbVentures = useQuery(api.ventures.listVentures);
  const members = useQuery(api.members.listMembers) as Member[] | undefined;

  const updateOwner = useMutation(api.ventures.updateOwner);
  const updateStatus = useMutation(api.ventures.updateStatus);
  const updateTargetDeadline = useMutation(api.ventures.updateTargetDeadline);
  const createVenture = useMutation(api.ventures.createVenture);

  // Filtered ventures based on active tab
  const filteredVentures = useMemo(() => {
    if (!dbVentures) return [];
    if (activeTab === 'All') return dbVentures;
    return dbVentures.filter((v) => v.status === activeTab.toLowerCase());
  }, [dbVentures, activeTab]);

  // Sync newStatus with current activeTab when creating
  useEffect(() => {
    if (isCreateOpen) {
      setNewStatus(
        activeTab === 'Active' ? 'active' : activeTab === 'Completed' ? 'completed' : 'planned'
      );
    }
  }, [isCreateOpen, activeTab]);

  const handleOwnerSelect = useCallback(async (ventureId: Id<"ventures">, member: Member | null) => {
    await updateOwner({ ventureId, ownerId: member?._id as Id<"members"> ?? null, clerkAdminBypass: isClerkAdmin });
  }, [updateOwner, isClerkAdmin]);

  const handleStatusSelect = useCallback(async (ventureId: Id<"ventures">, status: "active" | "planned" | "completed") => {
    await updateStatus({ ventureId, status, clerkAdminBypass: isClerkAdmin });
  }, [updateStatus, isClerkAdmin]);

  const handleTargetDeadlineSelect = useCallback(async (ventureId: Id<"ventures">, dateStr: string) => {
    await updateTargetDeadline({ ventureId, targetDeadline: dateStr || undefined, clerkAdminBypass: isClerkAdmin });
  }, [updateTargetDeadline, isClerkAdmin]);

  const handleCreateSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setError('Venture name is required.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      await createVenture({
        name: newName.trim(),
        summary: newSummary.trim() || undefined,
        targetDeadline: newDeadline || undefined,
        ownerId: newOwner?._id as Id<"members"> ?? null,
        status: newStatus,
        clerkAdminBypass: isClerkAdmin,
      });
      setNewName('');
      setNewSummary('');
      setNewDeadline('');
      setNewOwner(null);
      setIsCreateOpen(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to create venture.');
    } finally {
      setIsSubmitting(false);
    }
  }, [newName, newSummary, newDeadline, newOwner, newStatus, createVenture, isClerkAdmin]);

  return (
    <div className="flex h-full w-full min-h-0 flex-col text-zinc-800 dark:text-gray-300">
      <header className="flex items-center justify-between border-b border-zinc-200 dark:border-gray-800/60 px-4 sm:px-6 lg:px-8 py-3">
        <h1 className="text-sm font-semibold text-zinc-900 dark:text-gray-200">Ventures</h1>
        {isAdmin && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="group inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-900 dark:text-gray-500 dark:hover:text-gray-300 transition-all duration-200 h-auto p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800/40 rounded-lg"
          >
            <Plus className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100 transition-all duration-300 group-hover:rotate-90 text-indigo-500" />
            <span>Create new venture</span>
          </Button>
        )}
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5 bg-zinc-100/50 dark:bg-zinc-900/40 p-1 rounded-full border border-zinc-200/30 dark:border-zinc-800/40 backdrop-blur-md">
            {tabs.map((tab) => (
              <TabButton
                key={tab}
                label={tab}
                active={activeTab === tab}
                onClick={() => setActiveTab(tab)}
              />
            ))}
          </div>
        </div>

        <div className="hidden md:grid grid-cols-[1.5fr_120px_160px_140px_100px] gap-4 border-b border-zinc-200 dark:border-gray-800/60 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-zinc-405 dark:text-zinc-500">
          <div className="flex items-center gap-3">
            <div className="w-4" />
            <div className="w-6" />
            <span>Name</span>
          </div>
          <div className="justify-self-end pr-2">Status</div>
          <div className="justify-self-end pr-2">Owner</div>
          <div className="justify-self-end pr-2">Target Date</div>
          <div className="justify-self-end pr-2">Projects</div>
        </div>

        {isCreateOpen && (
          <form onSubmit={handleCreateSubmit} className="border border-zinc-200/80 dark:border-zinc-800/60 bg-zinc-55/40 dark:bg-[#18181c]/30 backdrop-blur-md rounded-xl p-4 mt-2 mb-6 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-200 shadow-lg shadow-zinc-200/5 dark:shadow-none">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/60 dark:bg-zinc-950/30 border border-zinc-200/40 dark:border-zinc-800/50 focus-within:border-indigo-500/40 focus-within:ring-1 focus-within:ring-indigo-500/10 transition-all duration-250">
              <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500 mt-0.5 shrink-0">
                <Kayak className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0 flex flex-col">
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="New venture name"
                  className="w-full bg-transparent text-sm font-semibold text-zinc-900 dark:text-gray-100 placeholder-zinc-400 dark:placeholder-zinc-600 outline-none border-none p-0 focus:ring-0"
                  autoFocus
                />
                <input
                  type="text"
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  placeholder="Add a short summary..."
                  className="w-full bg-transparent text-xs text-zinc-500 dark:text-gray-500 placeholder-zinc-400 dark:placeholder-zinc-650 outline-none border-none p-0 mt-1 focus:ring-0"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <StatusDropdown
                  status={newStatus}
                  onSelect={setNewStatus}
                  disabled={false}
                  className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-800 dark:text-zinc-300 shadow-sm rounded-lg"
                />
                <DateSelectorDropdown
                  selectedDateStr={newDeadline}
                  onSelectDate={setNewDeadline}
                  disabled={false}
                />
                <OwnerDropdown
                  owner={newOwner}
                  members={members ?? []}
                  onSelect={setNewOwner}
                  disabled={false}
                  placeholder="Owner"
                  className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-800 dark:text-zinc-300 shadow-sm rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    setNewName('');
                    setNewSummary('');
                    setNewDeadline('');
                    setNewOwner(null);
                    setIsCreateOpen(false);
                  }}
                  className="text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-450 dark:hover:text-zinc-250 font-medium transition-colors px-2 py-1.5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newName.trim() || !newDeadline || !newOwner}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-4 py-1.5 rounded-lg text-xs transition-all duration-205 shadow-sm shadow-indigo-600/10"
                >
                  {isSubmitting ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-955/20 border border-red-900/30 rounded-lg p-2.5 ml-8">{error}</p>
            )}
          </form>
        )}

        {/* Mobile Card List */}
        <div className="flex flex-col gap-3.5 md:hidden">
          {(filteredVentures ?? []).map((venture: any) => {
            const owner = (members ?? []).find((m) => m._id === venture.ownerId) ?? null;
            return (
              <div
                key={venture._id}
                onClick={() => navigate(`/ventures/${venture._id}`)}
                className="flex flex-col gap-3.5 rounded-xl border border-zinc-205 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/10 backdrop-blur-md p-4 shadow-sm hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700/85 hover:scale-[1.008] transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-500/10 shrink-0 mt-0.5">
                      <Kayak className="h-3.5 w-3.5 text-indigo-400" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-base font-semibold text-zinc-900 dark:text-white truncate">{venture.name}</span>
                      {venture.summary && (
                        <span className="text-sm text-zinc-500 dark:text-zinc-500 mt-0.5 line-clamp-2" title={venture.summary}>
                          {venture.summary}
                        </span>
                      )}
                    </div>
                  </div>
                  <div
                    className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800/40 px-2.5 py-0.5 rounded-lg text-xs font-semibold text-zinc-700 dark:text-zinc-400 shrink-0 border border-zinc-200/50 dark:border-zinc-800"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500" />
                    <span>{venture.projects ?? 0}</span>
                  </div>
                </div>

                <div className="border-t border-zinc-200/60 dark:border-zinc-800/40 my-0.5" />

                <div className="flex flex-col gap-2.5 sm:grid sm:grid-cols-3 sm:gap-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between sm:flex-col sm:items-start gap-1">
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Status</span>
                    <div className="w-1/2 sm:w-full">
                      <StatusDropdown
                        status={venture.status}
                        disabled={!isAdmin}
                        onSelect={(status) => handleStatusSelect(venture._id as Id<"ventures">, status)}
                        className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 shadow-sm px-2.5 py-1 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors justify-between w-full"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:flex-col sm:items-start gap-1">
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Owner</span>
                    <div className="w-1/2 sm:w-full">
                      <OwnerDropdown
                        owner={owner}
                        members={members ?? []}
                        disabled={!isAdmin}
                        onSelect={(member) => handleOwnerSelect(venture._id as Id<"ventures">, member)}
                        className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 shadow-sm px-2.5 py-1 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors justify-between w-full"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:flex-col sm:items-start gap-1">
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Target Date</span>
                    <div className="w-1/2 sm:w-full">
                      <VentureDateDropdown
                        selectedDateStr={venture.targetDeadline}
                        disabled={!isAdmin}
                        onSelectDate={(dateStr) => handleTargetDeadlineSelect(venture._id as Id<"ventures">, dateStr)}
                        className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 shadow-sm px-2.5 py-1 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors justify-between w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop Row List */}
        <div className="hidden md:flex flex-col gap-1.5">
          {(filteredVentures ?? []).map((venture: any) => {
            const owner = (members ?? []).find((m) => m._id === venture.ownerId) ?? null;
            return (
              <div
                key={venture._id}
                onClick={() => navigate(`/ventures/${venture._id}`)}
                className="group grid grid-cols-[1.5fr_120px_160px_140px_100px] gap-4 items-center rounded-xl px-4 py-3 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/40 border border-transparent hover:border-zinc-200/50 dark:hover:border-zinc-800/40 transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-500/10 shrink-0">
                    <Kayak className="h-3.5 w-3.5 text-indigo-400" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-base font-semibold text-zinc-900 dark:text-white group-hover:text-indigo-650 dark:group-hover:text-indigo-400 transition-colors truncate">{venture.name}</span>
                    {venture.summary && (
                      <span className="text-sm text-zinc-500 dark:text-zinc-550 truncate max-w-sm md:max-w-md lg:max-w-lg mt-0.5" title={venture.summary}>
                        {venture.summary}
                      </span>
                    )}
                  </div>
                </div>

                <div className="justify-self-end" onClick={(e) => e.stopPropagation()}>
                  <StatusDropdown
                    status={venture.status}
                    disabled={!isAdmin}
                    onSelect={(status) => handleStatusSelect(venture._id as Id<"ventures">, status)}
                    className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 shadow-sm px-2.5 py-1 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                  />
                </div>

                <div className="justify-self-end" onClick={(e) => e.stopPropagation()}>
                  <OwnerDropdown
                    owner={owner}
                    members={members ?? []}
                    disabled={!isAdmin}
                    onSelect={(member) => handleOwnerSelect(venture._id as Id<"ventures">, member)}
                    className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 shadow-sm px-2.5 py-1 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                  />
                </div>

                <div className="justify-self-end" onClick={(e) => e.stopPropagation()}>
                  <VentureDateDropdown
                    selectedDateStr={venture.targetDeadline}
                    disabled={!isAdmin}
                    onSelectDate={(dateStr) => handleTargetDeadlineSelect(venture._id as Id<"ventures">, dateStr)}
                    className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 shadow-sm px-2.5 py-1 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                  />
                </div>

                <div className="justify-self-end flex items-center gap-1.5 text-zinc-650 dark:text-gray-400 text-sm pr-2">
                  <CheckCircle2 className="h-4 w-4 text-indigo-400" />
                  <span>{venture.projects ?? 0}</span>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}