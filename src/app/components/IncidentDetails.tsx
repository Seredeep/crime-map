'use client';
import { Incident } from '@/lib/types';
import { formatDate, formatTime } from '@/lib/utils';
import Image from 'next/image';

interface IncidentDetailsProps {
  incident: Incident | null;
}

export default function IncidentDetails({ incident }: IncidentDetailsProps) {
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

  // Determine file type from URL
  const getFileType = (url: string) => {
    const extension = url.split('.').pop()?.toLowerCase();
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

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="flex items-start justify-between">
        <h3 className="text-xl font-semibold break-words pr-3">{incident.description}</h3>
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
            <p className="text-sm text-gray-300 break-words">{incident.address}</p>
            <div className="mt-1 text-xs text-gray-400">
              GPS: {incident.latitude.toFixed(6)}, {incident.longitude.toFixed(6)}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-gray-700 rounded-md">
          <p className="text-xs text-gray-400">Date</p>
          <p className="font-medium">{formatDate(incident.date)}</p>
        </div>

        <div className="p-3 bg-gray-700 rounded-md">
          <p className="text-xs text-gray-400">Time</p>
          <p className="font-medium">{formatTime(incident.time)}</p>
        </div>
      </div>

      {incident.evidenceUrls && incident.evidenceUrls.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">Evidence:</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {incident.evidenceUrls.map((url, index) => {
              const fileType = getFileType(url);
              
              return (
                <div key={index} className="bg-gray-700 rounded-md overflow-hidden relative">
                  {fileType === 'image' && (
                    <a href={url} target="_blank" rel="noopener noreferrer" className="block">
                      <div className="aspect-square relative">
                        <Image 
                          src={url} 
                          alt={`Evidence ${index + 1}`} 
                          fill
                          sizes="(max-width: 768px) 50vw, 33vw"
                          className="object-cover hover:opacity-90 transition-opacity" 
                        />
                      </div>
                    </a>
                  )}
                  
                  {fileType === 'video' && (
                    <div className="aspect-square">
                      <video 
                        src={url} 
                        controls 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  {fileType === 'pdf' && (
                    <a 
                      href={url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex flex-col items-center justify-center aspect-square p-3 hover:bg-gray-600 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                      </svg>
                      <span className="mt-2 text-xs text-center">PDF Document</span>
                    </a>
                  )}
                  
                  {fileType === 'other' && (
                    <a 
                      href={url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex flex-col items-center justify-center aspect-square p-3 hover:bg-gray-600 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                      </svg>
                      <span className="mt-2 text-xs text-center">File Attachment</span>
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="text-xs text-gray-400">
        <p>Reported: {new Date(incident.createdAt).toLocaleString()}</p>
        <p>Incident ID: {incident._id}</p>
      </div>
    </div>
  );
} 