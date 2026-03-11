// Thin wrapper around fetch — returns an array on all code paths for GET,
// and a result object (or { error }) for mutating requests.

export async function safeFetch(url) {
  try {
    const r = await fetch(url);
    if (!r.ok) return [];
    const data = await r.json();
    return Array.isArray(data) ? data : (data ? [data] : []);
  } catch {
    return [];
  }
}

export async function postData(url, body) {
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await r.json();
    if (!r.ok) return { error: data.error || 'Request failed' };
    return data;
  } catch {
    return { error: 'Network error' };
  }
}

