'use client'

import React, { useState } from 'react';
import { AvatarEmotionController } from './avatar-emotion-controller';
import { EmotionType } from './avatar-emotions';

interface DebugPanelProps {
    onEmotionChange: (emotion: EmotionType, intensity: number) => void;
}

export function DebugPanel({ onEmotionChange }: DebugPanelProps) {
    const [isVisible, setIsVisible] = useState<boolean>(false);

    return (
        <div className="fixed bottom-4 right-4 z-50">
            {isVisible && (
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 mb-2 w-64">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-medium">Debug Controls</h3>
                        <button
                            onClick={() => setIsVisible(false)}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <AvatarEmotionController onEmotionChange={onEmotionChange} />
                </div>
            )}

            {!isVisible && (
                <button
                    onClick={() => setIsVisible(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 shadow-lg"
                    title="Show Debug Panel"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </button>
            )}
        </div>
    );
}