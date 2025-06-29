import React, { useMemo } from 'react';
import type { User, CardSortingTask, CardSortingSubmission } from '../types';

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
        <div className={`p-6 rounded-xl shadow-lg transition-all transform ${isCompleted ? 'bg-gray-700/50' : 'bg-gray-800 hover:bg-gray-700/80 hover:-translate-y-1'}`}>
            <div className="flex justify-between items-start">
                <h3 className="text-xl font-bold text-white">{task.title}</h3>
                {isCompleted && <span className="text-xs font-bold bg-green-500/80 text-white py-1 px-3 rounded-full">COMPLETADA</span>}
            </div>
            <p className="mt-2 text-gray-400">{task.description}</p>
            {!isCompleted && (
                <button 
                    onClick={() => onSelectTask(task)}
                    className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                    Iniciar Tarea
                </button>
            )}
        </div>
    )
}

export const Dashboard: React.FC<DashboardProps> = ({ user, tasks, submissions, onSelectTask, onShowAdminPanel, onLogout }) => {
  const userTasks = useMemo(() => {
    // Admins can see all tasks to review results, regardless of assignment.
    if (user.role === 'admin') {
      return tasks;
    }
    // Regular users only see tasks specifically assigned to them.
    return tasks.filter(task => (user.assignedTasks || []).includes(task.id));
  }, [user, tasks]);

  const completedTaskIds = new Set(submissions.filter(s => s.userId === user.id).map(s => s.taskId));
  const pendingTasks = userTasks.filter(t => !completedTaskIds.has(t.id));
  const completedTasks = userTasks.filter(t => completedTaskIds.has(t.id));

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800/50 backdrop-blur-sm sticky top-0 z-10">
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <span className="font-bold text-2xl text-white">UX-Sort</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-300">¡Bienvenido, {user.firstName}!</span>
              {user.role === 'admin' && (
                <button onClick={onShowAdminPanel} className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                  Panel de Admin
                </button>
              )}
              <button onClick={onLogout} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                Cerrar Sesión
              </button>
            </div>
          </div>
        </nav>
      </header>

      <main className="container mx-auto p-8">
        <div className="space-y-10">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-white mb-6">Tareas Pendientes</h2>
                {pendingTasks.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pendingTasks.map(task => (
                            <TaskCard key={task.id} task={task} isCompleted={false} onSelectTask={onSelectTask} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 px-6 bg-gray-800 rounded-lg">
                        <p className="text-gray-400 text-lg">No tienes tareas pendientes. ¡Buen trabajo!</p>
                    </div>
                )}
            </div>

            {completedTasks.length > 0 && (
                 <div>
                    <h2 className="text-3xl font-bold tracking-tight text-white mb-6">Tareas Completadas</h2>
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