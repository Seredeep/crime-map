import { getDefaultRole, Role } from "@/lib/config/roles";
import clientPromise from "@/lib/mongodb";
import { verifyPassword } from "@/lib/utils";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { ObjectId } from "mongodb";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

// Extender los tipos de Next-Auth
declare module 'next-auth' {
  interface User {
    id: string;
    role: Role;
    enabled?: boolean;
    onboarded?: boolean;
    neighborhood?: string;
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
      enabled?: boolean;
      onboarded?: boolean;
      createdAt?: Date;
      neighborhood?: string;
      notificationsEnabled?: boolean;
      privacyPublic?: boolean;
      autoLocationEnabled?: boolean;
      profileImage?: string;
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: Role;
    enabled?: boolean;
    onboarded?: boolean;
    createdAt?: Date;
    neighborhood?: string;
    notificationsEnabled?: boolean;
    privacyPublic?: boolean;
    autoLocationEnabled?: boolean;
    profileImage?: string;
  }
}

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  // @ts-expect-error MongoDBAdapter types are not compatible with NextAuth types
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: getDefaultRole(),
          enabled: false,
        };
      },
    }),
    CredentialsProvider({
      name: "Credenciales",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "usuario@ejemplo.com" },
        password: { label: "Contraseña", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const client = await clientPromise;
          const db = client.db();

          const user = await db.collection("users").findOne({
            email: credentials.email,
          });

          if (!user || !(await verifyPassword(credentials.password, user.password))) {
            return null;
          }

          if (user.enabled === false) {
            throw new Error("Tu cuenta está pendiente de aprobación por un administrador.");
          }

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role || getDefaultRole(),
            enabled: user.enabled,
            onboarded: user.onboarded || user.isOnboarded || false,
            createdAt: user.createdAt || new Date(),
            neighborhood: user.neighborhood || null,
            notificationsEnabled: user.notificationsEnabled ?? true,
            privacyPublic: user.privacyPublic ?? false,
            autoLocationEnabled: user.autoLocationEnabled ?? true,
            profileImage: user.profileImage ?? undefined,
          };
        } catch (error) {
          console.error("Error durante la autenticación:", error);
          throw error;
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const client = await clientPromise;
        const db = client.db();

        const dbUser = await db.collection("users").findOne({
          email: user.email,
        });

        if (dbUser && dbUser.enabled === false) {
          return false;
        }

        // Actualizar el objeto user con los datos de la base de datos
        if (dbUser) {
          user.onboarded = dbUser.onboarded || dbUser.isOnboarded || false;
          user.enabled = dbUser.enabled;
          user.role = dbUser.role || getDefaultRole();
          user.neighborhood = dbUser.neighborhood || null;
          user.notificationsEnabled = dbUser.notificationsEnabled ?? true;
          user.privacyPublic = dbUser.privacyPublic ?? false;
          user.autoLocationEnabled = dbUser.autoLocationEnabled ?? true;
          user.profileImage = dbUser.profileImage ?? undefined;
        }
      }

      return true;
    },
        async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.enabled = user.enabled;
        token.onboarded = user.onboarded;
        token.neighborhood = user.neighborhood;
        token.notificationsEnabled = user.notificationsEnabled;
        token.privacyPublic = user.privacyPublic;
        token.autoLocationEnabled = user.autoLocationEnabled;
        token.profileImage = user.profileImage;
      }

      // Actualizar token cuando se actualiza la sesión
      if (trigger === "update" && session) {
        if (session.onboarded !== undefined) {
          token.onboarded = session.onboarded;
        }
        if (session.notificationsEnabled !== undefined) {
          token.notificationsEnabled = session.notificationsEnabled;
        }
        if (session.privacyPublic !== undefined) {
          token.privacyPublic = session.privacyPublic;
        }
        if (session.autoLocationEnabled !== undefined) {
          token.autoLocationEnabled = session.autoLocationEnabled;
        }
        if (session.profileImage !== undefined) {
          token.profileImage = session.profileImage;
        }

        // Refrescar datos del usuario desde la base de datos
        if (token.id) {
          try {
            const client = await clientPromise;
            const db = client.db();
            const dbUser = await db.collection("users").findOne({
              _id: new ObjectId(token.id)
            });

            if (dbUser) {
              token.onboarded = dbUser.onboarded || dbUser.isOnboarded || false;
              token.enabled = dbUser.enabled;
              token.role = dbUser.role || token.role;
              token.createdAt = dbUser.createdAt || token.createdAt;
              token.neighborhood = dbUser.neighborhood || token.neighborhood;
              token.notificationsEnabled = dbUser.notificationsEnabled ?? token.notificationsEnabled;
              token.privacyPublic = dbUser.privacyPublic ?? token.privacyPublic;
              token.autoLocationEnabled = dbUser.autoLocationEnabled ?? token.autoLocationEnabled;
              token.profileImage = dbUser.profileImage ?? token.profileImage;
            }
          } catch (error) {
            console.error('Error refreshing user data:', error);
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session?.user && token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.enabled = token.enabled;
        session.user.onboarded = token.onboarded;
        session.user.createdAt = token.createdAt;
        session.user.neighborhood = token.neighborhood;
        session.user.notificationsEnabled = token.notificationsEnabled;
        session.user.privacyPublic = token.privacyPublic;
        session.user.autoLocationEnabled = token.autoLocationEnabled;
        session.user.profileImage = token.profileImage;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};
