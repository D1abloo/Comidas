export type CookieOptions = {
  maxAgeSeconds?: number;
  path?: string;
  sameSite?: 'Lax' | 'Strict' | 'None';
  secure?: boolean;
};

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const prefix = `${encodeURIComponent(name)}=`;
  const part = document.cookie.split('; ').find((row) => row.startsWith(prefix));
  if (!part) return null;
  try {
    return decodeURIComponent(part.slice(prefix.length));
  } catch {
    return part.slice(prefix.length);
  }
}

export function setCookie(name: string, value: string, options: CookieOptions = {}): void {
  if (typeof document === 'undefined') return;
  const { maxAgeSeconds, path = '/', sameSite = 'Lax', secure } = options;
  let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=${path}; SameSite=${sameSite}`;
  if (maxAgeSeconds != null) cookie += `; max-age=${maxAgeSeconds}`;
  if (secure || (typeof location !== 'undefined' && location.protocol === 'https:')) {
    cookie += '; Secure';
  }
  document.cookie = cookie;
}

export function deleteCookie(name: string, path = '/'): void {
  setCookie(name, '', { maxAgeSeconds: 0, path });
}
