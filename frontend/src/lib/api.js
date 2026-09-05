const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export async function fetchDirectory() {
  const res = await fetch(`${API_URL}/api/directory`);
  if (!res.ok) {
    throw new Error(`Failed to load directory (${res.status})`);
  }
  return res.json();
}
