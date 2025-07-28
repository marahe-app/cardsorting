
import React, { useMemo } from 'react';
import type { User, Task, Submission } from '../types';
import Logo from '../assets/logo.svg'; // Adjust path based on your actual file location


interface DashboardProps {
  user: User;
  tasks: Task[];
  submissions: Submission[];
  onSelectTask: (task: Task) => void;
  onShowAdminPanel: () => void;
  onLogout: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const TaskCard: React.FC<{task: Task; isCompleted: boolean; onSelectTask: (task: Task) => void}> = ({task, isCompleted, onSelectTask}) => {
    return (
        <div className={`p-6 rounded-xl shadow-lg transition-all transform ${isCompleted ? 'bg-card-bg/50' : 'bg-card-bg hover:brightness-110'}`}>
            <div className="flex justify-between items-start">
                <h3 className="text-xl font-bold text-text-primary">{task.title}</h3>
                {isCompleted && <span className="text-xs font-bold bg-green-500/80 text-white py-1 px-3 rounded-full">COMPLETADA</span>}
            </div>
            <p className="mt-2 text-text-secondary">{task.description}</p>
            {!isCompleted && (
                <button 
                    onClick={() => onSelectTask(task)}
                    className="mt-4 bg-interactive hover:bg-interactive-darker text-text-primary font-bold py-2 px-4 rounded-lg transition-colors"
                >
                    Iniciar Tarea
                </button>
            )}
        </div>
    )
}

export const Dashboard: React.FC<DashboardProps> = ({ user, tasks, submissions, onSelectTask, onShowAdminPanel, onLogout, theme, toggleTheme }) => {
  const userTasks = useMemo(() => {
    if (user.role === 'admin') {
      return tasks;
    }
    return tasks.filter(task => (user.assignedTasks || []).includes(task.id));
  }, [user, tasks]);

  const completedTaskIds = new Set(submissions.filter(s => s.userId === user.id).map(s => s.taskId));
  const pendingTasks = userTasks.filter(t => !completedTaskIds.has(t.id));
  const completedTasks = userTasks.filter(t => completedTaskIds.has(t.id));

  return (
    <div className="min-h-screen bg-main-bg text-text-primary">
      <header className="bg-card-bg/50 backdrop-blur-sm sticky top-0 z-10 border-b border-text-secondary/10">
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <img src={Logo} alt="UX/UI Platform Logo" className="h-8 w-auto" />
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <span className="hidden md:inline text-text-secondary text-sm">¡Bienvenido, {user.firstName}!</span>
              
              {/* <button onClick={toggleTheme} className="p-2 rounded-full text-text-secondary hover:text-text-primary hover:bg-main-bg/50" title={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}>
                {theme === 'dark' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.333A4.002 4.002 0 0115.333 10a4 4 0 01-5.333 3.667V17a1 1 0 11-2 0v-2.333a4 4 0 01-4-3.667A4.002 4.002 0 016.667 6V3a1 1 0 011-1h2zm1.667 8c0 .92-.746 1.667-1.667 1.667S8.333 10.92 8.333 10s.746-1.667 1.667-1.667S11.667 9.08 11.667 10z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button> */}

              {user.role === 'admin' && (
                <button
                  onClick={onShowAdminPanel}
                  className="bg-interactive/80 hover:bg-interactive text-text-primary font-bold text-sm py-2 px-3 rounded-md transition-colors"
                >
                  Panel de Admin
                </button>
              )}
              <button
                onClick={onLogout}
                className="bg-main-bg hover:brightness-125 text-text-secondary font-bold text-sm py-2 px-3 rounded-md transition-colors"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </nav>
      </header>
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-3xl font-bold mb-6 text-text-primary">Mis Tareas</h2>
        
        {/* Pending Tasks */}
        <div className="mb-12">
            <h3 className="text-xl font-semibold mb-4 text-interactive">Pendientes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingTasks.length > 0 ? (
                    pendingTasks.map(task => (
                        <TaskCard key={task.id} task={task} isCompleted={false} onSelectTask={onSelectTask} />
                    ))
                ) : (
                    <div className="text-text-secondary bg-card-bg/50 rounded-lg p-6 md:col-span-3">¡Felicidades! No tienes tareas pendientes.</div>
                )}
            </div>
        </div>

        {/* Completed Tasks */}
        <div>
            <h3 className="text-xl font-semibold mb-4 text-text-secondary">Completadas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {completedTasks.length > 0 ? (
                    completedTasks.map(task => (
                        <TaskCard key={task.id} task={task} isCompleted={true} onSelectTask={onSelectTask} />
                    ))
                ) : (
                    <div className="text-text-secondary bg-card-bg/50 rounded-lg p-6 md:col-span-3">Aún no has completado ninguna tarea.</div>
                )}
            </div>
        </div>
      </main>
    </div>
  );
};
