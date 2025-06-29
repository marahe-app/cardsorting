
import React, { useState } from 'react';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
  users: User[];
}

export const Login: React.FC<LoginProps> = ({ onLogin, users }) => {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const foundUser = users.find(u => u.id === key.trim());
    if (foundUser) {
      onLogin(foundUser);
    } else {
      setError('Clave inválida. Por favor, inténtalo de nuevo.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-2xl shadow-2xl">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white tracking-tight">UX-Sort</h1>
          <p className="mt-2 text-gray-400">Ingresa tu clave de acceso única para comenzar.</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="user-key" className="sr-only">
                Clave de Acceso
              </label>
              <input
                id="user-key"
                name="key"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-md relative block w-full px-4 py-3 bg-gray-700 border border-gray-600 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg"
                placeholder="Clave de Acceso"
                value={key}
                onChange={(e) => {
                  setKey(e.target.value);
                  setError('');
                }}
              />
            </div>
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-lg font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 transition-colors duration-200"
            >
              Iniciar Sesión
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
