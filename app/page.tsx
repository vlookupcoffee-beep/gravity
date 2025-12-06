'use client';

import React from 'react';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-4">Gravity Dashboard</h1>
      <p className="text-xl mb-8">System Status: Online</p>

      <a
        href="/dashboard"
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        Enter Dashboard
      </a>
    </div>
  );
}
