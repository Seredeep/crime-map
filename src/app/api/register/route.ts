import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { hashPassword } from "@/lib/utils";

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

    // Conectamos a la base de datos
    const client = await clientPromise;
    const db = client.db();

    // Verificamos si el usuario ya existe
    const existingUser = await db.collection("users").findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "El email ya está registrado" },
        { status: 409 }
      );
    }

    // Hasheamos la contraseña
    const hashedPassword = await hashPassword(password);

    // Creamos el usuario
    const result = await db.collection("users").insertOne({
      name,
      email,
      password: hashedPassword,
      role: "user", // Rol por defecto
      enabled: false, // Usuario deshabilitado por defecto
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Usuario registrado correctamente. Tu cuenta está pendiente de aprobación por un administrador.",
      userId: result.insertedId.toString(),
    });
  } catch (error) {
    console.error("Error en el registro:", error);
    return NextResponse.json(
      { success: false, message: "Error al registrar el usuario" },
      { status: 500 }
    );
  }
} 