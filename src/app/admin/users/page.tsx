'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { Role, ROLES } from '@/lib/config/roles';

interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  enabled: boolean;
  createdAt: string;
}

interface ErrorResponse {
  message: string;
}

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    // Verify if user is admin
    if (session?.user?.role !== 'admin') {
      router.push('/');
      return;
    }

    fetchUsers();
  }, [session, router]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users');
      
      if (!response.ok) {
        throw new Error('Error al cargar usuarios');
      }
      
      const data = await response.json();
      setUsers(data.users);
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar la lista de usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      setLoading(true);
      setSuccessMessage('');
      setError('');
      
      const response = await fetch('/api/admin/users/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          enabled: !currentStatus,
        }),
      });

      if (!response.ok) {
        const data = await response.json() as ErrorResponse;
        throw new Error(data.message || 'Error al actualizar el estado del usuario');
      }

      // Update local state
      setUsers(users.map(user => 
        user._id === userId 
          ? { ...user, enabled: !currentStatus } 
          : user
      ));
      
      setSuccessMessage(`Usuario ${!currentStatus ? 'habilitado' : 'deshabilitado'} correctamente`);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Error al actualizar el estado del usuario');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: Role) => {
    try {
      setLoading(true);
      setSuccessMessage('');
      setError('');
      
      const response = await fetch('/api/admin/users/role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          role: newRole,
        }),
      });

      if (!response.ok) {
        const data = await response.json() as ErrorResponse;
        throw new Error(data.message || 'Error al actualizar el rol del usuario');
      }

      // Update local state
      setUsers(users.map(user => 
        user._id === userId 
          ? { ...user, role: newRole } 
          : user
      ));
      
      setSuccessMessage(`Rol de usuario actualizado correctamente a ${newRole}`);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Error al actualizar el rol del usuario');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold mb-6">Administración de Usuarios</h1>
          
          {error && (
            <div className="mb-4 p-3 bg-red-500 text-white rounded-md">
              {error}
            </div>
          )}
          
          {successMessage && (
            <div className="mb-4 p-3 bg-green-500 text-white rounded-md">
              {successMessage}
            </div>
          )}
          
          {loading && (
            <div className="flex justify-center my-8">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
            </div>
          )}
          
          {!loading && users.length === 0 && (
            <div className="bg-gray-800 rounded-lg p-4">
              No hay usuarios registrados.
            </div>
          )}
          
          {!loading && users.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-gray-800 rounded-lg overflow-hidden">
                <thead className="border-b border-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left">Nombre</th>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">Rol</th>
                    <th className="px-4 py-3 text-left">Estado</th>
                    <th className="px-4 py-3 text-left">Fecha de registro</th>
                    <th className="px-4 py-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id} className="border-b border-gray-700">
                      <td className="px-4 py-3">{user.name}</td>
                      <td className="px-4 py-3">{user.email}</td>
                      <td className="px-4 py-3">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user._id, e.target.value as Role)}
                          className="bg-gray-700 text-white rounded px-2 py-1"
                          disabled={loading}
                        >
                          {Object.values(ROLES).map((role) => (
                            <option key={role} value={role}>
                              {role.charAt(0).toUpperCase() + role.slice(1)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${user.enabled ? 'bg-green-600' : 'bg-red-600'}`}>
                          {user.enabled ? 'Activo' : 'Pendiente'}
                        </span>
                      </td>
                      <td className="px-4 py-3">{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleToggleUserStatus(user._id, user.enabled)}
                          className={`px-3 py-1 rounded text-sm ${user.enabled ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                          disabled={loading}
                        >
                          {user.enabled ? 'Deshabilitar' : 'Habilitar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
} 