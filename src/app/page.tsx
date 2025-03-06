'use client';

import IncidentForm from './components/IncidentForm';
import IncidentsView from './components/IncidentsView';
import Tabs from './components/Tabs';

export default function Home() {
  const tabs = [
    {
      id: 'incidents',
      label: 'Incidents',
      content: <IncidentsView />
    },
    {
      id: 'report',
      label: 'Report Incident',
      content: (
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Report an Incident</h2>
          <IncidentForm />
        </div>
      )
    }
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-6 text-center">Crime Map</h1>
        
        <div className="w-full max-w-6xl mx-auto">
          <Tabs tabs={tabs} defaultTab="incidents" />
        </div>
      </div>
    </main>
  );
}
