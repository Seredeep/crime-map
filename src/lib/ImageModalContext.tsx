'use client';
import React, { createContext, useState, useContext, ReactNode } from 'react';

interface ImageModalContextType {
  openModal: (imageUrl: string) => void;
  closeModal: () => void;
  currentImage: string | null;
  isOpen: boolean;
}

const ImageModalContext = createContext<ImageModalContextType | undefined>(undefined);

export const ImageModalProvider = ({ children }: { children: ReactNode }) => {
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const openModal = (imageUrl: string) => {
    setCurrentImage(imageUrl);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setTimeout(() => setCurrentImage(null), 300); // Clear the image after animation
  };

  return (
    <ImageModalContext.Provider value={{ openModal, closeModal, currentImage, isOpen }}>
      {children}
    </ImageModalContext.Provider>
  );
};

export const useImageModal = () => {
  const context = useContext(ImageModalContext);
  if (context === undefined) {
    throw new Error('useImageModal must be used within an ImageModalProvider');
  }
  return context;
};