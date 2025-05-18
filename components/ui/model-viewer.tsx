'use client'

import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/Addons.js';
import { AvatarEmotionsManager, EmotionType, EmotionIntensity } from './avatar-emotions';

// Create a shared ref for the emotions manager using useRef instead of createRef
// This line should be removed, as we'll move it inside the component
// const emotionsManagerRef = React.createRef<AvatarEmotionsManager>();

// Define proper types for the Model component props
interface ModelProps {
    url: string;
    greetingAnimationPath: string;
    idleAnimationPath: string;
    emotionsManagerRef: React.MutableRefObject<AvatarEmotionsManager | null>;
}

function Model({ url, greetingAnimationPath, idleAnimationPath, emotionsManagerRef }: ModelProps) {
    const group = useRef<THREE.Group>(null);
    const { scene, animations } = useGLTF(url);
    const { gl, camera } = useThree();
    const mixerRef = useRef<THREE.AnimationMixer | null>(null);
    const [currentAction, setCurrentAction] = useState<THREE.AnimationAction | null>(null);
    const [nextAction, setNextAction] = useState<THREE.AnimationAction | null>(null);
    const [animationsLoaded, setAnimationsLoaded] = useState<boolean>(false);
    const [currentEmotion, setCurrentEmotion] = useState<EmotionType>(EmotionType.NEUTRAL);

    // Initialize emotions manager
    useEffect(() => {
        if (scene) {
            emotionsManagerRef.current = new AvatarEmotionsManager(scene);

            // Start with a greeting emotion
            setTimeout(() => {
                emotionsManagerRef.current?.setEmotion({
                    emotion: EmotionType.HAPPY,
                    intensity: 0.8,
                    transitionSpeed: 0.03
                });
                setCurrentEmotion(EmotionType.HAPPY);
            }, 500);

            // After greeting, transition to neutral
            setTimeout(() => {
                emotionsManagerRef.current?.setEmotion({
                    emotion: EmotionType.NEUTRAL,
                    intensity: 1.0,
                    transitionSpeed: 0.02
                });
                setCurrentEmotion(EmotionType.NEUTRAL);
            }, 4000);
        }
    }, [scene]);

    // Load animations
    useEffect(() => {
        const mixer = new THREE.AnimationMixer(scene);
        mixerRef.current = mixer;

        let greetingAction: THREE.AnimationAction | null = null;
        let idleAction: THREE.AnimationAction | null = null;

        // Load greeting animation
        const fbxLoader = new FBXLoader();
        fbxLoader.load(greetingAnimationPath, (greetingFbx) => {
            if (greetingFbx.animations && greetingFbx.animations.length > 0) {
                const greetingClip = greetingFbx.animations[0];
                greetingClip.name = 'greeting';
                greetingAction = mixer.clipAction(greetingClip);

                // Now load idle animation
                fbxLoader.load(idleAnimationPath, (idleFbx) => {
                    if (idleFbx.animations && idleFbx.animations.length > 0) {
                        const idleClip = idleFbx.animations[0];
                        idleClip.name = 'idle';
                        idleAction = mixer.clipAction(idleClip);

                        // Both animations are loaded, start with greeting
                        if (greetingAction && idleAction) {
                            // Set up greeting animation
                            greetingAction.clampWhenFinished = true;
                            greetingAction.setLoop(THREE.LoopOnce, 1);

                            // Set up idle animation
                            idleAction.setLoop(THREE.LoopRepeat, Infinity);

                            // Start with greeting
                            setCurrentAction(greetingAction);
                            setNextAction(idleAction);

                            // Play greeting animation
                            greetingAction.play();

                            setAnimationsLoaded(true);
                        }
                    }
                });
            }
        });

        return () => {
            // Cleanup
            if (mixerRef.current) {
                mixerRef.current.stopAllAction();
            }
        };
    }, [scene, greetingAnimationPath, idleAnimationPath]);

    // Handle animation transition
    useEffect(() => {
        if (currentAction && currentAction.loop === THREE.LoopOnce) {
            // Set up the event to transition to idle when greeting finishes
            const onFinished = (e: any) => {
                if (nextAction) {
                    // Crossfade to idle animation
                    currentAction.fadeOut(0.5);
                    nextAction.reset().fadeIn(0.5).play();
                    setCurrentAction(nextAction);
                    setNextAction(null);

                    // Also transition to a thinking emotion occasionally
                    const emotionInterval = setInterval(() => {
                        const randomEmotion = Math.random();
                        if (randomEmotion > 0.7) {
                            // Show thinking emotion
                            emotionsManagerRef.current?.setEmotion({
                                emotion: EmotionType.THINKING,
                                intensity: 0.6,
                                transitionSpeed: 0.03
                            });
                            setCurrentEmotion(EmotionType.THINKING);

                            // Return to neutral after a few seconds
                            setTimeout(() => {
                                emotionsManagerRef.current?.setEmotion({
                                    emotion: EmotionType.NEUTRAL,
                                    intensity: 1.0,
                                    transitionSpeed: 0.02
                                });
                                setCurrentEmotion(EmotionType.NEUTRAL);
                            }, 3000);
                        }
                    }, 10000); // Check every 10 seconds

                    return () => clearInterval(emotionInterval);
                }
            };

            // Listen for the finished event
            if (mixerRef.current) {
                mixerRef.current.addEventListener('finished', onFinished);
                return () => mixerRef.current?.removeEventListener('finished', onFinished);
            }
        }
    }, [currentAction, nextAction]);

    // Update animations and emotions
    useFrame((state, delta) => {
        if (mixerRef.current) {
            mixerRef.current.update(delta);
        }

        // Update emotions
        if (emotionsManagerRef.current) {
            emotionsManagerRef.current.update();
        }
    });

    return (
        <group ref={group} dispose={null}>
            <primitive object={scene} scale={3.5} position={[0, -4.9, 0]} />
        </group>
    );
}

// Add this to your existing ModelViewer component
interface ModelViewerProps {
    modelPath: string;
    onEmotionControllerRef?: (controller: {
        setEmotion: (emotion: EmotionType, intensity: number) => void;
    }) => void;
}

export function ModelViewer({ modelPath, onEmotionControllerRef }: ModelViewerProps) {
    // Create a ref for the emotions manager inside the component
    const emotionsManagerRef = useRef<AvatarEmotionsManager | null>(null);

    // Create a ref for the emotion controller
    const emotionControllerRef = useRef<{
        setEmotion: (emotion: EmotionType, intensity: number) => void;
    }>({
        setEmotion: (emotion: EmotionType, intensity: number) => {
            if (emotionsManagerRef.current) {
                emotionsManagerRef.current.setEmotion({
                    emotion,
                    intensity,
                    transitionSpeed: 0.05
                });
            }
        }
    });

    // Expose the controller to parent components
    useEffect(() => {
        if (onEmotionControllerRef) {
            onEmotionControllerRef(emotionControllerRef.current);
        }
    }, [onEmotionControllerRef]);

    return (
        <div
            className="h-[550px] w-full rounded-md overflow-hidden relative"
            style={{
                backgroundImage: "url('/images/virtual-assistant-bg.jpg')",
                backgroundSize: 'cover',
                backgroundPosition: 'center'
            }}
        >
            {/* Semi-transparent overlay to ensure model visibility */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30"></div>

            <Canvas
                camera={{ position: [0, 0, 5], fov: 45 }}
                style={{ background: 'transparent' }}
            >
                <ambientLight intensity={0.5} />
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
                <pointLight position={[-10, -10, -10]} />
                <Model
                    url={modelPath}
                    greetingAnimationPath="/animations/rag-agent-v2-standing-greeting.fbx"
                    idleAnimationPath="/animations/rag-agent-v2-idle.fbx"
                    emotionsManagerRef={emotionsManagerRef}
                />
                <OrbitControls enableZoom={false} enableRotate={false} enablePan={false} />
                <Environment preset="sunset" />
            </Canvas>
        </div>
    );
}