'use client'

import React, { useState } from 'react';
import { EmotionType } from './avatar-emotions';

interface EmotionControllerProps {
    onEmotionChange: (emotion: EmotionType, intensity: number) => void;
}

export function AvatarEmotionController({ onEmotionChange }: EmotionControllerProps) {
    const [intensity, setIntensity] = useState<number>(0.8);

    const handleEmotionClick = (emotion: EmotionType) => {
        onEmotionChange(emotion, intensity);
    };

    return (
        <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <h3 className="text-lg font-medium mb-3">Avatar Emotions</h3>

            <div className="mb-4">
                <label className="block text-sm mb-1">Intensity: {intensity.toFixed(1)}</label>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={intensity}
                    onChange={(e) => setIntensity(parseFloat(e.target.value))}
                    className="w-full"
                />
            </div>

            <div className="grid grid-cols-2 gap-2">
                {Object.values(EmotionType).map((emotion) => (
                    <button
                        key={emotion}
                        onClick={() => handleEmotionClick(emotion)}
                        className="px-3 py-2 bg-slate-200 dark:bg-slate-700 rounded hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                    >
                        {emotion.charAt(0).toUpperCase() + emotion.slice(1)}
                    </button>
                ))}
            </div>
        </div>
    );
}