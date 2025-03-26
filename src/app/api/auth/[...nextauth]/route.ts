import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import clientPromise from "@/lib/mongodb";
import { compare } from "bcryptjs";
import { NextAuthOptions } from "next-auth";
import { JWT } from "next-auth/jwt";
import { MongoDBAdapter } from "@auth/mongodb-adapter";

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

// Configuramos NextAuth
export const authOptions: NextAuthOptions = {
  // Páginas personalizadas
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  // Adaptador para MongoDB
  adapter: MongoDBAdapter(clientPromise) as any,
  // Proveedores de autenticación
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
          enabled: false, // Usuario deshabilitado por defecto
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
          // Conectamos a la base de datos
          const client = await clientPromise;
          const db = client.db();
          
          // Buscamos al usuario por email
          const user = await db.collection("users").findOne({
            email: credentials.email,
          });
          
          // Si no encontramos al usuario o la contraseña no coincide
          if (!user || !(await compare(credentials.password, user.password))) {
            return null;
          }

          // Verificamos si el usuario está habilitado
          if (user.enabled === false) {
            throw new Error("Tu cuenta está pendiente de aprobación por un administrador.");
          }
          
          // Devolvemos el usuario sin la contraseña
          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role || "user",
            enabled: user.enabled,
          };
        } catch (error) {
          console.error("Error durante la autenticación:", error);
          throw error; // Propagamos el error para que se muestre en la interfaz
        }
      }
    })
  ],
  // Callbacks para personalizar el comportamiento
  callbacks: {
    async signIn({ user, account }) {
      // Si el usuario se está registrando con Google, verificamos si está habilitado
      if (account?.provider === "google") {
        const client = await clientPromise;
        const db = client.db();
        
        const dbUser = await db.collection("users").findOne({
          email: user.email,
        });
        
        // Si el usuario existe y no está habilitado, rechazamos el inicio de sesión
        if (dbUser && dbUser.enabled === false) {
          return false;
        }
      }
      
      return true;
    },
    jwt({ token, user }) {
      // Añadimos información adicional al token si el usuario acaba de iniciar sesión
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.enabled = user.enabled;
      }
      return token;
    },
    session({ session, token }) {
      // Añadimos información adicional a la sesión
      if (session?.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.enabled = token.enabled;
      }
      return session;
    },
  },
  // Configuración de la sesión
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  // Secreto para firmar las cookies
  secret: process.env.NEXTAUTH_SECRET,
};

// Creamos el manejador para la API
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }; 