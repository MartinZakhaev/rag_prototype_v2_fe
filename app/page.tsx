'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatInterface } from "@/components/ui/chat-interface";
import { DocumentUpload } from "@/components/ui/document-upload";
import { ModelViewer } from "@/components/ui/model-viewer";
import { DebugPanel } from "@/components/ui/debug-panel";
import { useState, useRef } from "react";
import { EmotionType } from "@/components/ui/avatar-emotions";

export default function Home() {
  const [emotionController, setEmotionController] = useState<{
    setEmotion: (emotion: EmotionType, intensity: number) => void;
  } | null>(null);

  const handleEmotionControllerRef = (controller: {
    setEmotion: (emotion: EmotionType, intensity: number) => void;
  }) => {
    setEmotionController(controller);
  };

  const handleEmotionChange = (emotion: EmotionType, intensity: number) => {
    if (emotionController) {
      emotionController.setEmotion(emotion, intensity);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold text-center mb-8">
        RAG Virtual Assistant
      </h1>

      <Tabs defaultValue="chat" className="w-full max-w-4xl mx-auto">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="upload">Upload Documents</TabsTrigger>
        </TabsList>
        <TabsContent value="chat" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <ChatInterface />
            </div>
            <div className="md:col-span-1">
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 h-full">
                <h3 className="text-lg font-medium mb-2">Virtual Assistant</h3>
                <ModelViewer
                  modelPath="/models/68296e4c0bc631a87abfaff4.glb"
                  onEmotionControllerRef={handleEmotionControllerRef}
                />
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="upload" className="mt-6">
          <DocumentUpload />
        </TabsContent>
      </Tabs>

      {/* Debug Panel */}
      <DebugPanel onEmotionChange={handleEmotionChange} />
    </div>
  );
}
