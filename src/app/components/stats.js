"use client";
import { useEffect, useState } from 'react';

export default function StatsDisplay() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => setStats(data));
  }, []);

  if (!stats) return <div>Loading stats...</div>;

  return (
    <div className="p-6 text-black bg-yellow-100 rounded-xl shadow-md max-w-md mx-auto mt-6">
      <h2 className="text-2xl font-bold mb-4 text-center">🧠 Pipeline Stats</h2>
      <ul className="space-y-2">
        {Object.entries(stats).map(([key, value]) => (
          <li key={key} className="flex justify-between bg-white p-2 rounded shadow-sm">
            <span className="font-medium">{key.replaceAll('_', ' ')}</span>
            <span className="text-blue-600 font-bold">{value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
