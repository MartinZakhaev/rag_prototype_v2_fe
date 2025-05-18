'use client'

import * as THREE from 'three';

// Define emotion types
export enum EmotionType {
    NEUTRAL = 'neutral',
    HAPPY = 'happy',
    SAD = 'sad',
    ANGRY = 'angry',
    SURPRISED = 'surprised',
    THINKING = 'thinking',
}

// Define emotion intensity interface
export interface EmotionIntensity {
    emotion: EmotionType;
    intensity: number; // 0 to 1
    transitionSpeed?: number; // Speed of transition (default: 0.05)
}

// Define morph target mappings for each emotion
interface MorphTargetMapping {
    [key: string]: number; // morphTargetName: intensity
}

// Emotion definitions with morph target mappings
const EMOTION_MORPHS: Record<EmotionType, MorphTargetMapping> = {
    [EmotionType.NEUTRAL]: {},
    [EmotionType.HAPPY]: {
        browInnerUp: 0.17,
        eyeSquintLeft: 0.4,
        eyeSquintRight: 0.44,
        noseSneerLeft: 0.1700000727403593,
        noseSneerRight: 0.14000002836874015,
        mouthPressLeft: 0.61,
        mouthPressRight: 0.41000000000000003,
    },
    [EmotionType.SAD]: {
        mouthFrownLeft: 1,
        mouthFrownRight: 1,
        mouthShrugLower: 0.78341,
        browInnerUp: 0.452,
        eyeSquintLeft: 0.72,
        eyeSquintRight: 0.75,
        eyeLookDownLeft: 0.5,
        eyeLookDownRight: 0.5,
        jawForward: 1,
    },
    [EmotionType.ANGRY]: {
        browDownLeft: 1,
        browDownRight: 1,
        eyeSquintLeft: 1,
        eyeSquintRight: 1,
        jawForward: 1,
        jawLeft: 1,
        mouthShrugLower: 1,
        noseSneerLeft: 1,
        noseSneerRight: 0.42,
        eyeLookDownLeft: 0.16,
        eyeLookDownRight: 0.16,
        cheekSquintLeft: 1,
        cheekSquintRight: 1,
        mouthClose: 0.23,
        mouthFunnel: 0.63,
        mouthDimpleRight: 1,
    },
    [EmotionType.SURPRISED]: {
        eyeWideLeft: 0.5,
        eyeWideRight: 0.5,
        jawOpen: 0.351,
        mouthFunnel: 1,
        browInnerUp: 1,
    },
    [EmotionType.THINKING]: {
        'browInnerUp': 1,
        'browOuterUpRight': 0.7,
        'eyeSquintRight': 0.3,
        'mouthPressLeft': 0.4,
    },
};

export class AvatarEmotionsManager {
    private scene: THREE.Object3D;
    private headMesh: THREE.Mesh | null = null;
    private currentMorphTargets: Record<string, number> = {};
    private targetMorphTargets: Record<string, number> = {};
    private transitionSpeed: number = 0.05;
    private initialized: boolean = false;

    constructor(scene: THREE.Object3D) {
        this.scene = scene;
        this.initialize();
    }

    private initialize(): void {
        // Find the head mesh in the scene
        this.scene.traverse((object) => {
            if (object instanceof THREE.Mesh &&
                object.morphTargetDictionary &&
                object.name.toLowerCase().includes('head')) {
                this.headMesh = object;
                this.initialized = true;
                console.log('Avatar head mesh found with morph targets:', object.morphTargetDictionary);
            }
        });

        if (!this.initialized) {
            console.warn('Could not find head mesh with morph targets in the avatar');
        }
    }

    // Set a specific emotion with intensity
    public setEmotion(emotionData: EmotionIntensity): void {
        if (!this.initialized || !this.headMesh) return;

        const { emotion, intensity, transitionSpeed } = emotionData;

        // Reset target morph targets to zero
        this.targetMorphTargets = {};

        // Set new target values based on emotion
        const morphTargets = EMOTION_MORPHS[emotion];
        if (morphTargets) {
            Object.entries(morphTargets).forEach(([morphName, value]) => {
                // Check if this morph target exists on the mesh
                const morphIndex = this.headMesh?.morphTargetDictionary?.[morphName];
                if (morphIndex !== undefined) {
                    this.targetMorphTargets[morphName] = value * intensity;
                }
            });
        }

        // Set transition speed if provided
        if (transitionSpeed !== undefined) {
            this.transitionSpeed = transitionSpeed;
        }
    }

    // Blend between multiple emotions
    public blendEmotions(emotions: EmotionIntensity[]): void {
        if (!this.initialized || !this.headMesh) return;

        // Reset target morph targets
        this.targetMorphTargets = {};

        // Blend all emotions
        emotions.forEach(({ emotion, intensity }) => {
            const morphTargets = EMOTION_MORPHS[emotion];
            if (morphTargets) {
                Object.entries(morphTargets).forEach(([morphName, value]) => {
                    const morphIndex = this.headMesh?.morphTargetDictionary?.[morphName];
                    if (morphIndex !== undefined) {
                        // Add to existing value for blending
                        this.targetMorphTargets[morphName] = (this.targetMorphTargets[morphName] || 0) + (value * intensity);
                    }
                });
            }
        });
    }

    // Update method to be called in animation frame
    public update(): void {
        if (!this.initialized || !this.headMesh) return;

        let needsUpdate = false;

        // Smoothly transition current values toward target values
        Object.entries(this.targetMorphTargets).forEach(([morphName, targetValue]) => {
            const morphIndex = this.headMesh?.morphTargetDictionary?.[morphName];
            if (morphIndex !== undefined && this.headMesh && this.headMesh.morphTargetInfluences) {
                const currentValue = this.headMesh.morphTargetInfluences[morphIndex] || 0;
                const newValue = THREE.MathUtils.lerp(
                    currentValue,
                    targetValue,
                    this.transitionSpeed
                );

                // Only update if there's a significant change
                if (Math.abs(newValue - currentValue) > 0.001) {
                    this.headMesh.morphTargetInfluences[morphIndex] = newValue;
                    needsUpdate = true;
                }
            }
        });

        // Reset morph targets not in the target list
        if (this.headMesh.morphTargetDictionary && this.headMesh.morphTargetInfluences) {
            Object.entries(this.headMesh.morphTargetDictionary).forEach(([morphName, index]) => {
                if (this.targetMorphTargets[morphName] === undefined &&
                    this.headMesh && this.headMesh.morphTargetInfluences[index] > 0) {
                    const currentValue = this.headMesh.morphTargetInfluences[index];
                    const newValue = THREE.MathUtils.lerp(currentValue, 0, this.transitionSpeed);

                    if (Math.abs(newValue) > 0.001) {
                        this.headMesh.morphTargetInfluences[index] = newValue;
                        needsUpdate = true;
                    } else {
                        this.headMesh.morphTargetInfluences[index] = 0;
                    }
                }
            });
        }

        return needsUpdate;
    }
}