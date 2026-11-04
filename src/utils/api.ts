// Authentication & API Request Utility with Session Token Management

const STORAGE_KEY = 'pagomovil_pos_session_token';

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEY);
}

export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, token);
}

export function clearAuthToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

export async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const token = getAuthToken();
  const headers = new Headers(init?.headers || {});

  if (token) {
    headers.set('x-session-token', token);
  }

  const response = await fetch(input, {
    ...init,
    headers,
  });

  if (response.status === 401) {
    // If unauthorized, notify window to trigger lock screen
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
  }

  return response;
}

export async function verifyCurrentSession(): Promise<boolean> {
  const token = getAuthToken();
  if (!token) return false;

  try {
    const res = await fetch('/api/auth/verify', {
      headers: { 'x-session-token': token },
    });
    return res.ok;
  } catch (err) {
    console.error('Session verify error:', err);
    return false;
  }
}

export async function loginWithPin(pin: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });

    const data = await res.json();
    if (res.ok && data.success && data.token) {
      setAuthToken(data.token);
      return { success: true };
    }
    return { success: false, error: data.error || 'PIN incorrecto' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error de conexión con el servidor' };
  }
}

export async function logoutSession(): Promise<void> {
  try {
    await authFetch('/api/auth/logout', { method: 'POST' });
  } catch (e) {
    // ignore
  } finally {
    clearAuthToken();
  }
}

export async function changePin(currentPin: string, newPin: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await authFetch('/api/auth/change-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPin, newPin }),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      return { success: true };
    }
    return { success: false, error: data.error || 'No se pudo cambiar el PIN' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al cambiar PIN' };
  }
}
