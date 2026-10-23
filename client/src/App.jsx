import { useEffect, useState } from 'react';
import { request } from './api/client.js';

export default function App() {
  const [health, setHealth] = useState({ state: 'loading' });

  useEffect(() => {
    request('/health')
      .then((data) => setHealth({ state: 'ok', data }))
      .catch((err) => setHealth({ state: 'error', message: err.message }));
  }, []);

  return (
    <main className="mx-auto max-w-lg p-8">
      <h1 className="text-2xl font-semibold">Pipeline CRM</h1>
      <p className="mt-2 text-slate-600" role="status">
        {health.state === 'loading' && 'Checking API…'}
        {health.state === 'ok' && `API ${health.data.status}, database ${health.data.db}`}
        {health.state === 'error' && `API unavailable: ${health.message}`}
      </p>
    </main>
  );
}
