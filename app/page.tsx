import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatInterface } from "@/components/ui/chat-interface";
import { DocumentUpload } from "@/components/ui/document-upload";

export default function Home() {
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
          <ChatInterface />
        </TabsContent>
        <TabsContent value="upload" className="mt-6">
          <DocumentUpload />
        </TabsContent>
      </Tabs>
    </div>
  );
}
