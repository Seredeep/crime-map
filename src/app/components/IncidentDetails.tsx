'use client';
import { Incident } from '@/lib/types';
import { formatDate, formatTime } from '@/lib/utils';
import Image from 'next/image';
import { useImageModal } from '@/lib/ImageModalContext';
import { JSX } from 'react';

interface IncidentDetailsProps {
  incident: Incident | null;
}

export default function IncidentDetails({ incident }: IncidentDetailsProps) {
  const { openModal } = useImageModal();

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

  // Determine file type from MIME type
  const getFileTypeFromMime = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return 'image';
    } else if (mimeType.startsWith('video/')) {
      return 'video';
    } else if (mimeType === 'application/pdf') {
      return 'pdf';
    } else {
      return 'other';
    }
  };

  // Function to directly download a file (for non-image files)
  const downloadFile = async (url: string, filename: string) => {
    try {
      // Make sure the URL is properly formatted
      const validUrl = url.startsWith('http') ? url : `${window.location.origin}${url.startsWith('/') ? '' : '/'}${url}`;

      // For same-origin files we can use the simple approach
      if (validUrl.startsWith(window.location.origin)) {
        const link = document.createElement('a');
        link.href = validUrl;
        link.download = filename || 'download';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // For cross-origin files, we need to fetch and create a blob URL
        const response = await fetch(validUrl, { mode: 'cors' });
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename || 'download';
        document.body.appendChild(link);
        link.click();

        // Clean up
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
        }, 100);
      }
    } catch (error) {
      console.error('Download failed:', error);
      // Fall back to opening in new tab
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // Helper function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Helper function to get file type from URL
  const getFileType = (url: string): string => {
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

  // Helper function to get the appropriate icon for a file type
  const getFileIcon = (fileType: string): JSX.Element => {
    switch (fileType) {
      case 'image':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
        );
      case 'video':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm12.553 1.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
          </svg>
        );
      case 'pdf':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <div className="space-y-5 animate-fadeIn p-4">
      <div className="flex items-start justify-between">
        <h3 className="text-xl font-semibold break-words pr-3">{incident.description || 'No description'}</h3>
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
            <p className="text-sm text-gray-300 break-words">{incident.address || 'No address provided'}</p>
            {incident.latitude !== undefined && incident.longitude !== undefined && (
              <div className="mt-1 text-xs text-gray-400">
                GPS: {incident.latitude.toFixed(6)}, {incident.longitude.toFixed(6)}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-gray-700 rounded-md">
          <p className="text-xs text-gray-400">Date</p>
          <p className="font-medium">{incident.date ? formatDate(incident.date) : 'Not specified'}</p>
        </div>

        <div className="p-3 bg-gray-700 rounded-md">
          <p className="text-xs text-gray-400">Time</p>
          <p className="font-medium">{incident.time ? formatTime(incident.time) : 'Not specified'}</p>
        </div>
      </div>

      {/* Evidence section */}
      {((incident.evidenceUrls && incident.evidenceUrls.length > 0) ||
        (incident.evidenceFiles && incident.evidenceFiles.length > 0)) && (
          <div>
            <h4 className="text-sm font-medium mb-2">Evidence:</h4>

            {/* Handle evidenceUrls if present */}
            {incident.evidenceUrls && incident.evidenceUrls.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                {incident.evidenceUrls.map((url, index) => {
                  const fileType = url ? getFileType(url) : 'other';
                  const fileName = url.split('/').pop() || `file-${index + 1}`;

                  if (fileType === 'image') {
                    return (
                      <div key={`url-${index}`} className="bg-gray-700 rounded-md overflow-hidden relative">
                        <div className="cursor-pointer aspect-square relative">
                          <div className="w-full h-full relative">
                            <Image
                              src={url}
                              alt={`Evidence ${index + 1}`}
                              fill={true}
                              sizes="(max-width: 768px) 100vw, 33vw"
                              className="object-cover hover:opacity-90 transition-opacity cursor-pointer"
                              onClick={() => openModal(url)}
                              id={`img-${index}`}
                            />
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 py-1 px-2 flex justify-between items-center">
                            <span className="text-xs text-white">Click to view</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(url, '_blank', 'noopener,noreferrer');
                              }}
                              className="text-blue-400 hover:text-blue-300"
                              aria-label="Open image in new tab"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  } else if (fileType === 'video') {
                    return (
                      <div key={`url-${index}`} className="bg-gray-700 rounded-md overflow-hidden relative">
                        <div className="aspect-square relative">
                          <video
                            src={url}
                            controls
                            className="w-full h-full object-cover"
                            onError={() => console.error(`Failed to load video: ${url}`)}
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 py-1 px-2 flex justify-between items-center">
                            <span className="text-xs text-white">Video</span>
                            <button
                              onClick={() => downloadFile(url, fileName)}
                              className="text-blue-400 hover:text-blue-300"
                              aria-label="Download video"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  } else {
                    // PDF or other file types - show download button only
                    return (
                      <div key={`url-${index}`} className="bg-gray-700 rounded-md overflow-hidden relative">
                        <button
                          onClick={() => downloadFile(url, fileName)}
                          className="flex flex-col items-center justify-center aspect-square p-3 hover:bg-gray-600 transition-colors w-full"
                          aria-label={`Download ${fileType} file`}
                        >
                          {fileType === 'pdf' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                            </svg>
                          )}
                          <span className="mt-2 text-xs text-center">Download {fileType.toUpperCase()}</span>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mt-1 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    );
                  }
                })}
              </div>
            )}

            {/* Handle evidenceFiles from your API */}
            {incident.evidenceFiles && incident.evidenceFiles.length > 0 && (
              <div className="bg-gray-700 rounded-md p-3">
                <ul className="space-y-2">
                  {incident.evidenceFiles.map((file, index) => {
                    const fileType = file.type ? getFileTypeFromMime(file.type) : 'other';
                    const fileIcon = getFileIcon(fileType);

                    // For image files, display them directly
                    if (fileType === 'image' && file.url) {
                      return (
                        <li key={`file-${index}`} className="block">
                          <div className="mt-2">
                            <div className="cursor-pointer relative aspect-video w-full max-w-lg mx-auto">
                              <Image
                                src={file.url as string}
                                alt={file.name}
                                fill={true}
                                sizes="(max-width: 768px) 100vw, 33vw"
                                className="object-contain rounded-md hover:opacity-90 transition-opacity" 
                                onClick={() => openModal(file.url as string)}
                              />
                            </div>
                          </div>
                          <div className="text-center mt-1">
                            <span className="text-xs text-gray-400 ml-2">({formatFileSize(file.size)})</span>
                          </div>
                        </li>
                      );
                    } else {
                      // For non-image files, show download option
                      return (
                        <li key={`file-${index}`} className="flex items-center group">
                          <span className="mr-2">{fileIcon}</span>
                          <span className="text-sm truncate flex-1">{file.name}</span>
                          <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">({formatFileSize(file.size)})</span>
                          {/* Download button */}
                          {file.url && (
                            <button
                              onClick={() => downloadFile(file.url as string, file.name)}
                              className="ml-2 opacity-70 hover:opacity-100 transition-opacity"
                              aria-label={`Download ${file.name}`}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400 hover:text-blue-300" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </button>
                          )}
                        </li>
                      );
                    }
                  })}
                </ul>
              </div>
            )}
          </div>
        )}

      <div className="text-xs text-gray-400">
        <p>Reported: {incident.createdAt ? new Date(incident.createdAt).toLocaleString() : 'Unknown'}</p>
        <p>Incident ID: {incident._id || 'Not assigned'}</p>
      </div>
    </div>
  );
}