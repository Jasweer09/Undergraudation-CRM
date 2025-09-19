import React from 'react';
import Header from './Header';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="container mx-auto px-4 py-6 flex-1">{children}</main>
    </div>
  );
}
