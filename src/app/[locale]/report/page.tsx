'use client';

import IncidentForm from '../../components/IncidentForm';
import ProtectedRoute from '../../components/ProtectedRoute';

export default function ReportPage() {
  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white pt-6">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-6 text-center">Reportar Incidente</h1>

          <div className="w-full max-w-3xl mx-auto bg-gray-800 rounded-lg p-6 shadow-lg">
            <IncidentForm />
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
