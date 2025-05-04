'use client';

import { useRouter } from 'next/navigation';
import IncidentsView from './components/IncidentsView';
import Tabs from './components/Tabs';
import { useSession } from 'next-auth/react';
import IncidentQueue from './components/IncidentQueue';

export default function Home() {
  const router = useRouter();
  const { status } = useSession();

  const handleReportClick = () => {
    if (status === 'authenticated') {
      router.push('/report');
    } else {
      router.push('/auth/signin?callbackUrl=/report');
    }
  };

  const tabs = [
    {
      id: 'incidents',
      label: 'Incidentes',
      content: <IncidentsView />
    },
    {
      id: 'report',
      label: 'Reportar Incidente',
      content: (
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Reportar un Incidente</h2>
          <p className="mb-4">Para reportar un incidente, necesitas estar autenticado.</p>
          <button 
            onClick={handleReportClick} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            {status === 'authenticated' ? 'Ir a reportar' : 'Iniciar sesión para reportar'}
          </button>
        </div>
      )
    },
    {
      id: 'queue',
      label: 'Cola de Incidentes',
      content: (
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Cola de Incidentes</h2>
          <IncidentQueue />
        </div>
      )
    }
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-6 text-center">Mapa de Crimen</h1>
        
        <div className="w-full max-w-6xl mx-auto">
          <Tabs tabs={tabs} defaultTab="incidents" />
        </div>
      </div>
    </main>
  );
}
