
import React, { useState } from 'react';
import type { AlternativesTask, AlternativesSubmission, Answer } from '../types';

interface AlternativesTestProps {
    task: AlternativesTask;
    onSubmit: (submission: Omit<AlternativesSubmission, 'id' | 'userId' | 'completedAt'>) => void | Promise<void>;
    onBack: () => void;
}

export const AlternativesTest: React.FC<AlternativesTestProps> = ({ task, onSubmit, onBack }) => {
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [isInstructionsOpen, setIsInstructionsOpen] = useState(true);

    const handleSelectAlternative = (questionId: string, alternativeId: string) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: alternativeId,
        }));
    };

    const totalQuestions = task.questions.length;
    const answeredQuestions = Object.keys(answers).length;
    const isSubmitDisabled = answeredQuestions < totalQuestions;

    const handleSubmit = () => {
        if (isSubmitDisabled) return;

        const formattedAnswers: Answer[] = Object.entries(answers).map(([questionId, selectedAlternativeId]) => ({
            questionId,
            selectedAlternativeId,
        }));

        const submission: Omit<AlternativesSubmission, 'id' | 'userId' | 'completedAt'> = {
            type: 'alternatives',
            taskId: task.id,
            answers: formattedAnswers,
        };
        onSubmit(submission);
    };

    return (
        <div className="container mx-auto max-w-4xl py-10 px-4 space-y-8 pb-32 sm:pb-24">
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
                    <div id="instructions-content" className="text-text-secondary mt-4 space-y-2 prose prose-invert max-w-none prose-p:my-1">
                        <p>Por favor, lee cada pregunta detenidamente y selecciona la alternativa que mejor represente tu opinión. Debes responder todas las preguntas para poder enviar la tarea.</p>
                    </div>
                )}
            </div>

            <div className="space-y-8">
                {task.questions.map((question, index) => (
                    <div key={question.id} className="bg-card-bg p-6 rounded-xl shadow-lg">
                        <h2 className="text-xl font-semibold text-text-primary">
                           <span className="text-interactive">Pregunta {index + 1}:</span> {question.text}
                        </h2>
                        <div className="mt-4 space-y-3">
                            {question.alternatives.map(alt => (
                                <div
                                    key={alt.id}
                                    onClick={() => handleSelectAlternative(question.id, alt.id)}
                                    className={`p-4 rounded-lg cursor-pointer border-2 transition-colors duration-200 ${answers[question.id] === alt.id ? 'bg-interactive/20 border-interactive' : 'bg-main-bg border-transparent hover:border-interactive/50'}`}
                                >
                                    <p className="text-text-primary">{alt.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>


            <div className="fixed bottom-0 left-0 right-0 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 sm:bottom-4 z-40 w-full sm:w-auto">
                 <div className="bg-card-bg/80 backdrop-blur-sm p-2 sm:rounded-xl border-t sm:border border-text-secondary/20 flex flex-col-reverse sm:flex-row items-center justify-end gap-4">
                    {isSubmitDisabled && (
                        <p className="text-text-secondary text-xs italic text-center sm:text-right px-4">
                            Has respondido {answeredQuestions} de {totalQuestions} preguntas.
                        </p>
                    )}
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitDisabled}
                        className="w-full sm:w-auto bg-green-600 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed enabled:hover:bg-green-700"
                        title={isSubmitDisabled ? `Debes responder las ${totalQuestions - answeredQuestions} preguntas restantes.` : 'Enviar resultados'}
                    >
                        Enviar Tarea
                    </button>
                </div>
            </div>
        </div>
    );
};
