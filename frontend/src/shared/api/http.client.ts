const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  // Obtener token del localStorage (solo en cliente)
  let token: string | null = null;
  if (typeof window !== 'undefined') {
    try {
      const session = JSON.parse(localStorage.getItem('instituto-session') ?? '{}');
      token = session?.state?.token ?? null;
    } catch {}
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}/api/v1${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Error de servidor' }));
    throw new Error(error.message ?? `HTTP ${res.status}`);
  }

  return res.json();
}

export const http = {
  get:    <T>(path: string) =>
    request<T>(path, { method: 'GET' }),

  post:   <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),

  put:    <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),

  delete: <T>(path: string) =>
    request<T>(path, { method: 'DELETE' }),

  upload: <T>(path: string, form: FormData) =>
    request<T>(path, {
      method: 'POST',
      body: form,
      headers: {}, // No poner Content-Type para que el navegador ponga el boundary
    }),
};
