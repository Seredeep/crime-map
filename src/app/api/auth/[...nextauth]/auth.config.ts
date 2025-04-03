import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import clientPromise from "@/lib/mongodb";
import { compare } from "bcryptjs";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { MongoClient } from "mongodb";

// Extender los tipos de Next-Auth
declare module 'next-auth' {
  interface User {
    id: string;
    role: string;
    enabled?: boolean;
  }
  
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
      enabled?: boolean;
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    enabled?: boolean;
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
          role: "user",
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
          
          if (!user || !(await compare(credentials.password, user.password))) {
            return null;
          }

          if (user.enabled === false) {
            throw new Error("Tu cuenta está pendiente de aprobación por un administrador.");
          }
          
          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role || "user",
            enabled: user.enabled,
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
      }
      
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.enabled = user.enabled;
      }
      return token;
    },
    session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.enabled = token.enabled;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
}; 