// lib/members.ts
import { useOrganization } from "@clerk/clerk-react";

export function useMembers() {
  const { memberships, isLoaded } = useOrganization({
    memberships: {
      pageSize: 50,
      keepPreviousData: true,
    },
  });

  const members = memberships?.data
    ?.filter((m) => m.publicUserData != null)   // ← drop any without public data
    .map((m) => ({
      id:        m.publicUserData!.userId        ?? "",
      name:      `${m.publicUserData!.firstName ?? ""} ${m.publicUserData!.lastName ?? ""}`.trim(),
      email:     m.publicUserData!.identifier    ?? "",
      clerkRole: m.role,
      imageUrl:  m.publicUserData!.imageUrl      ?? "",
    }));

  return { members: members ?? [], isLoaded };
}