
import React, { useState, useMemo, useEffect } from 'react';
import type { Card, CardSortingTask, CardSortingSubmission, User } from '../types';

const DonutChart: React.FC<{ percentage: number; size?: number }> = ({ percentage, size = 100 }) => {
    const strokeWidth = 10;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg className="transform -rotate-90" width={size} height={size}>
                <circle
                    className="text-text-secondary/30"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                <circle
                    className="text-green-500"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                    style={{ strokeDasharray: circumference, strokeDashoffset: offset, transition: 'stroke-dashoffset 0.5s ease-in-out' }}
                />
            </svg>
            <span className="absolute text-xl font-bold text-text-primary">{`${Math.round(percentage)}%`}</span>
        </div>
    );
};

const StatCard: React.FC<{ title: string; value?: string | number; children?: React.ReactNode }> = ({ title, value, children }) => (
    <div className="bg-main-bg/50 p-4 rounded-lg flex items-center justify-between">
        <div>
            <p className="text-text-secondary text-sm font-medium">{title}</p>
            {value !== undefined && <p className="text-2xl font-bold text-text-primary">{value}</p>}
        </div>
        {children}
    </div>
);

/**
 * Normaliza un nombre de categoría para una comparación consistente.
 * Convierte a minúsculas, quita espacios en blanco de los extremos y elimina acentos.
 * @param name El nombre de la categoría a normalizar.
 * @returns El nombre normalizado.
 */
const normalizeCategoryName = (name: string): string => {
    if (!name) return '';
    return name
        .toLowerCase()
        .trim()
        .normalize("NFD") // Separa caracteres como acentos de las letras
        .replace(/[\u0300-\u036f]/g, ""); // Elimina los caracteres de acentos
};


/**
 * Encuentra la clave de un grupo existente para un nombre de categoría dado.
 * La heurística es que si un nombre comienza con el otro, se consideran relacionados.
 * @param groups Mapa de los grupos existentes.
 * @param normalizedName Nombre ya normalizado (minúsculas, sin espacios, sin acentos) a buscar.
 * @returns La clave del grupo coincidente o nulo si no se encuentra.
 */
const findGroupKey = (groups: Map<string, any>, normalizedName: string): string | null => {
    for (const key of groups.keys()) {
        // Agrupa "usuario" con "usuarios", "propiedad" con "propiedades", etc.
        if (key.startsWith(normalizedName) || normalizedName.startsWith(key)) {
            return key;
        }
    }
    return null;
};


const TaskResults: React.FC<{ tasks: CardSortingTask[]; submissions: CardSortingSubmission[]; users: User[]; }> = ({ tasks, submissions, users }) => {
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(tasks.length > 0 ? tasks[0].id : null);
    const [activeTab, setActiveTab] = useState<'matrix' | 'cards' | 'categories'>('matrix');

    const resultsData = useMemo(() => {
        if (!selectedTaskId) return null;

        const task = tasks.find(t => t.id === selectedTaskId);
        if (!task) return null;

        const relevantSubmissions = submissions.filter(s => s.taskId === selectedTaskId);
        const assignedUsers = users.filter(u => u.role === 'user' && (u.assignedTasks || []).includes(selectedTaskId));
        const completionRate = assignedUsers.length > 0 ? (relevantSubmissions.length / assignedUsers.length) * 100 : 0;

        // Agreement Matrix Calculation
        const agreementMatrix = new Map<string, number>();
        relevantSubmissions.forEach(submission => {
            submission.results.forEach(category => {
                for (let i = 0; i < category.cards.length; i++) {
                    for (let j = i + 1; j < category.cards.length; j++) {
                        const cardAId = category.cards[i].id;
                        const cardBId = category.cards[j].id;
                        const key = [cardAId, cardBId].sort().join('--');
                        agreementMatrix.set(key, (agreementMatrix.get(key) || 0) + 1);
                    }
                }
            });
        });

        // Card Analysis with Intelligent Grouping
        const cardAnalysis = new Map<string, { categoryGroups: Map<string, { displayName: string; count: number; originalNames: string[] }> }>();
        task.cards.forEach(card => cardAnalysis.set(card.id, { categoryGroups: new Map() }));
        
        relevantSubmissions.forEach(submission => {
            submission.results.forEach(category => {
                if (!category.name || !category.name.trim()) return;

                const normalizedName = normalizeCategoryName(category.name);
                if (!normalizedName) return; // Saltar si el nombre normalizado está vacío

                category.cards.forEach(card => {
                    const analysis = cardAnalysis.get(card.id);
                    if (analysis) {
                        const groups = analysis.categoryGroups;
                        const groupKey = findGroupKey(groups, normalizedName);

                        if (groupKey) {
                            const group = groups.get(groupKey)!;
                            group.count++;
                            // Añadir el nombre original a la lista para el tooltip si no está ya presente.
                            // Esto colecciona todas las variaciones ("Usuario", "usuario", etc.)
                            if (!group.originalNames.includes(category.name)) {
                                group.originalNames.push(category.name);
                            }
                        } else {
                            // Crear un nuevo grupo usando el nombre normalizado como clave.
                            // El `displayName` será el primer nombre que el usuario introdujo para este grupo.
                            groups.set(normalizedName, {
                                displayName: category.name,
                                count: 1,
                                originalNames: [category.name],
                            });
                        }
                    }
                });
            });
        });


        return { task, relevantSubmissions, completionRate, agreementMatrix, cardAnalysis, assignedUsersCount: assignedUsers.length };

    }, [selectedTaskId, tasks, submissions, users]);

    const getAgreementPercentage = (cardAId: string, cardBId: string) => {
        if (!resultsData || resultsData.relevantSubmissions.length === 0) return 0;
        const key = [cardAId, cardBId].sort().join('--');
        const count = resultsData.agreementMatrix.get(key) || 0;
        return (count / resultsData.relevantSubmissions.length) * 100;
    };
    
    const getHeatmapColor = (percentage: number) => {
        if (percentage > 80) return 'bg-interactive/80';
        if (percentage > 60) return 'bg-interactive/60';
        if (percentage > 40) return 'bg-interactive/40';
        if (percentage > 20) return 'bg-interactive/20';
        if (percentage > 0) return 'bg-interactive/10';
        return 'bg-main-bg/50';
    }

    const renderTabs = () => (
        <div className="flex border-b border-text-secondary/20 mb-6">
            <button onClick={() => setActiveTab('matrix')} className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'matrix' ? 'border-b-2 border-interactive text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}>Matriz de Acuerdo</button>
            <button onClick={() => setActiveTab('cards')} className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'cards' ? 'border-b-2 border-interactive text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}>Análisis por Tarjeta</button>
        </div>
    );
    
    if (!resultsData) {
         return (
             <div className="text-center py-10 px-6 bg-card-bg rounded-lg">
                <p className="text-text-secondary text-lg">No hay tareas con resultados para mostrar.</p>
             </div>
         );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-grow">
                     <h3 className="text-2xl font-semibold text-text-primary">Resultados de Tareas</h3>
                     <p className="text-text-secondary">Selecciona una tarea para ver el análisis de los resultados.</p>
                </div>
                {tasks.length > 0 && (
                    <select onChange={e => setSelectedTaskId(e.target.value)} className="sm:w-1/3 p-3 bg-main-bg rounded-md border border-text-secondary/50 text-text-primary focus:ring-2 focus:ring-interactive" value={selectedTaskId || ''}>
                        {tasks.map(task => <option key={task.id} value={task.id}>{task.title}</option>)}
                    </select>
                )}
            </div>

            <div className="bg-main-bg/50 rounded-xl p-6 space-y-8">
                <h4 className="text-2xl font-bold text-interactive">{resultsData.task.title}</h4>

                {/* --- STATS --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard title="Tasa de Finalización">
                         <DonutChart percentage={resultsData.completionRate} size={80} />
                    </StatCard>
                    <StatCard title="Envíos Recibidos" value={resultsData.relevantSubmissions.length} />
                    <StatCard title="Participantes Asignados" value={resultsData.assignedUsersCount} />
                </div>
                
                {/* --- TABS --- */}
                {renderTabs()}
                
                {/* --- CONTENT --- */}
                {activeTab === 'matrix' && (
                    <div className="overflow-x-auto">
                        <h5 className="text-xl font-semibold mb-4 text-text-primary">Matriz de Acuerdo de Tarjetas</h5>
                        <div className="bg-main-bg/50 p-4 rounded-lg mb-6 border border-text-secondary/20">
                            <h6 className="font-semibold text-text-primary flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.333A4.002 4.002 0 0115.333 10a4 4 0 01-5.333 3.667V17a1 1 0 11-2 0v-2.333a4 4 0 01-4-3.667A4.002 4.002 0 016.667 6V3a1 1 0 011-1h2zm1.667 8c0 .92-.746 1.667-1.667 1.667S8.333 10.92 8.333 10s.746-1.667 1.667-1.667S11.667 9.08 11.667 10z" clipRule="evenodd" />
                                </svg>
                                ¿Cómo leer esta matriz?
                            </h6>
                            <p className="text-text-secondary/90 mt-2 text-sm">
                                Esta matriz muestra el acuerdo entre los participantes. Para leerla, elige una tarjeta en una fila y otra en una columna. La celda donde se cruzan muestra el porcentaje de participantes que colocaron <strong>ambas tarjetas en la misma categoría</strong>.
                            </p>
                            <p className="text-text-secondary mt-1 text-xs">
                                <span className="font-bold text-interactive">Un porcentaje alto (color intenso)</span> significa que la mayoría de los usuarios sienten que esas dos tarjetas pertenecen juntas.
                            </p>
                        </div>
                        <table className="w-full border-collapse text-xs text-left">
                            <thead>
                                <tr>
                                    <th className="sticky left-0 bg-card-bg p-2 border-b border-text-secondary/20 z-10"></th>
                                    {resultsData.task.cards.map(card => (
                                        <th key={card.id} className="p-2 border-b border-text-secondary/20 align-bottom">
                                            <span className="[writing-mode:vertical-lr] transform rotate-180 text-text-secondary font-normal whitespace-nowrap">{card.content}</span>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {resultsData.task.cards.map((rowCard, rowIndex) => (
                                    <tr key={rowCard.id} className="hover:bg-main-bg/50">
                                        <th className="sticky left-0 bg-card-bg p-2 border-b border-r border-text-secondary/20 text-text-secondary font-normal text-left z-10">{rowCard.content}</th>
                                        {resultsData.task.cards.map((colCard, colIndex) => {
                                            if (colIndex < rowIndex) {
                                                const percentage = getAgreementPercentage(rowCard.id, colCard.id);
                                                return (
                                                    <td key={colCard.id} className={`p-2 border-b border-text-secondary/20 text-center ${getHeatmapColor(percentage)}`}>
                                                        <span className="font-mono text-text-primary">{Math.round(percentage)}%</span>
                                                    </td>
                                                );
                                            }
                                            if (colIndex === rowIndex) {
                                                return <td key={colCard.id} className="p-2 border-b border-text-secondary/20 bg-text-secondary/20"></td>
                                            }
                                            return <td key={colCard.id} className="p-2 border-b border-text-secondary/20"></td>
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {activeTab === 'cards' && (
                     <div className="space-y-4">
                        <h5 className="text-xl font-semibold text-text-primary">Análisis de Ubicación por Tarjeta</h5>
                        <p className="text-text-secondary mb-4 text-sm italic">Nombres de categorías similares (ej. "Usuario", "usuarios", "Módulo") se agrupan automáticamente.</p>
                         {resultsData.task.cards.map(card => {
                             const analysis = resultsData.cardAnalysis.get(card.id);
                             if (!analysis) return null;
                             
                             const groups = Array.from(analysis.categoryGroups.values());
                             const sortedGroups = groups.sort((a, b) => b.count - a.count);
                             const totalPlacements = sortedGroups.reduce((sum, group) => sum + group.count, 0);

                             return (
                                 <div key={card.id} className="p-4 bg-main-bg/80 rounded-md">
                                     <p className="font-bold text-text-primary text-lg">{card.content}</p>
                                     {sortedGroups.length > 0 ? (
                                         <div className="mt-3 space-y-2">
                                             {sortedGroups.map(group => {
                                                  const percentage = totalPlacements > 0 ? (group.count / totalPlacements) * 100 : 0;
                                                  const tooltipText = `Agrupa: ${[...new Set(group.originalNames)].join(', ')}`;
                                                  return (
                                                     <div key={group.displayName} title={tooltipText}>
                                                        <div className="flex justify-between text-sm mb-1">
                                                            <span className="text-interactive">"{group.displayName}"</span>
                                                            <span className="text-text-secondary">{group.count} {group.count === 1 ? 'vez' : 'veces'} ({Math.round(percentage)}%)</span>
                                                        </div>
                                                        <div className="w-full bg-text-secondary/30 rounded-full h-2">
                                                            <div className="bg-interactive h-2 rounded-full" style={{ width: `${percentage}%` }}></div>
                                                        </div>
                                                     </div>
                                                  )
                                             })}
                                         </div>
                                     ) : (
                                         <p className="mt-2 text-text-secondary">Esta tarjeta no fue ubicada en ninguna categoría.</p>
                                     )}
                                 </div>
                             )
                         })}
                     </div>
                )}

            </div>
        </div>
    );
};

interface AdminPanelProps {
    tasks: CardSortingTask[];
    users: User[];
    onBack: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ tasks, users, onBack }) => {
    const [submissions, setSubmissions] = useState<CardSortingSubmission[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSubmissions = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const response = await fetch('https://marahe-backend.onrender.com/uxui/getUXUItasks');
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Error al obtener los resultados: ${response.status} ${response.statusText}. Detalles: ${errorText}`);
                }
                const data: CardSortingSubmission[] = await response.json();
                setSubmissions(data || []);

            } catch (err: any) {
                setError(err.message || 'No se pudieron cargar los resultados desde el servidor.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSubmissions();
    }, []);

    const renderResultsContent = () => {
        if (isLoading) {
            return (
                <div className="text-center py-10">
                    <p className="text-lg text-text-secondary animate-pulse">Cargando resultados desde el servidor...</p>
                </div>
            );
        }

        if (error) {
            return (
                 <div className="text-center py-10 px-6 bg-red-900/20 border border-red-700 rounded-lg">
                    <p className="font-semibold text-red-300 text-lg">Error al Cargar Resultados</p>
                    <p className="text-red-400 mt-2">{error}</p>
                </div>
            );
        }
        
        if (tasks.length === 0) {
            return (
                 <div className="text-center py-10 px-6 bg-card-bg rounded-lg">
                    <p className="text-text-secondary text-lg">No hay tareas creadas en el sistema.</p>
                </div>
            )
        }

        return <TaskResults tasks={tasks} submissions={submissions} users={users} />;
    };

    return (
        <div className="container mx-auto max-w-7xl py-10 px-4">
             <button onClick={onBack} className="mb-6 bg-card-bg hover:brightness-125 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                &larr; Volver al Panel
            </button>
            <div className="bg-card-bg rounded-xl shadow-lg p-6 sm:p-8">
                {renderResultsContent()}
            </div>
        </div>
    );
};
