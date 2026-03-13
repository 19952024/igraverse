export type LocalAuthUser = {
  username: string;
  password: string;
};

const USERS_KEY = "igraverse_local_users";

function loadUsers(): LocalAuthUser[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (u): u is LocalAuthUser =>
        typeof u?.username === "string" && typeof u?.password === "string",
    );
  } catch {
    return [];
  }
}

function saveUsers(users: LocalAuthUser[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function findLocalUser(username: string): LocalAuthUser | undefined {
  const users = loadUsers();
  return users.find((u) => u.username === username);
}

export function upsertLocalUser(username: string, password: string): void {
  const users = loadUsers();
  const existingIndex = users.findIndex((u) => u.username === username);
  const record: LocalAuthUser = { username, password };
  if (existingIndex >= 0) {
    users[existingIndex] = record;
  } else {
    users.push(record);
  }
  saveUsers(users);
}

export function validateLocalCredentials(
  username: string,
  password: string,
): boolean {
  const user = findLocalUser(username);
  if (!user) return false;
  return user.password === password;
}

