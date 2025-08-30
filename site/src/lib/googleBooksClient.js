export async function fetchGoogleBook(isbn) {
  const id = (isbn || '').trim();
  if (!id) return null;
  const res = await fetch(`/api/google-books?isbn=${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`Google Books fetch failed: ${res.status}`);
  const data = await res.json();
  if (!data?.ok) throw new Error(data.error || 'Invalid response');
  return data.result || null;
}
