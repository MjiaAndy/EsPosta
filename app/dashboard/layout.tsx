import React from 'react';
import { DashboardNav } from './components/DashboardNav'; 

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <DashboardNav /> 
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
}