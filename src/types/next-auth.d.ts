import 'next-auth';
import type { Role } from '../lib/config/roles';

declare module 'next-auth' {
  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role: Role;
    enabled: boolean;
    onboarded?: boolean;
    neighborhood?: string;
    country?: string;
    city?: string;
    notificationsEnabled?: boolean;
    privacyPublic?: boolean;
    autoLocationEnabled?: boolean;
    profileImage?: string;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: Role;
      enabled: boolean;
      onboarded?: boolean;
      neighborhood?: string;
      country?: string;
      city?: string;
      notificationsEnabled?: boolean;
      privacyPublic?: boolean;
      autoLocationEnabled?: boolean;
      profileImage?: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role: Role;
    enabled: boolean;
    onboarded?: boolean;
    neighborhood?: string;
    country?: string;
    city?: string;
    notificationsEnabled?: boolean;
    privacyPublic?: boolean;
    autoLocationEnabled?: boolean;
    profileImage?: string;
  }
}
