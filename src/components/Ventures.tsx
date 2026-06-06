import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  Layout,
  Plus,
  CheckCircle2,
  Target,
  ChevronDown,
  UserMinus,
  Check,
} from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';

// ─── shadcn/ui components ─────────────────────────────────────────
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// ─── Types ─────────────────────────────────────────────────────────
interface Member {
  _id: string;
  name: string;
  avatarUrl?: string;
  teams?: { name: string; iconEmoji: string }[];
}

// ─── shadcn Avatar wrapper ─────────────────────────────────────────
const MemberAvatar = ({ src, alt, size = 20 }: { src?: string; alt: string; size?: number }) => (
  <Avatar style={{ width: size, height: size }}>
    {src ? (
      <AvatarImage src={src} alt={alt} className="object-cover" />
    ) : null}
    <AvatarFallback className="text-[10px] bg-gray-800 text-gray-400">
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
          ? 'border-gray-400 text-gray-200 bg-transparent hover:bg-gray-800/40'
          : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-700 hover:bg-transparent'
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
  disabled 
}: { 
  owner: Member | null; 
  members: Member[]; 
  onSelect: (member: Member | null) => void; 
  disabled: boolean;
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
        disabled={disabled}
        onClick={() => { setOpen((o) => !o); setQuery(''); }}
        className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-sm transition-colors
          ${disabled ? 'cursor-default' : 'hover:bg-gray-800/60'}`}
      >
        {owner ? (
          <>
            <MemberAvatar src={owner.avatarUrl} alt={owner.name} size={18} />
            <span className="text-gray-300">{owner.name}</span>
          </>
        ) : (
          <span className="text-gray-500">No owner</span>
        )}
        {!disabled && <ChevronDown className="h-3 w-3 text-gray-600" />}
      </button>

      {open && !disabled && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-56 overflow-hidden rounded-xl border border-gray-700/60 bg-gray-900 shadow-xl">
          <div className="border-b border-gray-800 px-3 py-2">
            <input
              autoFocus
              type="text"
              placeholder="Search members…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-sm text-gray-200 placeholder-gray-600 outline-none"
            />
          </div>

          <ul className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-xs text-gray-600">No members found</li>
            )}
            {filtered.map((m) => {
              const isSelected = owner?._id === m._id;
              return (
                <li
                  key={m._id}
                  onClick={() => { onSelect(m); setOpen(false); }}
                  className={`flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-gray-800/60 ${isSelected ? 'bg-gray-800/40' : ''}`}
                >
                  <MemberAvatar src={m.avatarUrl} alt={m.name} size={22} />
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-200 font-medium truncate">{m.name}</p>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {m.teams?.map((t) => (
                        <span key={`${m._id}-${t.name}`} className="text-[10px] text-gray-500 bg-gray-800 rounded px-1">
                          {t.iconEmoji} {t.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  {isSelected && <Check className="h-3.5 w-3.5 text-indigo-400 flex-shrink-0" />}
                </li>
              );
            })}
          </ul>

          <div className="border-t border-gray-800">
            <button
              onClick={() => { onSelect(null); setOpen(false); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:bg-gray-800/60 hover:text-red-400 transition-colors"
            >
              <UserMinus className="h-3.5 w-3.5" />
              No owner
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Column widths ──────────────────────────────────────────────────
const COL = {
  owner:    'w-36',
  target:   'w-24',
  projects: 'w-32',
};

// ─── Main Page ─────────────────────────────────────────────────────
export default function Ventures() {
  const [activeTab, setActiveTab] = useState('Active');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form states
  const [newName, setNewName] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [newOwner, setNewOwner] = useState<Member | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const currentUser = useQuery(api.members.getCurrentUser); 
  const isAdmin = currentUser?.role === 'Admin';
  const dbVentures = useQuery(api.ventures.listVentures);
  const members = useQuery(api.members.listMembers) as Member[] | undefined;

  const updateOwner = useMutation(api.ventures.updateOwner);
  const createVenture = useMutation(api.ventures.createVenture);

  const handleOwnerSelect = useCallback(async (ventureId: Id<"ventures">, member: Member | null) => {
    await updateOwner({ ventureId, ownerId: member?._id as Id<"members"> ?? null });
  }, [updateOwner]);

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
        status: activeTab === 'Planned' || activeTab === 'Completed' || activeTab === 'Active'
          ? (activeTab.toLowerCase() as "active" | "planned" | "completed")
          : 'planned',
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
  }, [newName, newSummary, newDeadline, newOwner, activeTab, createVenture]);


  const filteredVentures = useMemo(() => {
  if (!dbVentures) return [];
  const statusMap: Record<string, string> = {
    'Active': 'active',
    'Planned': 'planned',
    'Completed': 'completed'
  };
  const targetStatus = statusMap[activeTab];
  return targetStatus
    ? dbVentures.filter((v: any) => v.status === targetStatus)
    : dbVentures;
}, [dbVentures, activeTab]);

  const tabs = ['Active', 'Planned', 'Completed'];
if (dbVentures === undefined || members === undefined) {
  return <div className="flex h-screen w-full items-center justify-center text-gray-500">Loading ventures...</div>;
}




  return (
    <div className="flex h-screen w-full flex-col text-gray-300">
      <header className="flex items-center justify-between border-b border-gray-800/60 px-5 py-3">
        <div className="flex items-center gap-3">
          <Layout className="h-5 w-5 text-gray-500" />
          <h1 className="text-[15px] font-semibold text-gray-200">Ventures</h1>
        </div>
        {isAdmin && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger >
              <Button 
                variant="ghost" 
                size="sm"
                className="group inline-flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300 transition-colors duration-300"
              >
                <span>Create new venture</span>
                <Plus className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-all duration-300 group-hover:rotate-90" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md border border-gray-800/80 bg-gray-900/90 backdrop-blur-md p-6 text-gray-200 rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-150">
              <DialogHeader className="mb-4">
                <DialogTitle className="text-[17px] font-semibold text-gray-100">Create new venture</DialogTitle>
                <DialogDescription className="text-xs text-gray-500">
                  Define a new initiative, set a target deadline, and assign an owner.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateSubmit} className="space-y-4">
                {/* Venture Name */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="venture-name" className="text-xs text-gray-400 font-medium">Venture name</Label>
                  <Input
                    id="venture-name"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Q3 Marketing Campaign"
                    className="w-full bg-gray-950/40 border-gray-800 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/20 text-gray-200"
                  />
                </div>

                {/* Summary */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="venture-summary" className="text-xs text-gray-400 font-medium">Summary</Label>
                  <Textarea
                    id="venture-summary"
                    value={newSummary}
                    onChange={(e) => setNewSummary(e.target.value)}
                    placeholder="Short description of the venture goals..."
                    className="w-full bg-gray-950/40 border-gray-800 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/20 text-gray-200 resize-none min-h-20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Target Deadline Date */}
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="venture-deadline" className="text-xs text-gray-400 font-medium">Target deadline date</Label>
                    <Input
                      id="venture-deadline"
                      type="date"
                      value={newDeadline}
                      onChange={(e) => setNewDeadline(e.target.value)}
                      className="w-full bg-gray-950/40 border-gray-800 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/20 text-gray-200 [color-scheme:dark]"
                    />
                  </div>

                  {/* Venture Lead / Owner */}
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs text-gray-400 font-medium">Venture lead/owner</Label>
                    <div className="flex justify-start">
                      <OwnerDropdown
                        owner={newOwner}
                        members={members ?? []}
                        onSelect={setNewOwner}
                        disabled={false}
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <p className="text-xs text-red-400 bg-red-950/30 border border-red-900/30 rounded-lg p-2.5">{error}</p>
                )}

                <DialogFooter className="mt-6 pt-4 border-t border-gray-800/40">
                  <DialogClose>
                    <Button variant="outline" size="sm" type="button" disabled={isSubmitting} className="border-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-800/40">
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button size="sm" type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium">
                    {isSubmitting ? 'Creating...' : 'Create venture'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </header>

      <main className="flex-1 overflow-auto px-5 py-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-1">
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

        <div className="flex items-center border-b border-gray-800/60 px-3 py-2 text-xs font-medium text-gray-500">
          <div className="flex flex-1 items-center gap-3">
            <div className="h-4 w-4" />
            <div className="w-6" />
            <span>Name</span>
          </div>
          <div className={`${COL.owner} text-right`}>Owner</div>
          <div className={`${COL.target} text-right`}>Target</div>
          <div className={`${COL.projects} text-right`}>Projects</div>
        </div>

        {filteredVentures.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-sm text-gray-600">
            No {activeTab.toLowerCase()} ventures found.
          </div>
        ) : (
          filteredVentures.map((venture: any) => {
            const owner = members.find((m) => m._id === venture.ownerId) ?? null;

            return (
              <div key={venture._id} className="group flex items-center rounded-lg px-3 py-2.5 hover:bg-gray-800/40">
                <div className="flex flex-1 items-center gap-3">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border border-gray-700 bg-transparent accent-indigo-500 cursor-pointer"
                  />
                  <div className="flex h-6 w-6 items-center justify-center rounded-md">
                    <Target className="h-3.5 w-3.5 text-indigo-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-200">{venture.name}</span>
                    {venture.summary && (
                      <span className="text-xs text-gray-500 truncate max-w-sm mt-0.5" title={venture.summary}>
                        {venture.summary}
                      </span>
                    )}
                  </div>
                </div>

                <div className={`flex ${COL.owner} items-center justify-end`}>
                  <OwnerDropdown
                    owner={owner}
                    members={members}

                    disabled={!isAdmin} 
                   onSelect={(member) => handleOwnerSelect(venture._id as Id<"ventures">, member)}
                  />
                </div>

                <div className={`${COL.target} text-right text-sm text-gray-400`}>
                  {venture.targetDeadline ? (
                    new Date(venture.targetDeadline).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      timeZone: 'UTC'
                    })
                  ) : (
                    <span className="text-gray-600">—</span>
                  )}
                </div>

                <div className={`flex ${COL.projects} items-center justify-end gap-1.5`}>
                  <CheckCircle2 className="h-4 w-4 text-indigo-400" />
                  <span className="text-sm text-gray-400">{venture.projects ?? 0}</span>
                </div>
              </div>
            );
          })
        )}
      </main>
    </div>
  );
}