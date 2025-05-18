"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Check, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function DocumentUpload() {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setUploadStatus('idle');
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsUploading(true);
        setUploadStatus('idle');

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('http://localhost:8000/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to upload document');
            }

            const data = await response.json();
            setUploadStatus('success');
            setFile(null);

            // Reset file input
            const fileInput = document.getElementById('document-upload') as HTMLInputElement;
            if (fileInput) {
                fileInput.value = '';
            }
        } catch (error) {
            console.error('Error uploading document:', error);
            setUploadStatus('error');
            setErrorMessage(error instanceof Error ? error.message : 'Failed to upload document');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle>Upload Document</CardTitle>
                <CardDescription>
                    Upload documents to enhance the knowledge base of your virtual assistant.
                    Supported formats: PDF, DOCX
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid w-full items-center gap-4">
                    <div className="flex flex-col space-y-1.5">
                        <Label htmlFor="document-upload">Document</Label>
                        <Input
                            id="document-upload"
                            type="file"
                            accept=".pdf,.docx,.doc"
                            onChange={handleFileChange}
                            disabled={isUploading}
                        />
                    </div>
                    {uploadStatus === 'success' && (
                        <Alert variant="default" className="bg-green-50 border-green-200">
                            <Check className="h-4 w-4 text-green-600" />
                            <AlertTitle className="text-green-800">Success</AlertTitle>
                            <AlertDescription className="text-green-700">
                                Document uploaded successfully and added to the knowledge base.
                            </AlertDescription>
                        </Alert>
                    )}
                    {uploadStatus === 'error' && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{errorMessage}</AlertDescription>
                        </Alert>
                    )}
                </div>
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button
                    variant="outline"
                    onClick={() => {
                        setFile(null);
                        setUploadStatus('idle');
                        const fileInput = document.getElementById('document-upload') as HTMLInputElement;
                        if (fileInput) {
                            fileInput.value = '';
                        }
                    }}
                    disabled={!file || isUploading}
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleUpload}
                    disabled={!file || isUploading}
                    className="flex items-center gap-2"
                >
                    {isUploading ? 'Uploading...' : 'Upload'}
                    {!isUploading && <Upload className="h-4 w-4" />}
                </Button>
            </CardFooter>
        </Card>
    );
}