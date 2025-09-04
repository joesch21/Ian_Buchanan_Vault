import mockGraph from '../utils/mockGraph';

export default function useCartographyApi() {
  const compile = async (payload, { allowMock = false } = {}) => {
    if (allowMock) {
      sessionStorage.setItem('cartography:last', JSON.stringify(mockGraph));
      return mockGraph;
    }
    const res = await fetch('/api/cartography/compile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to compile cartography');
    const data = await res.json();
    sessionStorage.setItem('cartography:last', JSON.stringify(data));
    return data;
  };

  const readCache = () => {
    const raw = sessionStorage.getItem('cartography:last');
    return raw ? JSON.parse(raw) : null;
  };

  return { compile, readCache };
}
