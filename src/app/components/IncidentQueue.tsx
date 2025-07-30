'use client';

import { COMMON_TAGS } from '@/lib/config';
import { fetchIncidents } from '@/lib/services/incidents/incidentService';
import { Incident } from '@/lib/types/global';
import { formatDate, formatTime, timeAgo } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

interface IncidentQueueProps {
  onIncidentSelect?: (incident: Incident) => void;
}

export default function IncidentQueue({ onIncidentSelect }: IncidentQueueProps) {
  const t = useTranslations('Incidents');
  const tCommon = useTranslations('Common');
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [reason, setReason] = useState('');
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<'pending' | 'verified' | 'resolved' | null>(null);

  useEffect(() => {
    async function loadIncidents() {
      setLoading(true);
      setError(null);
      try {
        const filters = {
          status: statusFilter !== 'all' ? statusFilter : undefined,
          tags: tagFilter !== 'all' ? [tagFilter] : undefined,
        };
        const data = await fetchIncidents(filters);
        setIncidents(data);
      } catch (err) {
        console.error('Error loading incidents:', err);
        setError('No se pudieron cargar los incidentes');
      } finally {
        setLoading(false);
      }
    }

    loadIncidents();
  }, [statusFilter, tagFilter]);

  const handleStatusChange = async (incidentId: string, newStatus: 'pending' | 'verified' | 'resolved') => {
    const incident = incidents.find(i => i._id === incidentId);
    if (!incident) return;

    setSelectedIncident(incident);
    setPendingStatus(newStatus);
    setShowReasonModal(true);
  };

  const confirmStatusChange = async () => {
    if (!selectedIncident || !pendingStatus) return;

    try {
      const response = await fetch('/api/incidents', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          incidentId: selectedIncident._id,
          status: pendingStatus,
          reason: reason.trim() || undefined
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || data.error || 'Failed to update incident status');
      }

      // Update the local state
      setIncidents(incidents.map(incident =>
        incident._id === selectedIncident._id
          ? { ...incident, status: pendingStatus }
          : incident
      ));

      // Reset state
      setSelectedIncident(null);
      setPendingStatus(null);
      setReason('');
      setShowReasonModal(false);
    } catch (err) {
      console.error('Error updating incident status:', err);
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el estado del incidente');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/50 backdrop-blur-sm p-4 rounded-lg text-red-200">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-gray-800/50 text-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Todos los estados</option>
          <option value="pending">Pendiente</option>
          <option value="verified">Verificado</option>
          <option value="resolved">Resuelto</option>
        </select>

        <select
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          className="bg-gray-800/50 text-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Todos los tipos</option>
          {COMMON_TAGS.map(tag => (
            <option key={tag} value={tag}>
              {tag.charAt(0).toUpperCase() + tag.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Queue */}
      <div className="space-y-4">
        {incidents.map((incident) => (
          <div
            key={incident._id}
            className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 hover:bg-gray-700/50 transition-colors cursor-pointer"
            onClick={() => onIncidentSelect?.(incident)}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-lg font-medium text-gray-200">
                  {incident.description}
                </h3>
                <p className="text-sm text-gray-400">{incident.address}</p>
              </div>
              <select
                value={incident.status || 'pending'}
                onChange={(e) => handleStatusChange(incident._id, e.target.value as 'pending' | 'verified' | 'resolved')}
                onClick={(e) => e.stopPropagation()}
                className="bg-gray-700/50 text-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pending">Pendiente</option>
                <option value="verified">Verificado</option>
                <option value="resolved">Resuelto</option>
              </select>
            </div>

            <div className="flex flex-wrap gap-2 mb-2">
              {incident.tags?.map((tag) => (
                <span
                  key={tag}
                  className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex justify-between items-center text-sm text-gray-400">
              <div className="flex gap-4">
                <span>{formatDate(incident.date)}</span>
                <span>{formatTime(incident.time)}</span>
              </div>
              <span>{timeAgo(incident.createdAt)}</span>
            </div>
          </div>
        ))}

        {incidents.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            {t('noIncidentsMatch')}
          </div>
        )}
      </div>

      {/* Reason Modal */}
      {showReasonModal && selectedIncident && pendingStatus && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-200 mb-4">
              {t('changeStatusTo', { status: pendingStatus })}
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              {selectedIncident.description}
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('reasonPlaceholder')}
              className="w-full bg-gray-700/50 text-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              rows={3}
            />
            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowReasonModal(false);
                  setSelectedIncident(null);
                  setPendingStatus(null);
                  setReason('');
                }}
                className="px-4 py-2 text-gray-400 hover:text-gray-200"
              >
                {tCommon('cancel')}
              </button>
              <button
                onClick={confirmStatusChange}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                {t('confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
