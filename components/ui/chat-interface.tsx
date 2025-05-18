"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mic, Send, StopCircle } from "lucide-react";
import { Loader2 } from "lucide-react";

interface Message {
    id: string;
    content: string;
    role: 'user' | 'assistant';
    audioUrl?: string;
}

export function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [audioPlayer, setAudioPlayer] = useState<HTMLAudioElement | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    useEffect(() => {
        // Initialize audio player
        setAudioPlayer(new Audio());

        // Scroll to bottom when messages change
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = async () => {
        if (!input.trim()) return;

        // Add user message
        const userMessage: Message = {
            id: Date.now().toString(),
            content: input,
            role: 'user',
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Send message to backend
            const formData = new FormData();
            formData.append('message', input);
            formData.append('voice_response', 'true');

            const response = await fetch('http://localhost:8000/api/chat', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            // Create audio blob from base64
            const audioBlob = base64ToBlob(data.audio, 'audio/mp3');
            const audioUrl = URL.createObjectURL(audioBlob);

            // Add assistant message
            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                content: data.text,
                role: 'assistant',
                audioUrl,
            };

            setMessages(prev => [...prev, assistantMessage]);

            // Play audio
            if (audioPlayer) {
                audioPlayer.src = audioUrl;
                audioPlayer.play();
            }
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                await sendAudioToBackend(audioBlob);
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (error) {
            console.error('Error starting recording:', error);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const sendAudioToBackend = async (audioBlob: Blob) => {
        setIsLoading(true);

        try {
            const formData = new FormData();
            formData.append('audio', audioBlob);

            const response = await fetch('http://localhost:8000/api/voice', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            // Add user message (placeholder for now)
            const userMessage: Message = {
                id: Date.now().toString(),
                content: "Voice message sent",
                role: 'user',
            };

            // Create audio blob from base64
            const responseAudioBlob = base64ToBlob(data.audio, 'audio/mp3');
            const audioUrl = URL.createObjectURL(responseAudioBlob);

            // Add assistant message
            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                content: data.text,
                role: 'assistant',
                audioUrl,
            };

            setMessages(prev => [...prev, userMessage, assistantMessage]);

            // Play audio
            if (audioPlayer) {
                audioPlayer.src = audioUrl;
                audioPlayer.play();
            }
        } catch (error) {
            console.error('Error sending audio:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const base64ToBlob = (base64: string, mimeType: string) => {
        const byteCharacters = atob(base64);
        const byteArrays = [];

        for (let offset = 0; offset < byteCharacters.length; offset += 512) {
            const slice = byteCharacters.slice(offset, offset + 512);

            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }

            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
        }

        return new Blob(byteArrays, { type: mimeType });
    };

    const playAudio = (audioUrl: string) => {
        if (audioPlayer) {
            audioPlayer.src = audioUrl;
            audioPlayer.play();
        }
    };

    return (
        <Card className="w-full max-w-3xl mx-auto h-[600px] flex flex-col">
            <CardHeader>
                <CardTitle>Virtual Assistant</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
                <div className="space-y-4">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'
                                }`}
                        >
                            <div className="flex items-start gap-2 max-w-[80%]">
                                {message.role === 'assistant' && (
                                    <Avatar>
                                        <AvatarFallback>AI</AvatarFallback>
                                    </Avatar>
                                )}
                                <div>
                                    <div
                                        className={`rounded-lg p-3 ${message.role === 'user'
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted'
                                            }`}
                                    >
                                        {message.content}
                                    </div>
                                    {message.audioUrl && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="mt-1"
                                            onClick={() => playAudio(message.audioUrl!)}
                                        >
                                            Play Audio
                                        </Button>
                                    )}
                                </div>
                                {message.role === 'user' && (
                                    <Avatar>
                                        <AvatarFallback>You</AvatarFallback>
                                    </Avatar>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Loading indicator for agent response */}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="flex items-start gap-2 max-w-[80%]">
                                <Avatar>
                                    <AvatarFallback>AI</AvatarFallback>
                                </Avatar>
                                <div className="bg-muted rounded-lg p-3 flex items-center space-x-2">
                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                    <span>Thinking...</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </CardContent>
            <CardFooter className="border-t p-4">
                <div className="flex w-full items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={isLoading}
                    >
                        {isRecording ? <StopCircle className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    </Button>
                    <Input
                        placeholder="Type your message..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                            }
                        }}
                        disabled={isLoading || isRecording}
                    />
                    <Button
                        variant="default"
                        size="icon"
                        onClick={handleSendMessage}
                        disabled={isLoading || isRecording || !input.trim()}
                    >
                        <Send className="h-5 w-5" />
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}