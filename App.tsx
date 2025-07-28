
import React, { useState, useEffect } from 'react';
import type { User, Task, Submission, CardSortingSubmission, AlternativesSubmission } from './types';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { CardSortingTest } from './components/CardSortingTest';
import { AlternativesTest } from './components/AlternativesTest';
import { AdminPanel } from './components/AdminPanel';
import { SUBMISSIONS_KEY, INITIAL_SUBMISSIONS, CURRENT_USER_KEY } from './constants';

// Import JSON data directly. This makes them part of the build process.
import usersData from './users.json';
import tasksData from './tasks.json';

type View = 'loading' | 'login' | 'dashboard' | 'card_sorting' | 'admin_panel' | 'error';
type Theme = 'light' | 'dark';

const App: React.FC = () => {
    // Static data is now initialized directly from imports
    const [users, setUsers] = useState<User[]>(usersData);
    const [tasks, setTasks] = useState<Task[]>(tasksData);
    
    // Dynamic data from localStorage
    const [submissions, setSubmissions] = useState<Submission[]>([]);

    // App state
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [currentView, setCurrentView] = useState<View>('loading');
    const [activeTask, setActiveTask] = useState<CardSortingTask | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'dark');

    // Effect for handling theme changes
    useEffect(() => {
        if (theme === 'light') {
            document.documentElement.classList.add('light');
        } else {
            document.documentElement.classList.remove('light');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);
    // Load dynamic state from localStorage on initial mount
    useEffect(() => {
        try {
            // Load dynamic submissions from localStorage
            const savedSubmissions = localStorage.getItem(SUBMISSIONS_KEY);
            setSubmissions(savedSubmissions ? JSON.parse(savedSubmissions) : INITIAL_SUBMISSIONS);
            
            // Check for a logged-in user in localStorage
            const savedUserKey = localStorage.getItem(CURRENT_USER_KEY);
            if (savedUserKey) {
                // usersData is available directly from the import
                const savedUser = usersData.find(u => u.id === savedUserKey);
                if (savedUser) {
                    setCurrentUser(savedUser);
                    setCurrentView('dashboard');
                    return; // Exit early if user is found
                }
            }

            setCurrentView('login');
        } catch (err: any) {
            console.error("Error al cargar los datos guardados de la aplicación:", err);
            setError(err.message || 'Ocurrió un error inesperado. Revisa la consola para más detalles.');
            setCurrentView('error');
        }
    }, []);

     const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };


    const handleLogin = (user: User) => {
        setCurrentUser(user);
        localStorage.setItem(CURRENT_USER_KEY, user.id);
        setCurrentView('dashboard');
    };

    const handleLogout = () => {
        setCurrentUser(null);
        setActiveTask(null);
        localStorage.removeItem(CURRENT_USER_KEY);
        setCurrentView('login');
    };

    const handleSelectTask = (task: Task) => {
        setActiveTask(task);
        setCurrentView('task');
    };

    const handleShowAdminPanel = () => {
        if (currentUser?.role === 'admin') {
            setCurrentView('admin_panel');
        }
    };

    const handleBackToPanel = () => {
        setActiveTask(null);
        setCurrentView('dashboard');
    };

    const handleTaskSubmit = async (submissionData: Omit<CardSortingSubmission, 'id' | 'userId' | 'completedAt'> | Omit<AlternativesSubmission, 'id' | 'userId' | 'completedAt'>) => {
        if (!currentUser) return;

        const newSubmission: Submission = {
            ...submissionData,
            id: `sub-${Date.now()}`,
            userId: currentUser.id,
            completedAt: new Date().toISOString(),
        };

        const updatedSubmissions = [...submissions, newSubmission];
        setSubmissions(updatedSubmissions);
        localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(updatedSubmissions));
        
        try {
            const response = await fetch('https://ingresatubackendaqui.com/uxui/sendUXUItask', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify([newSubmission]),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`El servidor respondió con un error: ${response.status} ${response.statusText}. Detalles: ${errorText}`);
            }
            
            alert('¡Tarea enviada con éxito! Tus resultados han sido guardados y enviados.');
            console.log('Resultados enviados al backend con éxito.');

        } catch (error) {
            console.error('Error al enviar los resultados de la tarea al backend:', error);
            alert('Tarea guardada localmente. Hubo un error al enviar tus resultados al servidor. Tu progreso se ha guardado en este dispositivo, pero es posible que el administrador no lo vea.');
        } finally {
            handleBackToPanel();
        }
    };

    const renderContent = () => {
        switch (currentView) {
            case 'loading':
                return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white"><p className="text-xl animate-pulse">Cargando aplicación...</p></div>;
            case 'error':
                 return (
                    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
                        <div className="w-full max-w-md p-8 space-y-4 bg-red-900/50 border border-red-700 rounded-2xl text-center">
                            <h1 className="text-2xl font-bold text-white">Error en la Aplicación</h1>
                            <p className="text-red-200">{error}</p>
                            <p className="text-red-300 text-sm">Ocurrió un error al iniciar la aplicación. Intenta limpiar el almacenamiento de tu navegador y recargar la página.</p>
                        </div>
                    </div>
                );
            case 'login':
                return <Login onLogin={handleLogin} users={users} />;
            case 'dashboard':
                 if (!currentUser) return <Login onLogin={handleLogin} users={users} />;
                return <Dashboard
                    user={currentUser}
                    tasks={tasks}
                    submissions={submissions}
                    onSelectTask={handleSelectTask}
                    onShowAdminPanel={handleShowAdminPanel}
                    onLogout={handleLogout}
                    theme={theme}
                    toggleTheme={toggleTheme}
                />;
            case 'task':
                if (!activeTask) {
                    handleBackToPanel();
                    return null;
                }
                if (activeTask.type === 'card_sorting') {
                    return <CardSortingTest task={activeTask} onSubmit={handleTaskSubmit} onBack={handleBackToPanel} />;
                }
                 if (activeTask.type === 'alternatives') {
                    return <AlternativesTest task={activeTask} onSubmit={handleTaskSubmit} onBack={handleBackToPanel} />;
                }
                handleBackToPanel();
                return null;
            case 'admin_panel':
                 if (!currentUser) return <Login onLogin={handleLogin} users={users} />;
                return <AdminPanel
                    tasks={tasks}
                    users={users}
                    onBack={handleBackToPanel}
                />;
            default:
                 return <Login onLogin={handleLogin} users={users} />;
        }
    };

    return <div className="bg-gray-900 min-h-screen">{renderContent()}</div>;
};

export default App;