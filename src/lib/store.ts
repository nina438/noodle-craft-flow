export function getStore<T>(key: string, fallback: T[] = []): T[] {
  try {
    const d = localStorage.getItem(`erp_${key}`);
    return d ? JSON.parse(d) : fallback;
  } catch { return fallback; }
}

export function setStore<T>(key: string, data: T[]): void {
  localStorage.setItem(`erp_${key}`, JSON.stringify(data));
}

export function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
