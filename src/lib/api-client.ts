/**
 * Helper fetch untuk client component.
 * Semua panggilan ke API kita otomatis membawa cookie sesi dan
 * melempar Error berisi pesan dari server bila status bukan 2xx.
 */
export async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(path, {
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  })

  const text = await res.text()
  const data = text ? JSON.parse(text) : null

  if (!res.ok) {
    throw new Error(data?.error || `Permintaan gagal (${res.status})`)
  }
  return data as T
}

export const apiGet = <T>(path: string) => apiFetch<T>(path)

export const apiPost = <T>(path: string, body: unknown) =>
  apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body) })

export const apiPatch = <T>(path: string, body: unknown) =>
  apiFetch<T>(path, { method: 'PATCH', body: JSON.stringify(body) })

export const apiPut = <T>(path: string, body: unknown) =>
  apiFetch<T>(path, { method: 'PUT', body: JSON.stringify(body) })

export const apiDelete = <T>(path: string) =>
  apiFetch<T>(path, { method: 'DELETE' })
