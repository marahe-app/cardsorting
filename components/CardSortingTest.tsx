
import React, { useState, useCallback, useEffect } from 'react';
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

    // State for inline renaming
    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
    const [editingCategoryName, setEditingCategoryName] = useState('');
    
    // State to manage touch vs. mouse drag
    const [isTouchDrag, setIsTouchDrag] = useState(false);
    const [ghost, setGhost] = useState<{ card: Card; x: number; y: number } | null>(null);

    // State for collapsible instructions
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

        setUnsortedCards(prevUnsorted => [...prevUnsorted, ...categoryToDelete.cards]);
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

    const handleDragStart = (card: Card) => {
        setDraggedCard(card);
    };

    const handleDragOver = (e: React.DragEvent, categoryId: string) => {
        e.preventDefault();
        setDragOverCategory(categoryId);
    };

    const handleDrop = useCallback((targetId: string | null) => {
        if (!draggedCard) return;

        // 1. Remove card from its original location (either unsorted or a category)
        let cardFoundInUnsorted = unsortedCards.some(c => c.id === draggedCard.id);
        const newUnsorted = unsortedCards.filter(c => c.id !== draggedCard.id);
        const newCategories = categories.map(cat => ({
            ...cat,
            cards: cat.cards.filter(c => c.id !== draggedCard.id)
        }));
        
        // 2. Add card to new location
        if (targetId && targetId !== 'unsorted') {
            const categoryIndex = newCategories.findIndex(c => c.id === targetId);
            if (categoryIndex > -1) {
                newCategories[categoryIndex].cards.push(draggedCard);
            }
             setCategories(newCategories);
             setUnsortedCards(newUnsorted);
        } else { // Dropped on "unsorted" or nowhere
             if (!cardFoundInUnsorted) {
                 setUnsortedCards([draggedCard, ...newUnsorted]);
             } else {
                 setUnsortedCards(unsortedCards); // No change if dropped back on unsorted
             }
             setCategories(newCategories);
        }

        setDraggedCard(null);
        setDragOverCategory(null);
    }, [draggedCard, unsortedCards, categories]);

    // --- Touch handlers for mobile drag-and-drop ---
    const handleTouchStart = (e: React.TouchEvent, card: Card) => {
        handleDragStart(card);
        setIsTouchDrag(true);
        const touch = e.touches[0];
        setGhost({ card, x: touch.clientX, y: touch.clientY });
    };
    
    useEffect(() => {
        const touchMoveHandler = (e: TouchEvent) => {
            if (!isTouchDrag) return;
            // This handler is only active during a touch-drag operation.
            // We prevent default to stop the screen from scrolling.
            e.preventDefault();

            const touch = e.touches[0];
            // Move the ghost element
            setGhost(g => g ? { ...g, x: touch.clientX, y: touch.clientY } : null);

            // Find what's under the finger
            const elementOver = document.elementFromPoint(touch.clientX, touch.clientY);
            const dropTarget = elementOver?.closest('[data-droptarget-id]');
            const targetId = dropTarget ? dropTarget.getAttribute('data-droptarget-id') : null;
            
            // Update the visual feedback for which category is being hovered over
            setDragOverCategory(targetId);
        };

        const touchEndHandler = () => {
            if (!isTouchDrag) return;
            // Use the latest dragOverCategory from state to perform the drop
            handleDrop(dragOverCategory);
            // Cleanup
            setIsTouchDrag(false);
            setGhost(null);
        };

        // We only add the listeners to the document when a touch drag is active.
        if (isTouchDrag) {
            document.addEventListener('touchmove', touchMoveHandler, { passive: false });
            document.addEventListener('touchend', touchEndHandler);
            document.addEventListener('touchcancel', touchEndHandler);
        }

        return () => {
            // Cleanup: remove the listeners when the component unmounts or the effect re-runs.
            document.removeEventListener('touchmove', touchMoveHandler);
            document.removeEventListener('touchend', touchEndHandler);
            document.removeEventListener('touchcancel', touchEndHandler);
        };
    }, [isTouchDrag, dragOverCategory, handleDrop]);


    const handleSubmit = () => {
        if (isSubmitDisabled) return;
        
        const submission: Omit<CardSortingSubmission, 'id' | 'userId' | 'completedAt'> = {
            taskId: task.id,
            results: categories.filter(c => c.cards.length > 0 && c.name.trim() !== ''),
        };
        onSubmit(submission);
    };

    const UnsortedCardsColumn = () => (
        <div
            data-droptarget-id="unsorted"
            onDragOver={(e) => handleDragOver(e, 'unsorted')}
            onDrop={() => handleDrop('unsorted')}
            onDragLeave={() => setDragOverCategory(null)}
            className={`bg-card-bg/50 p-4 rounded-xl transition-all h-full ${dragOverCategory === 'unsorted' ? 'bg-interactive/20 ring-2 ring-interactive' : ''}`}
        >
            <h2 className="text-xl font-semibold text-text-primary mb-3 sticky top-0 bg-card-bg/50 py-2">Tarjetas sin Clasificar ({unsortedCards.length})</h2>
            <div className="space-y-3 lg:max-h-[65vh] lg:overflow-y-auto">
                {/* Mobile: Horizontal scroll */}
                <div className="lg:hidden flex flex-nowrap items-center gap-4 overflow-x-auto min-h-[100px] p-2">
                    {unsortedCards.map(card => {
                         const isDraggingThisCard = draggedCard?.id === card.id;
                        return (
                             <div 
                                key={card.id} 
                                draggable 
                                onDragStart={() => { setIsTouchDrag(false); handleDragStart(card); }}
                                onTouchStart={(e) => handleTouchStart(e, card)}
                                className={`bg-card-bg p-3 rounded-md cursor-grab active:cursor-grabbing shadow-md text-text-primary w-48 flex-shrink-0 transition-opacity ${isDraggingThisCard && isTouchDrag ? 'opacity-30' : 'opacity-100'}`}
                            >
                                {card.content}
                            </div>
                        )
                    })}
                </div>
                 {/* Desktop: Vertical list */}
                <div className="hidden lg:flex lg:flex-col lg:gap-3">
                    {unsortedCards.map(card => {
                        const isDraggingThisCard = draggedCard?.id === card.id;
                        return (
                            <div 
                                key={card.id} 
                                draggable 
                                onDragStart={() => { setIsTouchDrag(false); handleDragStart(card); }}
                                onTouchStart={(e) => handleTouchStart(e, card)}
                                className={`bg-card-bg p-3 rounded-md cursor-grab active:cursor-grabbing shadow-md text-text-primary w-full transition-opacity ${isDraggingThisCard && isTouchDrag ? 'opacity-30' : 'opacity-100'}`}
                            >
                                {card.content}
                            </div>
                        )
                    })}
                </div>

                {unsortedCards.length === 0 && (
                    <div className="w-full flex-grow flex items-center justify-center text-text-secondary p-4">
                        ¡Todas las tarjetas han sido clasificadas!
                    </div>
                )}
            </div>
        </div>
    );
    
    return (
        <div className="container mx-auto max-w-7xl py-10 px-4 space-y-8">
            {/* Ghost element for touch drag */}
            {ghost && (
              <div 
                style={{
                  position: 'fixed',
                  top: ghost.y,
                  left: ghost.x,
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none',
                  zIndex: 9999,
                }}
                className="bg-interactive p-3 rounded-md shadow-2xl text-white w-48 ring-2 ring-white/50"
              >
                {ghost.card.content}
              </div>
            )}
            <div className="flex justify-between items-center">
                <button onClick={onBack} className="bg-card-bg hover:brightness-125 text-white font-bold py-2 px-4 rounded-lg transition-colors">
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
            <header className="bg-card-bg p-6 rounded-xl shadow-lg">
                <h1 className="text-3xl font-bold text-text-primary">{task.title}</h1>
                <p className="mt-2 text-text-secondary">{task.description}</p>
            </header>

            {/* Instructions */}
            <div className="bg-card-bg/50 p-5 rounded-lg border border-text-secondary/20">
                <button
                    onClick={() => setIsInstructionsOpen(!isInstructionsOpen)}
                    className="w-full flex justify-between items-center text-left"
                    aria-expanded={isInstructionsOpen}
                    aria-controls="instructions-content"
                >
                    <h3 className="text-xl font-semibold text-text-primary">Instrucciones Detalladas</h3>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-6 w-6 text-text-secondary transition-transform transform ${isInstructionsOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
                {isInstructionsOpen && (
                    <div id="instructions-content" className="text-text-secondary mt-4 space-y-2">
                        <p>Tu objetivo es organizar las tarjetas en grupos que tengan sentido para ti. A estos grupos los llamamos "categorías".</p>
                        <ol className="list-decimal list-inside space-y-1 pl-2">
                            <li><strong>Crea categorías:</strong> Usa el campo "Escribe un nombre..." para crearlas. Piensa en una categoría como la palabra que leas en el botón que te permita acceder al contenido de las tarjetas</li>
                            <li><strong>Arrastra las tarjetas:</strong> Mueve las tarjetas desde el panel "Tarjetas sin Clasificar" a las categorías que creaste.</li>
                            <li><strong>Organiza a tu gusto:</strong> Puedes mover tarjetas entre categorías, cambiarles el nombre o eliminarlas.</li>
                            <li><strong>Finaliza la tarea:</strong> Cuando hayas clasificado <strong>todas</strong> las tarjetas, pulsa "Enviar Tarea".</li>
                        </ol>
                        <p className="pt-2 italic">¡Gracias por tu ayuda! Tu organización nos dará información muy valiosa.</p>
                    </div>
                )}
            </div>

            {/* Main Content Area: Two-column layout on large screens */}
            <div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-8 space-y-8 lg:space-y-0">
                
                {/* Left Column (Unsorted Cards) - visible on top on mobile */}
                <div className="lg:col-span-1">
                    <UnsortedCardsColumn />
                </div>
                
                {/* Right Column (Categories) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={newCategoryName} 
                            onChange={e => setNewCategoryName(e.target.value)} 
                            onKeyPress={e => e.key === 'Enter' && handleAddCategory()}
                            placeholder="Escribe un nombre de categoría..." 
                            className="flex-grow p-3 bg-main-bg rounded-md border border-text-secondary/50 focus:ring-interactive focus:border-interactive"
                        />
                        <button onClick={handleAddCategory} className="px-4 py-2 bg-interactive hover:bg-interactive-darker rounded-md font-semibold transition-colors">Añadir Categoría</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {categories.map(category => (
                            <div 
                                key={category.id} 
                                data-droptarget-id={category.id}
                                className={`bg-card-bg bg-opacity-70 p-4 rounded-xl space-y-3 transition-all ${dragOverCategory === category.id ? 'bg-interactive/20 ring-2 ring-interactive' : ''}`}
                                onDragOver={(e) => handleDragOver(e, category.id)}
                                onDrop={() => handleDrop(category.id)}
                                onDragLeave={() => setDragOverCategory(null)}
                            >
                                <div className="flex justify-between items-center gap-2">
                                     {editingCategoryId === category.id ? (
                                        <input
                                            type="text"
                                            value={editingCategoryName}
                                            onChange={e => setEditingCategoryName(e.target.value)}
                                            onBlur={handleConfirmRename}
                                            onKeyPress={e => e.key === 'Enter' && handleConfirmRename()}
                                            className="flex-grow p-1 bg-main-bg rounded-md border border-interactive focus:ring-interactive focus:border-interactive text-lg text-interactive w-full"
                                            autoFocus
                                        />
                                    ) : (
                                        <h3 className="text-lg font-bold text-interactive flex-grow truncate" title={category.name}>{category.name}</h3>
                                    )}
                                    <div className="flex-shrink-0 flex items-center">
                                        <button 
                                            onClick={() => editingCategoryId === category.id ? handleConfirmRename() : handleStartRename(category)}
                                            title={editingCategoryId === category.id ? "Confirmar nombre" : "Renombrar categoría"}
                                            className="text-text-secondary hover:text-interactive p-1 rounded-full transition-colors"
                                        >
                                           {editingCategoryId === category.id ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                           ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                </svg>
                                           )}
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteCategory(category.id)}
                                            title="Eliminar categoría"
                                            className="flex-shrink-0 text-text-secondary hover:text-red-400 p-1 rounded-full transition-colors"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                <div className="p-2 space-y-2 min-h-[150px] bg-main-bg/30 rounded-lg">
                                    {category.cards.map(card => {
                                         const isDraggingThisCard = draggedCard?.id === card.id;
                                         return (
                                             <div 
                                                 key={card.id} 
                                                 draggable 
                                                 onDragStart={() => { setIsTouchDrag(false); handleDragStart(card); }} 
                                                 onTouchStart={(e) => handleTouchStart(e, card)}
                                                 className={`bg-card-bg p-3 rounded-md cursor-grab active:cursor-grabbing shadow-md text-text-primary transition-opacity ${isDraggingThisCard && isTouchDrag ? 'opacity-30' : 'opacity-100'}`}
                                             >
                                                 {card.content}
                                             </div>
                                         );
                                    })}
                                </div>
                            </div>
                        ))}
                         {categories.length === 0 && (
                            <div className="md:col-span-2 flex items-center justify-center text-center p-10 bg-card-bg/50 rounded-xl border-2 border-dashed border-text-secondary/30">
                                <p className="text-text-secondary">Crea tu primera categoría para empezar a organizar las tarjetas.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
