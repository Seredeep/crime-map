'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Log {
  _id: string;
  action: string;
  userId: string;
  userEmail: string;
  userName: string;
  incidentId?: string;
  details: any;
  timestamp: string;
}

export default function LogsView() {
  const { data: session } = useSession();
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    action: 'all',
    user: '',
    dateFrom: '',
    dateTo: ''
  });
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (filters.action !== 'all') queryParams.append('action', filters.action);
      if (filters.user) queryParams.append('user', filters.user);
      if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) queryParams.append('dateTo', filters.dateTo);

      const response = await fetch(`/api/logs?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('Error al cargar los logs');
      }

      const data = await response.json();
      setLogs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los logs');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleExportCSV = () => {
    const headers = ['Fecha', 'Hora', 'Acción', 'Usuario', 'ID Incidente', 'Detalles'];
    const csvContent = [
      headers.join(','),
      ...logs.map(log => [
        format(new Date(log.timestamp), 'dd/MM/yyyy'),
        format(new Date(log.timestamp), 'HH:mm:ss'),
        log.action,
        log.userEmail,
        log.incidentId || '',
        JSON.stringify(log.details)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `logs_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="action" className="block text-sm font-medium text-gray-300 mb-1">
              Acción
            </label>
            <select
              id="action"
              name="action"
              value={filters.action}
              onChange={handleFilterChange}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white"
            >
              <option value="all">Todas las acciones</option>
              <option value="create">Crear</option>
              <option value="update">Actualizar</option>
              <option value="delete">Eliminar</option>
              <option value="verify">Verificar</option>
            </select>
          </div>

          <div>
            <label htmlFor="user" className="block text-sm font-medium text-gray-300 mb-1">
              Usuario
            </label>
            <input
              type="text"
              id="user"
              name="user"
              value={filters.user}
              onChange={handleFilterChange}
              placeholder="Buscar por email..."
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white"
            />
          </div>

          <div>
            <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-300 mb-1">
              Fecha desde
            </label>
            <input
              type="date"
              id="dateFrom"
              name="dateFrom"
              value={filters.dateFrom}
              onChange={handleFilterChange}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white"
            />
          </div>

          <div>
            <label htmlFor="dateTo" className="block text-sm font-medium text-gray-300 mb-1">
              Fecha hasta
            </label>
            <input
              type="date"
              id="dateTo"
              name="dateTo"
              value={filters.dateTo}
              onChange={handleFilterChange}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white"
            />
          </div>
        </div>
      </div>

      {/* Botón de exportar */}
      <div className="flex justify-end">
        <button
          onClick={handleExportCSV}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
        >
          Exportar CSV
        </button>
      </div>

      {/* Tabla de logs */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Acción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  ID Incidente
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-400">
                    Cargando logs...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-red-400">
                    {error}
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-400">
                    No se encontraron logs
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log._id}
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-gray-700 cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {format(new Date(log.timestamp), 'dd/MM/yyyy', { locale: es })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {format(new Date(log.timestamp), 'HH:mm:ss')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {log.action}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {log.userEmail}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {log.incidentId || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de detalles */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium text-white">Detalles del Log</h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400">Fecha y Hora</p>
                <p className="text-white">
                  {format(new Date(selectedLog.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: es })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Acción</p>
                <p className="text-white">{selectedLog.action}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Usuario</p>
                <p className="text-white">{selectedLog.userEmail}</p>
              </div>
              {selectedLog.incidentId && (
                <div>
                  <p className="text-sm text-gray-400">ID Incidente</p>
                  <p className="text-white">{selectedLog.incidentId}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-400">Detalles</p>
                <pre className="mt-1 p-4 bg-gray-900 rounded-md overflow-x-auto text-sm text-gray-300">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 