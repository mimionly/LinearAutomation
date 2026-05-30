import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface Member {
  id: string;
  name: string;
  email: string;
  initials: string;
  avatarColor: string;
  isAdmin?: boolean;
  isYou?: boolean;
}

const AVATAR_COLORS = [
  "bg-red-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-teal-500",
  "bg-blue-500",
  "bg-indigo-500",
  "bg-violet-500",
  "bg-purple-500",
  "bg-pink-500",
];

function getAvatarColor(email: string): string {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

export default function AssignTeamMembers() {
  const dbMembers = useQuery(api.members.listMembers);
  const caller = useQuery(api.members.getCallerByClerkId);

  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState("");
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (dbMembers !== undefined && caller !== undefined && !initialized) {
      const mapped = dbMembers.map((m) => {
        const initials = m.name
          ? m.name.split(/[\s@]/)[0].slice(0, 2).toUpperCase()
          : "";
        return {
          id: m._id,
          name: m.name,
          email: m.email,
          initials,
          avatarColor: getAvatarColor(m.email),
          isAdmin: m.role === "Admin",
          isYou: caller ? m._id === caller._id : false,
        };
      });
      setMembers(mapped);
      setInitialized(true);
    }
  }, [dbMembers, caller, initialized]);

  const filtered = members.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase())
  );

  const removeMember = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  if (dbMembers === undefined || caller === undefined) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-md p-8 text-center text-sm text-gray-500">
          Loading members...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-md">

        {/* Header */}
        <div className="p-7 pb-0">
          <div className="w-11 h-11 bg-gray-900 rounded-xl flex items-center justify-center mb-4">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-4.13a4 4 0 11-8 0 4 4 0 018 0zm6 0a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>

          <h2 className="text-base font-semibold text-gray-900 mb-1">
            Assign team members
          </h2>
          <p className="text-sm text-gray-500 mb-5">
            Choose who's on this project and what they can do.
          </p>

          {/* Search */}
          <div className="relative mb-5">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search name or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-4 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 outline-none focus:border-gray-400 transition-colors"
            />
          </div>

          {/* Members list */}
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-1">
            Members
          </p>

          <div>
            {filtered.length === 0 && (
              <p className="text-sm text-gray-400 py-4 text-center">
                No members found.
              </p>
            )}
            {filtered.map((member, idx) => (
              <div
                key={member.id}
                className={`flex items-center gap-3 py-3 ${
                  idx !== filtered.length - 1
                    ? "border-b border-gray-100"
                    : ""
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-semibold ${member.avatarColor}`}
                >
                  {member.initials}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {member.name}
                    {member.isYou && (
                      <span className="text-gray-400 font-normal ml-1">
                        (You)
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{member.email}</p>
                </div>

                {/* Action */}
                {member.isAdmin ? (
                  <span className="text-xs font-medium text-gray-700 bg-gray-100 border border-gray-200 rounded-full px-3 py-1 flex-shrink-0">
                    Admin
                  </span>
                ) : (
                  <button
                    onClick={() => removeMember(member.id)}
                    aria-label={`Remove ${member.name}`}
                    className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors flex-shrink-0"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-7 pt-4 flex items-center justify-end border-t border-gray-100">
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              Back
            </button>
            <button className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors">
              Create project
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
