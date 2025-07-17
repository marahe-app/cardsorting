
import React, { useState, useEffect } from 'react';
import type { User, CardSortingTask, CardSortingSubmission } from './types';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { CardSortingTest } from './components/CardSortingTest';
import { AdminPanel } from './components/AdminPanel';
import { SUBMISSIONS_KEY, INITIAL_SUBMISSIONS, CURRENT_USER_KEY } from './constants';

// JSON data is no longer imported directly. It will be fetched.

type View = 'loading' | 'login' | 'dashboard' | 'card_sorting' | 'admin_panel' | 'error';

const App: React.FC = () => {
    // Static data will be loaded via fetch
    const [users, setUsers] = useState<User[]>([]);
    const [tasks, setTasks] = useState<CardSortingTask[]>([]);
    
    // Dynamic data from localStorage
    const [submissions, setSubmissions] = useState<CardSortingSubmission[]>([]);

    // App state
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [currentView, setCurrentView] = useState<View>('loading');
    const [activeTask, setActiveTask] = useState<CardSortingTask | null>(null);
    const [error, setError] = useState<string | null>(null);


    // Load all initial data (static JSON and dynamic localStorage) on mount
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                // 1. Fetch static data (users and tasks) from JSON files
                const [usersResponse, tasksResponse] = await Promise.all([
                    fetch('./users.json'),
                    fetch('./tasks.json')
                ]);

                if (!usersResponse.ok || !tasksResponse.ok) {
                    throw new Error('No se pudieron cargar los datos iniciales de la aplicación (users.json o tasks.json).');
                }

                const usersData: User[] = await usersResponse.json();
                const tasksData: CardSortingTask[] = await tasksResponse.json();

                setUsers(usersData);
                setTasks(tasksData);

                // 2. Load dynamic data from localStorage now that static data is available
                const savedSubmissions = localStorage.getItem(SUBMISSIONS_KEY);
                setSubmissions(savedSubmissions ? JSON.parse(savedSubmissions) : INITIAL_SUBMISSIONS);
                
                // 3. Check for a logged-in user and set the initial view
                const savedUserKey = localStorage.getItem(CURRENT_USER_KEY);
                if (savedUserKey) {
                    const savedUser = usersData.find(u => u.id === savedUserKey);
                    if (savedUser) {
                        setCurrentUser(savedUser);
                        setCurrentView('dashboard');
                    } else {
                        // Clean up invalid key and show login
                        localStorage.removeItem(CURRENT_USER_KEY);
                        setCurrentView('login');
                    }
                } else {
                    setCurrentView('login');
                }
            } catch (err: any) {
                console.error("Error al cargar los datos de la aplicación:", err);
                setError(err.message || 'Ocurrió un error inesperado. Revisa la consola para más detalles.');
                setCurrentView('error');
            }
        };

        loadInitialData();
    }, []); // Empty dependency array ensures this runs only once on mount

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

    const handleSelectTask = (task: CardSortingTask) => {
        setActiveTask(task);
        setCurrentView('card_sorting');
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

    const handleTaskSubmit = async (submissionData: Omit<CardSortingSubmission, 'id' | 'userId' | 'completedAt'>) => {
        if (!currentUser) return;

        const newSubmission: CardSortingSubmission = {
            ...submissionData,
            id: `sub-${Date.now()}`,
            userId: currentUser.id,
            completedAt: new Date().toISOString(),
        };

        // 1. Update state and localStorage immediately for instant UI feedback and data persistence.
        const updatedSubmissions = [...submissions, newSubmission];
        setSubmissions(updatedSubmissions);
        localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(updatedSubmissions));
        
        // 2. Attempt to send data to the backend and provide user feedback.
        try {
            const response = await fetch('https://marahe-backend.onrender.com/uxui/sendUXUItask', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                 // The backend expects a list of submissions.
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
            // 3. Navigate back to the dashboard regardless of the API call result.
            handleBackToPanel();
        }
    };

    const renderContent = () => {
        switch (currentView) {
            case 'loading':
                return <div className="min-h-screen bg-main-bg flex items-center justify-center text-text-primary"><p className="text-xl animate-pulse">Cargando aplicación...</p></div>;
            case 'error':
                 return (
                    <div className="min-h-screen bg-main-bg flex items-center justify-center p-4">
                        <div className="w-full max-w-md p-8 space-y-4 bg-red-900/50 border border-red-700 rounded-2xl text-center">
                            <h1 className="text-2xl font-bold text-text-primary">Error en la Aplicación</h1>
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
                />;
            case 'card_sorting':
                if (!activeTask) {
                    handleBackToPanel();
                    return null;
                }
                return <CardSortingTest task={activeTask} onSubmit={handleTaskSubmit} onBack={handleBackToPanel} />;
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

    return <div className="bg-main-bg min-h-screen">{renderContent()}</div>;
};

export default App;
