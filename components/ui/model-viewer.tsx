'use client'

import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/Addons.js';

// Define proper types for the Model component props
interface ModelProps {
    url: string;
    greetingAnimationPath: string;
    idleAnimationPath: string;
}

function Model({ url, greetingAnimationPath, idleAnimationPath }: ModelProps) {
    const group = useRef<THREE.Group>(null);
    const { scene, animations } = useGLTF(url);
    const { gl, camera } = useThree();
    const mixerRef = useRef<THREE.AnimationMixer | null>(null);
    const [currentAction, setCurrentAction] = useState<THREE.AnimationAction | null>(null);
    const [nextAction, setNextAction] = useState<THREE.AnimationAction | null>(null);
    const [animationsLoaded, setAnimationsLoaded] = useState<boolean>(false);

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
                }
            };

            // Listen for the finished event
            if (mixerRef.current) {
                mixerRef.current.addEventListener('finished', onFinished);
                return () => mixerRef.current?.removeEventListener('finished', onFinished);
            }
        }
    }, [currentAction, nextAction]);

    // Update animations
    useFrame((state, delta) => {
        if (mixerRef.current) {
            mixerRef.current.update(delta);
        }
    });

    return (
        <group ref={group} dispose={null}>
            <primitive object={scene} scale={3.5} position={[0, -4.9, 0]} />
        </group>
    );
}

// Define props for the ModelViewer component
interface ModelViewerProps {
    modelPath: string;
}

export function ModelViewer({ modelPath }: ModelViewerProps) {
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
                />
                <OrbitControls enableZoom={false} enableRotate={false} enablePan={false} />
                <Environment preset="sunset" />
            </Canvas>
        </div>
    );
}