'use client';
import React from 'react';
import Image from 'next/image';
import { useImageModal } from '../../lib/ImageModalContext';

export default function ImageModal() {
  const { isOpen, closeModal, currentImage } = useImageModal();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 z-[1000] flex items-center justify-center p-4 animate-fadeIn"
      onClick={closeModal}
    >
      <div className="relative max-w-4xl max-h-screen w-full h-full flex items-center justify-center">
        {/* Close button */}
        <button
          className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-2 text-white z-10"
          onClick={(e) => {
            e.stopPropagation();
            closeModal();
          }}
          aria-label="Close image preview"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Image preview */}
        {currentImage && (
          <div className="relative w-full h-full flex items-center justify-center">
            <Image
              src={currentImage}
              alt="Image preview"
              fill
              sizes="100vw"
              className="object-contain"
              onError={() => {
                console.error(`Failed to load image in modal: ${currentImage}`);
              }}
            />
          </div>
        )}

      </div>
    </div>
  );
}