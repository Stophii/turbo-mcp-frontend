'use client';

import { useState, useEffect } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function MCPTool() {
  const [question, setQuestion] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [response, setResponse] = useState('');
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (cooldown !== null && cooldown > 0) {
      const interval = setInterval(() => {
        setCooldown((prev) => (prev !== null && prev > 0 ? prev - 1 : null));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [cooldown]);

  const handleQuestionSubmit = async () => {
    if (!question || files.length === 0) {
      setError("Please provide both a question and files.");
      return;
    }

    setIsLoading(true);
    setError('');
    setResponse('');

    const fileContents = await Promise.all(
      files.map(file => {
        return new Promise<{ name: string; content: string }>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve({ name: file.name, content: reader.result as string });
          reader.onerror = () => reject(new Error("File read error"));
          reader.readAsText(file);
        });
      })
    );

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
      const res = await fetch(`${baseUrl}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, files: fileContents }),
      });


      const data = await res.json();

      if (res.status === 429 || data?.error?.toLowerCase().includes("rate limit")) {
        const retryAfter = parseInt(data.retryAfter || "120", 10);
        console.warn(`Rate limit hit. Retry in ${retryAfter} seconds`);
        setCooldown(retryAfter);
        setError("I need a sec! — ask again after the cooldown is done.");
      } else if (!res.ok) {
        setError(data.error || "Unexpected error from server.");
      } else {
        setResponse(data.answer || "No answer returned.");
      }
    } catch (err) {
      console.error("Fetch failed:", err);
      setError("Error sending request.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearFiles = () => {
    setFiles([]);
    setResponse('');
    setError('');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-900 text-white px-4">
      <Card className="w-full max-w-3xl bg-zinc-800 text-white">
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <button
              onClick={handleClearFiles}
              className={`font-medium px-3 py-2 rounded ${
                files.length === 0
                  ? 'bg-green-700 hover:bg-green-500 text-white'
                  : 'bg-red-700 hover:bg-red-500 text-white'
              }`}
            >
              {files.length === 0 ? '✅ Cache Empty' : '❌ Clear Files'}
            </button>

            <label className="cursor-pointer bg-blue-700 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded inline-block text-center">
              📁 Upload your Turbo project&apos;s src folder
              <input
                type="file"
                multiple
                style={{ display: 'none' }}
                ref={(input) => {
                  if (input) {
                    (input as any).webkitdirectory = true;
                    (input as any).directory = true;
                  }
                }}
                onChange={(e) => {
                  if (e.target.files) {
                    setFiles(Array.from(e.target.files));
                    setError('');
                  }
                }}
              />
            </label>
          </div>

          {files.length > 0 && (
            <p className="text-green-400">{files.length} .rs files ready!</p>
          )}
          {error && <p className="text-red-400">{error}</p>}
          {response && (
            <pre className="whitespace-pre-wrap p-4 bg-zinc-800 rounded text-sm text-white">{response}</pre>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 w-full max-w-3xl px-4">
        <div className="flex items-end gap-2">
          <TextareaAutosize
            minRows={1}
            maxRows={6}
            placeholder="Upload your project src folder and ask a question!"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="flex-grow resize-none rounded-lg border-0 px-4 py-3 bg-zinc-800 text-white focus:outline-none focus:ring focus:ring-blue-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleQuestionSubmit();
              }
            }}
          />
          <Button
            onClick={handleQuestionSubmit}
            disabled={(cooldown !== null && cooldown > 0) || isLoading}
          >
            {cooldown !== null && cooldown > 0
              ? `Wait ${Math.floor(cooldown / 60)}m ${cooldown % 60}s`
              : isLoading
              ? 'Thinking…'
              : 'Send'}
          </Button>
        </div>
        <p className="text-xs text-gray-400 text-center mt-2">
          ⚠️ This tool is best used with small to mid sized projects. Large folders may exceed processing capacity.
        </p>
      </div>
    </div>
  );
}
