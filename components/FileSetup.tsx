import React from 'react';

interface FileSetupProps {
    onCreate: () => void;
    onOpen: () => void;
}

export const FileSetup: React.FC<FileSetupProps> = ({ onCreate, onOpen }) => {
    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl p-8 space-y-6 bg-gray-800 rounded-2xl shadow-2xl text-center">
                <h1 className="text-4xl font-bold text-white tracking-tight">Bienvenido a UX-Sort</h1>
                <p className="text-gray-300 text-lg">
                    Para funcionar sin conexión y mantener tus datos seguros en tu propio dispositivo, esta aplicación guarda toda la información (usuarios, tareas y resultados) en un único archivo de datos (`.json`).
                </p>
                <p className="text-gray-400">
                    Tus datos son privados y nunca se envían a la nube.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                    <button
                        onClick={onCreate}
                        className="w-full sm:w-auto flex justify-center py-3 px-6 border border-transparent text-lg font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 transition-colors duration-200"
                    >
                        Crear Nuevo Archivo de Datos
                    </button>
                    <button
                        onClick={onOpen}
                        className="w-full sm:w-auto flex justify-center py-3 px-6 border border-gray-600 text-lg font-medium rounded-md text-white bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500 transition-colors duration-200"
                    >
                        Abrir Archivo Existente
                    </button>
                </div>
                 <p className="text-xs text-gray-500 pt-4">
                    Si tu navegador no es compatible con la API de Acceso al Sistema de Archivos, se utilizará el almacenamiento local del navegador como alternativa.
                </p>
            </div>
        </div>
    );
};
