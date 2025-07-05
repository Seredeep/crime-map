import { getDefaultRole } from "@/lib/config/roles";
import { firestore } from "@/lib/firebase";
import clientPromise from "@/lib/mongodb";
import { hashPassword } from "@/lib/utils";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // Obtenemos los datos del formulario
    const { name, email, password } = await request.json();

    // Validamos los datos
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: "Faltan datos requeridos" },
        { status: 400 }
      );
    }

    // Validamos el formato del email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: "Formato de email inválido" },
        { status: 400 }
      );
    }

    // Validamos la longitud de la contraseña
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: "La contraseña debe tener al menos 8 caracteres" },
        { status: 400 }
      );
    }

    // Conectamos a MongoDB y Firestore
    const client = await clientPromise;
    const db = client.db();

    // Verificamos si el usuario ya existe en MongoDB
    const existingMongoUser = await db.collection("users").findOne({ email });
    if (existingMongoUser) {
      return NextResponse.json(
        { success: false, message: "El email ya está registrado" },
        { status: 409 }
      );
    }

    // Hasheamos la contraseña
    const hashedPassword = await hashPassword(password);

    // Creamos el usuario en MongoDB
    const mongoUserResult = await db.collection("users").insertOne({
      name,
      email,
      password: hashedPassword,
      role: getDefaultRole(),
      enabled: false, // Usuario deshabilitado por defecto
      createdAt: new Date(),
      // Los campos `onboarded` y `chatId` se manejarán en el onboarding
    });

    const userId = mongoUserResult.insertedId.toString();

    // Creamos el usuario correspondiente en Firestore
    await firestore.collection("users").doc(userId).set({
      name,
      email,
      password: hashedPassword, // Considerar si Firebase Auth maneja las contraseñas
      role: getDefaultRole(),
      enabled: false, // Usuario deshabilitado por defecto
      createdAt: new Date(),
      onboarded: false, // Nuevo campo para indicar si el usuario ha completado el onboarding
      chatId: null, // Nuevo campo para almacenar el chatId del barrio
    });

    return NextResponse.json({
      success: true,
      message: "Usuario registrado correctamente. Tu cuenta está pendiente de aprobación por un administrador.",
      userId: userId,
    });
  } catch (error) {
    console.error("Error en el registro:", error);
    return NextResponse.json(
      { success: false, message: "Error al registrar el usuario" },
      { status: 500 }
    );
  }
}
