import { firestore } from "@/lib/config/db/firebase";
import clientPromise from "@/lib/config/db/mongodb";
import { getDefaultRole } from "@/lib/config/roles";
import { hashPassword } from "@/lib/utils";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // Obtenemos los datos del formulario
    const { email, password } = await request.json();

    // Validamos los datos
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "MISSING_REQUIRED_DATA" },
        { status: 400 }
      );
    }

    // Validamos el formato del email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: "INVALID_EMAIL_FORMAT" },
        { status: 400 }
      );
    }

    // Validamos la longitud de la contraseña
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: "PASSWORD_TOO_SHORT" },
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
        { success: false, message: "EMAIL_ALREADY_REGISTERED" },
        { status: 409 }
      );
    }

    // Hasheamos la contraseña
    const hashedPassword = await hashPassword(password);

    // Creamos el usuario en MongoDB
    const mongoUserResult = await db.collection("users").insertOne({
      email,
      password: hashedPassword,
      role: getDefaultRole(),
      enabled: true, // Usuario habilitado por defecto
      createdAt: new Date(),
      // Los campos `name`, `onboarded` y `chatId` se manejarán en el onboarding
    });

    const userId = mongoUserResult.insertedId.toString();

    // Creamos el usuario correspondiente en Firestore
    await firestore.collection("users").doc(userId).set({
      email,
      password: hashedPassword, // Considerar si Firebase Auth maneja las contraseñas
      role: getDefaultRole(),
      enabled: true, // Usuario habilitado por defecto
      createdAt: new Date(),
      onboarded: false, // Nuevo campo para indicar si el usuario ha completado el onboarding
      chatId: null, // Nuevo campo para almacenar el chatId del barrio
    });

    return NextResponse.json({
      success: true,
      message: "USER_REGISTERED_SUCCESS",
      userId: userId,
    });
  } catch (error) {
    console.error("Error en el registro:", error);
    return NextResponse.json(
      { success: false, message: "REGISTRATION_ERROR" },
      { status: 500 }
    );
  }
}
