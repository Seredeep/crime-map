import { getDefaultRole, Role } from "@/lib/config/roles";
import clientPromise from "@/lib/mongodb";
import { verifyPassword } from "@/lib/utils";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
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
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: Role;
    enabled?: boolean;
    onboarded?: boolean;
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
      }

      // Actualizar token cuando se actualiza la sesión
      if (trigger === "update" && session) {
        if (session.onboarded !== undefined) {
          token.onboarded = session.onboarded;
        }

        // Refrescar datos del usuario desde la base de datos
        if (token.id) {
          try {
            const client = await clientPromise;
            const db = client.db();
            const dbUser = await db.collection("users").findOne({
              _id: new (require('mongodb')).ObjectId(token.id)
            });

            if (dbUser) {
              token.onboarded = dbUser.onboarded || dbUser.isOnboarded || false;
              token.enabled = dbUser.enabled;
              token.role = dbUser.role || token.role;
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
