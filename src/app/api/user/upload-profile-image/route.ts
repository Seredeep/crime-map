import { firestore } from '@/lib/firebase';
import clientPromise from '@/lib/mongodb';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '../../auth/[...nextauth]/auth.config';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const profileImage = formData.get('profileImage') as File | null;

    if (!profileImage) {
      return NextResponse.json({ message: 'No se proporcionó ninguna imagen' }, { status: 400 });
    }

    const userId = session.user.id;
    const fileExtension = profileImage.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExtension}`;

    const supabaseServer = createSupabaseServerClient();
    const { data, error: uploadError } = await supabaseServer.storage
      .from('profile-images') // Nombre del bucket de Supabase Storage
      .upload(fileName, profileImage, { contentType: profileImage.type });

    if (uploadError) {
      console.error('Error al subir la imagen a Supabase:', uploadError);
      return NextResponse.json({ message: 'Error al subir la imagen' }, { status: 500 });
    }

    const publicUrl = supabaseServer.storage.from('profile-images').getPublicUrl(fileName).data.publicUrl;

    // Actualizar la URL de la imagen en MongoDB
    const client = await clientPromise;
    const db = client.db();

    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: { profileImage: publicUrl } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: 'Usuario no encontrado en la base de datos' }, { status: 404 });
    }

    // Actualizar la URL de la imagen en Firestore
    await firestore.collection('users').doc(userId).set(
      { profileImage: publicUrl },
      { merge: true }
    );

    return NextResponse.json({ message: 'Imagen de perfil actualizada con éxito', profileImageUrl: publicUrl }, { status: 200 });

  } catch (error) {
    console.error('Error en la carga de imagen de perfil:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor al procesar la imagen' },
      { status: 500 }
    );
  }
}
