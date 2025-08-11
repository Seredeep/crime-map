import clientPromise from "@/lib/config/db/mongodb";
import { getDefaultRole, Role } from "@/lib/config/roles";
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
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role: Role;
    enabled?: boolean;
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
      enabled?: boolean;
      onboarded?: boolean;
      createdAt?: Date;
      neighborhood?: string;
      country?: string;
      city?: string;
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
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role: Role;
    enabled?: boolean;
    onboarded?: boolean;
    createdAt?: Date;
    neighborhood?: string;
    country?: string;
    city?: string;
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
          enabled: true,
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
            throw new Error("ACCOUNT_PENDING_APPROVAL");
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
            country: user.country || null,
            city: user.city || null,
            // keep only privacyPublic default here
            notificationsEnabled: user.notificationsEnabled,
            privacyPublic: user.privacyPublic ?? true,
            autoLocationEnabled: user.autoLocationEnabled,
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
          user.name = dbUser.name || user.name;
          user.email = dbUser.email || user.email;
          user.image = dbUser.image || user.image;
          user.onboarded = dbUser.onboarded || dbUser.isOnboarded || false;
          user.enabled = dbUser.enabled;
          user.role = dbUser.role || getDefaultRole();
          user.neighborhood = dbUser.neighborhood || null;
          user.notificationsEnabled = dbUser.notificationsEnabled;
          user.privacyPublic = dbUser.privacyPublic ?? true;
          user.autoLocationEnabled = dbUser.autoLocationEnabled;
          user.profileImage = dbUser.profileImage ?? undefined;

          // Ensure defaults are persisted if fields are missing
          const defaultsToPersist: Record<string, boolean> = {};
          if (dbUser.privacyPublic === undefined) defaultsToPersist.privacyPublic = true;
          if (Object.keys(defaultsToPersist).length > 0) {
            try {
              await db.collection("users").updateOne(
                { _id: new ObjectId(dbUser._id) },
                { $set: defaultsToPersist }
              );
            } catch (e) {
              console.error('Error setting default user settings', e);
            }
          }
        }
      }

      return true;
    },
        async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.image = user.image;
        token.role = user.role;
        token.enabled = user.enabled;
        token.onboarded = user.onboarded;
        token.neighborhood = user.neighborhood;
        token.country = user.country;
        token.city = user.city;
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
              token.name = dbUser.name || token.name;
              token.email = dbUser.email || token.email;
              token.image = dbUser.image || token.image;
              token.onboarded = dbUser.onboarded || dbUser.isOnboarded || false;
              token.enabled = dbUser.enabled;
              token.role = dbUser.role || token.role;
              token.createdAt = dbUser.createdAt || token.createdAt;
              token.neighborhood = dbUser.neighborhood || token.neighborhood;
              token.country = dbUser.country || token.country;
              token.city = dbUser.city || token.city;
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
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = token.image;
        session.user.role = token.role;
        session.user.enabled = token.enabled;
        session.user.onboarded = token.onboarded;
        session.user.createdAt = token.createdAt;
        session.user.neighborhood = token.neighborhood;
        session.user.country = token.country;
        session.user.city = token.city;
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
