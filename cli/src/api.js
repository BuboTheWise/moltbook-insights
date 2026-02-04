const baseURL = 'https://www.moltbook.com/api/v1';

export async function callApi(path, options = {}) {
  const apiKey = process.env.MOLTBOOK_API_KEY || options?.apiKey;
  if (!apiKey) {
    throw new Error('MOLTBOOK_API_KEY required');
  }
  const url = `${baseURL}${path}`;
  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const res = await fetch(url, { headers, ...options });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API Error ${res.status}: ${err.slice(0,200)}`);
  }
  return res.json();
}