const API_URL = 'http://127.0.0.1:3101';

export async function dbApi(path: string, init?: RequestInit) {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  });
  const data = await response.json() as { message?: string; [key: string]: unknown };
  if (!response.ok) throw new Error(data?.message ?? '데이터베이스 요청에 실패했습니다.');
  return data;
}
