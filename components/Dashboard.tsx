
import React, { useMemo } from 'react';
import type { User, CardSortingTask, CardSortingSubmission } from '../types';
import Logo from '../assets/logo.svg'; // Adjust path based on your actual file location

interface DashboardProps {
  user: User;
  tasks: CardSortingTask[];
  submissions: CardSortingSubmission[];
  onSelectTask: (task: CardSortingTask) => void;
  onShowAdminPanel: () => void;
  onLogout: () => void;
}

const TaskCard: React.FC<{task: CardSortingTask; isCompleted: boolean; onSelectTask: (task: CardSortingTask) => void}> = ({task, isCompleted, onSelectTask}) => {
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
                    className="mt-4 bg-interactive hover:bg-interactive-darker text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                    Iniciar Tarea
                </button>
            )}
        </div>
    )
}

export const Dashboard: React.FC<DashboardProps> = ({ user, tasks, submissions, onSelectTask, onShowAdminPanel, onLogout }) => {
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
      <header className="bg-card-bg/50 backdrop-blur-sm sticky top-0 z-10">
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <img src={Logo} alt="UX-Sort Logo" className="h-8 w-auto" />
              <span className="font-bold text-2xl text-text-primary ml-3">LCG UX Platform</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-text-secondary">¡Bienvenido, {user.firstName}!</span>
              {user.role === 'admin' && (
                <button onClick={onShowAdminPanel} className="bg-interactive hover:bg-interactive-darker text-white font-bold py-2 px-4 rounded-lg transition-colors">
                  Panel de Admin
                </button>
              )}
              <button onClick={onLogout} className="bg-card-bg hover:brightness-125 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                Cerrar Sesión
              </button>
            </div>
          </div>
        </nav>
      </header>

      <main className="container mx-auto p-8">
        <div className="space-y-10">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-text-primary mb-6">Tareas Pendientes</h2>
                {pendingTasks.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pendingTasks.map(task => (
                            <TaskCard key={task.id} task={task} isCompleted={false} onSelectTask={onSelectTask} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 px-6 bg-card-bg rounded-lg">
                        <p className="text-text-secondary text-lg">No tienes tareas pendientes. ¡Buen trabajo!</p>
                    </div>
                )}
            </div>

            {completedTasks.length > 0 && (
                 <div>
                    <h2 className="text-3xl font-bold tracking-tight text-text-primary mb-6">Tareas Completadas</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {completedTasks.map(task => (
                            <TaskCard key={task.id} task={task} isCompleted={true} onSelectTask={onSelectTask} />
                        ))}
                    </div>
                </div>
            )}
        </div>
      </main>
    </div>
  );
};