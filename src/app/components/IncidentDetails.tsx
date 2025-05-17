'use client';
import { Incident } from '@/lib/types';
import { formatDate, formatTime } from '@/lib/utils';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { updateIncident } from '@/lib/incidentService';
import supabase from '@/lib/supabase';


interface IncidentDetailsProps {
  incident: Incident | null;
  onIncidentUpdate?: (incident: Incident) => void;
}

export default function IncidentDetails({ incident, onIncidentUpdate }: IncidentDetailsProps) {
  const { data: session } = useSession();
  const isEditor = session?.user?.role === 'editor' || session?.user?.role === 'admin';
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  if (!incident) {
    return (
      <div className="p-6 text-center text-gray-400">
        <p>Select an incident from the map to view details</p>
      </div>
    );
  }

  // Get status badge color
  const getStatusBadgeClass = (status?: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-400 text-yellow-900';
      case 'verified':
        return 'bg-blue-400 text-blue-900';
      case 'resolved':
        return 'bg-green-400 text-green-900';
      default:
        return 'bg-gray-400 text-gray-900';
    }
  };

  const getEvidenceUrl = (filePath: string) => {
    return supabase.storage.from('evidence').getPublicUrl(filePath).data.publicUrl;
  };

  // Determine file type from URL
  const getFileType = (filePath: string) => {
    const extension = filePath.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return 'image';
    } else if (['mp4', 'webm', 'ogg'].includes(extension || '')) {
      return 'video';
    } else if (['pdf'].includes(extension || '')) {
      return 'pdf';
    } else {
      return 'other';
    }
  };

  const handleEditClick = (field: string) => {
    setEditingField(field);
    setEditValue(incident[field as keyof Incident] as string);
  };

  const handleSaveEdit = async () => {
    if (!editingField || !onIncidentUpdate) return;

    try {
      const updatedIncident = await updateIncident(incident._id, {
        [editingField]: editValue,
      });

      onIncidentUpdate(updatedIncident);
      setEditingField(null);
    } catch (error) {
      console.error('Error updating incident:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  const renderEditableField = (field: string, value: string) => {
    if (editingField === field) {
      return (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="flex-1 bg-gray-800 text-gray-200 rounded px-2 py-1"
          />
          <button
            onClick={handleSaveEdit}
            className="p-1 bg-green-600 hover:bg-green-500 text-white rounded-md transition-colors flex items-center justify-center"
            title="Guardar cambios"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            onClick={handleCancelEdit}
            className="p-1 bg-red-600 hover:bg-red-500 text-white rounded-md transition-colors flex items-center justify-center"
            title="Cancelar edición"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <span>{value}</span>
        {isEditor && (
          <button
            onClick={() => handleEditClick(field)}
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="flex items-start justify-between">
        {renderEditableField('description', incident.description)}
        {incident.status && (
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusBadgeClass(incident.status)}`}>
            {incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}
          </span>
        )}
      </div>

      <div className="p-3 bg-gray-700 rounded-md">
        <div className="flex items-start">
          <div className="flex-shrink-0 mt-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-2 flex-1">
            <p className="font-medium text-sm">Location:</p>
            {renderEditableField('address', incident.address)}
            <div className="mt-1 text-xs text-gray-400">
              GPS: {incident.location.coordinates[1].toFixed(6)}, {incident.location.coordinates[0].toFixed(6)}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-gray-700 rounded-md">
          <p className="text-xs text-gray-400">Date</p>
          {renderEditableField('date', formatDate(incident.date))}
        </div>

        <div className="p-3 bg-gray-700 rounded-md">
          <p className="text-xs text-gray-400">Time</p>
          {renderEditableField('time', formatTime(incident.time))}
        </div>
      </div>

      {incident.evidenceUrls && incident.evidenceUrls.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Evidence Files:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {incident.evidenceUrls.map((url: string, index: number) => {
              const fileName = url.split('/').pop() || `file-${index + 1}`;
              const fileType = getFileType(url);

              return (
                <div key={index} className="bg-gray-700 rounded-lg overflow-hidden">
                  {fileType === 'image' && (
                    <a href={url} target="_blank" rel="noopener noreferrer" className="block">
                      <div className="aspect-square relative">
                        <img
                          src={url}
                          alt={fileName}
                          className="object-cover hover:opacity-90 transition-opacity"
                        />
                      </div>
                    </a>
                  )}

                  {fileType === 'video' && (
                    <div className="aspect-video">
                      <video
                        src={url}
                        controls
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {fileType === 'pdf' && (
                    <div className="p-4">
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 flex items-center gap-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0V2h10v2H6zm2 4a1 1 0 011-1h6a1 1 0 110 2H11a1 1 0 01-1-1zm-2 4a1 1 0 011-1h6a1 1 0 110 2H11a1 1 0 01-1-1zm2 4a1 1 0 100 2h4a1 1 0 100-2h-4z" clipRule="evenodd" />
                        </svg>
                        {fileName}
                      </a>
                    </div>
                  )}

                  {fileType === 'other' && (
                    <div className="p-4">
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 flex items-center gap-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                        {fileName}
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      <p>Reported: {new Date(incident.createdAt).toLocaleString()}</p>
      <p>Incident ID: {incident._id}</p>
    </div>
  );
}