
import React, { useState, useCallback } from 'react';
import type { Card, CardSortingTask, CardSortingCategory, CardSortingSubmission, Submission } from '../types';

interface CardSortingTestProps {
    task: CardSortingTask;
    onSubmit: (submission: Omit<CardSortingSubmission, 'id' | 'userId' | 'completedAt'>) => void | Promise<void>;
    onBack: () => void;
}

export const CardSortingTest: React.FC<CardSortingTestProps> = ({ task, onSubmit, onBack }) => {
    const [unsortedCards, setUnsortedCards] = useState<Card[]>(task.cards);
    const [categories, setCategories] = useState<CardSortingCategory[]>([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [selectedCard, setSelectedCard] = useState<Card | null>(null);

    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
    const [editingCategoryName, setEditingCategoryName] = useState('');
    const [isInstructionsOpen, setIsInstructionsOpen] = useState(true);

    const isSubmitDisabled = unsortedCards.length > 0;

    const handleAddCategory = () => {
        if (newCategoryName.trim()) {
            setCategories([...categories, { id: `cat-${Date.now()}`, name: newCategoryName.trim(), cards: [] }]);
            setNewCategoryName('');
        }
    };

    const handleDeleteCategory = (categoryId: string) => {
        const categoryToDelete = categories.find(c => c.id === categoryId);
        if (!categoryToDelete) return;

        if (categoryToDelete.cards.some(c => c.id === selectedCard?.id)) {
            setSelectedCard(null);
        }

        setUnsortedCards(prevUnsorted => [...prevUnsorted, ...categoryToDelete.cards].sort((a, b) => a.content.localeCompare(b.content)));
        setCategories(prevCategories => prevCategories.filter(c => c.id !== categoryId));
    };

    const handleStartRename = (category: CardSortingCategory) => {
        setEditingCategoryId(category.id);
        setEditingCategoryName(category.name);
    };

    const handleConfirmRename = () => {
        if (editingCategoryId && editingCategoryName.trim()) {
            setCategories(cats => cats.map(c =>
                c.id === editingCategoryId ? { ...c, name: editingCategoryName.trim() } : c
            ));
        }
        setEditingCategoryId(null);
        setEditingCategoryName('');
    };

    const handleCardClick = (clickedCard: Card, source: 'unsorted' | string) => {
        if (selectedCard?.id === clickedCard.id) {
            setSelectedCard(null); 
        } else {
            setSelectedCard(clickedCard);
        }
    };

    const handlePlaceCard = useCallback((targetCategoryId: string | 'unsorted') => {
        if (!selectedCard) return;

        let newUnsorted = unsortedCards.filter(c => c.id !== selectedCard.id);
        let newCategories = categories.map(cat => ({
            ...cat,
            cards: cat.cards.filter(c => c.id !== selectedCard.id)
        }));

        if (targetCategoryId === 'unsorted') {
            newUnsorted = [...newUnsorted, selectedCard].sort((a,b) => a.content.localeCompare(b.content));
        } else {
            const categoryIndex = newCategories.findIndex(c => c.id === targetCategoryId);
            if (categoryIndex > -1) {
                newCategories[categoryIndex].cards.push(selectedCard);
            }
        }
        
        setUnsortedCards(newUnsorted);
        setCategories(newCategories);
        setSelectedCard(null);
    }, [selectedCard, unsortedCards, categories]);


    const handleSubmit = () => {
        if (isSubmitDisabled) return;
        
        const submission: Omit<CardSortingSubmission, 'id' | 'userId' | 'completedAt'> = {
            type: 'card_sorting',
            taskId: task.id,
            results: categories.filter(c => c.cards.length > 0 && c.name.trim() !== ''),
        };
        onSubmit(submission);
    };
    
    const renderCard = (card: Card, source: 'unsorted' | string) => (
         <div 
            key={card.id}
            onClick={() => handleCardClick(card, source)}
            className={`bg-card-bg p-3 rounded-md cursor-pointer shadow-md text-text-primary w-full transition-all duration-200 ${selectedCard?.id === card.id ? 'ring-2 ring-offset-2 ring-offset-card-bg/50 ring-interactive' : 'hover:bg-main-bg'}`}
        >
            {card.content}
        </div>
    );

    return (
        <div className="container mx-auto max-w-7xl py-10 px-4 space-y-8 pb-32 sm:pb-24">
            {selectedCard && (
                 <div className="fixed bottom-0 left-0 right-0 bg-card-bg p-4 shadow-2xl border-t-2 border-interactive z-50 flex items-center justify-between gap-4 animate-slide-up">
                    <div>
                        <p className="text-text-secondary text-sm">Tarjeta Seleccionada:</p>
                        <p className="font-bold text-text-primary text-lg">{selectedCard.content}</p>
                    </div>
                    <button
                        onClick={() => setSelectedCard(null)}
                        className="bg-main-bg hover:brightness-125 text-text-primary font-bold py-2 px-3 rounded-lg transition-colors flex items-center gap-2"
                        title="Cancelar selección"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span className="hidden sm:inline">Cancelar</span>
                    </button>
                </div>
            )}
            
            <div className="flex justify-between items-center">
                <button onClick={onBack} className="bg-card-bg hover:brightness-125 text-text-primary font-bold py-2 px-4 rounded-lg transition-colors">
                    &larr; Volver al Panel
                </button>
            </div>
            <header className="bg-card-bg p-6 rounded-xl shadow-lg">
                <h1 className="text-3xl font-bold text-text-primary">{task.title}</h1>
                <p className="mt-2 text-text-secondary">{task.description}</p>
            </header>
             <div className="bg-card-bg/50 p-5 rounded-lg border border-text-secondary/20">
                <button
                    onClick={() => setIsInstructionsOpen(!isInstructionsOpen)}
                    className="w-full flex justify-between items-center text-left text-text-primary"
                    aria-expanded={isInstructionsOpen}
                    aria-controls="instructions-content"
                >
                    <h3 className="text-xl font-semibold">Instrucciones</h3>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-6 w-6 text-text-secondary transition-transform transform ${isInstructionsOpen ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
                {isInstructionsOpen && (
                    <div id="instructions-content" className="text-text-secondary mt-4 space-y-2 prose prose-invert max-w-none prose-p:my-1 prose-li:my-0">
                         <p>Tu objetivo es organizar las tarjetas en grupos que tengan sentido para ti.</p>
                        <ol>
                            <li><strong>1. Crea categorías:</strong> Usa el campo de texto para crear los grupos que necesites.</li>
                            <p>Imagina una categoría como el botón que presiones para ir a tal sección o realizar tal acción.</p>
                            <li><strong>2. Selecciona una tarjeta:</strong> Toca cualquier tarjeta para seleccionarla.</li>
                            <li><strong>3. Coloca la tarjeta:</strong> Con una tarjeta seleccionada, toca una categoría para moverla a ese grupo.</li>
                            <li><strong>4. Finaliza:</strong> Cuando hayas clasificado <strong>todas</strong> las tarjetas, pulsa "Enviar Tarea".</li>
                        </ol>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-8 space-y-8 lg:space-y-0">
                <div className="lg:col-span-1 bg-card-bg/50 p-4 rounded-xl relative">
                    <h2 className="text-xl font-semibold text-text-primary mb-3 sticky top-0 bg-card-bg/50 py-2">Tarjetas sin Clasificar ({unsortedCards.length})</h2>
                    <div className="space-y-3 lg:max-h-[65vh] overflow-y-auto pr-2">
                        {selectedCard && unsortedCards.length === 0 && (
                            <div className="absolute inset-4 border-2 border-dashed border-interactive rounded-xl flex items-center justify-center cursor-pointer hover:bg-interactive/10" onClick={() => handlePlaceCard('unsorted')}>
                                <span className="font-bold text-interactive">Colocar aquí</span>
                            </div>
                        )}
                        {unsortedCards.length > 0 ? unsortedCards.map(c => renderCard(c, 'unsorted')) : <p className="text-text-secondary text-center py-8">¡Todo clasificado!</p>}
                    </div>
                </div>
                
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex flex-col sm:flex-row gap-2">
                        <input 
                            type="text" 
                            value={newCategoryName} 
                            onChange={e => setNewCategoryName(e.target.value)} 
                            onKeyPress={e => e.key === 'Enter' && handleAddCategory()}
                            placeholder="Escribe un nombre de categoría..." 
                            className="flex-grow p-3 bg-main-bg text-text-primary rounded-md border border-text-secondary/50 focus:ring-interactive focus:border-interactive"
                        />
                        <button onClick={handleAddCategory} className="px-4 py-3 sm:py-2 bg-interactive hover:bg-interactive-darker text-text-primary rounded-md font-semibold transition-colors">Añadir Categoría</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {categories.map(category => (
                            <div key={category.id} className="bg-card-bg/70 rounded-xl flex flex-col">
                                <div className="p-4 border-b border-main-bg">
                                    <div className="flex justify-between items-center gap-2">
                                        {editingCategoryId === category.id ? (
                                            <input
                                                type="text" value={editingCategoryName}
                                                onChange={e => setEditingCategoryName(e.target.value)}
                                                onBlur={handleConfirmRename} onKeyPress={e => e.key === 'Enter' && handleConfirmRename()}
                                                className="flex-grow p-1 bg-main-bg rounded-md border border-interactive text-lg text-text-primary w-full" autoFocus
                                            />
                                        ) : (
                                            <h3 className="text-lg font-bold text-interactive flex-grow truncate cursor-pointer" onClick={() => handleStartRename(category)} title={category.name}>{category.name}</h3>
                                        )}
                                        <div className="flex-shrink-0 flex items-center">
                                            <button onClick={() => editingCategoryId === category.id ? handleConfirmRename() : handleStartRename(category)} title={editingCategoryId === category.id ? "Confirmar" : "Renombrar"} className="text-text-secondary hover:text-interactive p-1 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg></button>
                                            <button onClick={() => handleDeleteCategory(category.id)} title="Eliminar" className="text-text-secondary hover:text-red-400 p-1 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg></button>
                                        </div>
                                    </div>
                                </div>
                                <div onClick={() => selectedCard && handlePlaceCard(category.id)} className={`p-4 space-y-2 min-h-[150px] bg-main-bg/30 rounded-b-lg flex-grow relative ${selectedCard ? 'cursor-pointer' : ''}`}>
                                    {selectedCard && (
                                        <div className="absolute inset-0 bg-interactive/10 flex items-center justify-center rounded-b-xl z-10 border-2 border-dashed border-interactive hover:bg-interactive/20">
                                            <span className="font-bold text-white bg-interactive px-3 py-1 rounded-md shadow-lg text-sm">Colocar aquí</span>
                                        </div>
                                    )}
                                    <div className={`space-y-2 transition-opacity ${selectedCard ? 'opacity-50' : ''}`}>
                                        {category.cards.length > 0 ? category.cards.map(c => renderCard(c, category.id)) : <p className="text-text-secondary text-center pt-8 text-sm">Vacío</p>}
                                    </div>
                                </div>
                            </div>
                        ))}
                         {categories.length === 0 && (
                            <div className="md:col-span-2 flex items-center justify-center text-center p-10 bg-card-bg/50 rounded-xl border-2 border-dashed border-text-secondary/30">
                                <p className="text-text-secondary">Crea tu primera categoría para empezar a organizar.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 sm:bottom-4 z-40 w-full sm:w-auto">
                 <div className="bg-card-bg/80 backdrop-blur-sm p-2 sm:rounded-xl border-t sm:border border-text-secondary/20 flex flex-col-reverse sm:flex-row items-center justify-end gap-4">
                    {isSubmitDisabled && (
                        <p className="text-text-secondary text-xs italic text-center sm:text-right px-4">
                            Debes clasificar todas las tarjetas para poder enviar la tarea.
                        </p>
                    )}
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitDisabled}
                        className="w-full sm:w-auto bg-green-600 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed enabled:hover:bg-green-700"
                        title={isSubmitDisabled ? "Debes clasificar todas las tarjetas." : 'Enviar resultados'}
                    >
                        Enviar Tarea
                    </button>
                </div>
            </div>
        </div>
    );
};