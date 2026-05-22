export interface ProfileData {
  fullName: string;
  title: string;
  username: string;
  email: string;
  avatarUrl: string;
}

export const STORAGE_KEY = "profileData";
export const AVATAR_KEY = "profileAvatar";

export const EMPTY: ProfileData = {
  fullName: "",
  title: "",
  username: "",
  email: "",
  avatarUrl: "",
};

export function loadProfile(): ProfileData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const avatar = localStorage.getItem(AVATAR_KEY) ?? "";
    if (!raw) return { ...EMPTY, avatarUrl: avatar };
    return { ...EMPTY, ...JSON.parse(raw), avatarUrl: avatar };
  } catch {
    return { ...EMPTY };
  }
}

export function saveProfile(data: ProfileData): void {
  const { avatarUrl, ...rest } = data;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));  
  if (avatarUrl) {
    localStorage.setItem(AVATAR_KEY, avatarUrl);            
  } else {
    localStorage.removeItem(AVATAR_KEY);
  }
}

export function clearProfile(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(AVATAR_KEY);
}

export function validateEmail(email: string): string {
  if (!email.trim()) return "Email is required.";
  const re = /^[^\s@]+@gmail\.com$/;
  if (!re.test(email)) return "Enter a valid @gmail.com address.";
  return "";
}