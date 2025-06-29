
import React, { useState } from 'react';
import type { Card, CardSortingTask, CardSortingCategory, CardSortingSubmission } from '../types';

interface CardSortingTestProps {
    task: CardSortingTask;
    onSubmit: (submission: Omit<CardSortingSubmission, 'id' | 'userId' | 'completedAt'>) => void | Promise<void>;
    onBack: () => void;
}

export const CardSortingTest: React.FC<CardSortingTestProps> = ({ task, onSubmit, onBack }) => {
    const [unsortedCards, setUnsortedCards] = useState<Card[]>(task.cards);
    const [categories, setCategories] = useState<CardSortingCategory[]>([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [draggedCard, setDraggedCard] = useState<Card | null>(null);
    const [dragOverCategory, setDragOverCategory] = useState<string | null>(null);

    const isSubmitDisabled = unsortedCards.length > 0;

    const handleAddCategory = () => {
        if (newCategoryName.trim()) {
            setCategories([...categories, { id: `cat-${Date.now()}`, name: newCategoryName.trim(), cards: [] }]);
            setNewCategoryName('');
        }
    };

    const handleDragStart = (card: Card) => {
        setDraggedCard(card);
    };

    const handleDragOver = (e: React.DragEvent, categoryId: string | 'unsorted') => {
        e.preventDefault();
        setDragOverCategory(categoryId);
    };

    const handleDrop = (categoryId: string | null) => {
        if (!draggedCard) return;

        // Remove from original location
        setUnsortedCards(unsortedCards.filter(c => c.id !== draggedCard.id));
        setCategories(categories.map(cat => ({...cat, cards: cat.cards.filter(c => c.id !== draggedCard.id)})));
        
        // Add to new location
        if(categoryId) { // Dropped on a category
            setCategories(categories.map(cat => cat.id === categoryId ? { ...cat, cards: [...cat.cards, draggedCard] } : cat));
        } else { // Dropped on unsorted pile
            setUnsortedCards(prev => [...prev, draggedCard]);
        }

        setDraggedCard(null);
        setDragOverCategory(null);
    };

    const handleSubmit = () => {
        if (isSubmitDisabled) return;
        
        const submission: Omit<CardSortingSubmission, 'id' | 'userId' | 'completedAt'> = {
            taskId: task.id,
            results: categories.filter(c => c.cards.length > 0),
        };
        onSubmit(submission);
    };
    
    return (
        <div className="container mx-auto max-w-7xl py-10 px-4 space-y-8">
            <div className="flex justify-between items-center">
                <button onClick={onBack} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                    &larr; Volver al Panel
                </button>
                 <div title={isSubmitDisabled ? "Debes clasificar todas las tarjetas para poder enviar la tarea." : ''}>
                    <button 
                        onClick={handleSubmit} 
                        disabled={isSubmitDisabled}
                        className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed enabled:hover:bg-green-700"
                    >
                        Enviar Tarea
                    </button>
                </div>
            </div>
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
                <h1 className="text-3xl font-bold text-white">{task.title}</h1>
                <p className="mt-2 text-gray-300">{task.description}</p>
            </div>

            {/* --- Instructions --- */}
            <div className="bg-gray-700/50 p-5 rounded-lg border border-gray-600">
                <h3 className="text-xl font-semibold text-white">¿Cómo crear categorías?</h3>
                <p className="text-gray-300 mt-2">
                    Imagina que estás organizando un armario. Una categoría es como un cajón o estante al que le pones una etiqueta.
                    Escribe un nombre para tu grupo en el campo de abajo (ej. "Gestión de Clientes"), pulsa "Añadir Categoría" y luego arrastra las tarjetas que pertenezcan a ese grupo.
                </p>
                <p className="text-gray-400 mt-2 text-sm italic">
                    ¡No hay respuestas correctas o incorrectas! Organízalo como te parezca más lógico.
                </p>
            </div>


            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Unsorted Cards Column */}
                <div 
                    className={`bg-gray-800/50 p-4 rounded-xl space-y-3 transition-all ${dragOverCategory === 'unsorted' ? 'bg-indigo-900/50 ring-2 ring-indigo-500' : ''}`}
                    onDragOver={(e) => handleDragOver(e, 'unsorted')}
                    onDrop={() => handleDrop(null)}
                    onDragLeave={() => setDragOverCategory(null)}
                >
                    <h2 className="text-xl font-semibold text-center text-white">Tarjetas sin Clasificar ({unsortedCards.length})</h2>
                    <div className="p-2 space-y-2 min-h-[200px] bg-gray-900/30 rounded-lg">
                        {unsortedCards.map(card => (
                            <div key={card.id} draggable onDragStart={() => handleDragStart(card)} className="bg-gray-700 p-3 rounded-md cursor-grab active:cursor-grabbing shadow-md text-gray-200">
                                {card.content}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Categories Column */}
                <div className="md:col-span-2 space-y-6">
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={newCategoryName} 
                            onChange={e => setNewCategoryName(e.target.value)} 
                            onKeyPress={e => e.key === 'Enter' && handleAddCategory()}
                            placeholder="Escribe un nombre y pulsa 'Añadir'" 
                            className="flex-grow p-3 bg-gray-700 rounded-md border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <button onClick={handleAddCategory} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md font-semibold transition-colors">Añadir Categoría</button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {categories.map(category => (
                            <div 
                                key={category.id} 
                                className={`bg-gray-800 p-4 rounded-xl space-y-3 transition-all ${dragOverCategory === category.id ? 'bg-indigo-900/50 ring-2 ring-indigo-500' : ''}`}
                                onDragOver={(e) => handleDragOver(e, category.id)}
                                onDrop={() => handleDrop(category.id)}
                                onDragLeave={() => setDragOverCategory(null)}
                            >
                                <h3 className="text-lg font-bold text-center text-indigo-300">{category.name}</h3>
                                <div className="p-2 space-y-2 min-h-[150px] bg-gray-900/30 rounded-lg">
                                    {category.cards.map(card => (
                                        <div key={card.id} draggable onDragStart={() => handleDragStart(card)} className="bg-gray-700 p-3 rounded-md cursor-grab active:cursor-grabbing shadow-md text-gray-200">
                                            {card.content}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
