'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const router = useRouter();

  // Redirect to incidents page (main view)
  useEffect(() => {
    router.replace('/incidents');
  }, [router]);

  return null;
}
