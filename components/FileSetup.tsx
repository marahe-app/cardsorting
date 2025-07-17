
import React from 'react';

interface FileSetupProps {
    onCreate: () => void;
    onOpen: () => void;
}

export const FileSetup: React.FC<FileSetupProps> = ({ onCreate, onOpen }) => {
    return (
        <div className="min-h-screen bg-main-bg flex items-center justify-center p-4">
            <div className="w-full max-w-2xl p-8 space-y-6 bg-card-bg rounded-2xl shadow-2xl text-center">
                <h1 className="text-4xl font-bold text-text-primary tracking-tight">Bienvenido a LCG UX Platform</h1>
                <p className="text-text-secondary text-lg">
                    Para funcionar sin conexión y mantener tus datos seguros en tu propio dispositivo, esta aplicación guarda toda la información (usuarios, tareas y resultados) en un único archivo de datos (`.json`).
                </p>
                <p className="text-text-secondary/80">
                    Tus datos son privados y nunca se envían a la nube.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                    <button
                        onClick={onCreate}
                        className="w-full sm:w-auto flex justify-center py-3 px-6 border border-transparent text-lg font-medium rounded-md text-primary-action-text bg-primary-action-bg hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-card-bg focus:ring-interactive transition-colors duration-200"
                    >
                        Crear Nuevo Archivo de Datos
                    </button>
                    <button
                        onClick={onOpen}
                        className="w-full sm:w-auto flex justify-center py-3 px-6 border border-text-secondary/50 text-lg font-medium rounded-md text-text-primary bg-main-bg hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-card-bg focus:ring-interactive transition-colors duration-200"
                    >
                        Abrir Archivo Existente
                    </button>
                </div>
                 <p className="text-xs text-text-secondary/50 pt-4">
                    Si tu navegador no es compatible con la API de Acceso al Sistema de Archivos, se utilizará el almacenamiento local del navegador como alternativa.
                </p>
            </div>
        </div>
    );
};