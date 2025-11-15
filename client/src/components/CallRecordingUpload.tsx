import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileAudio, X, Loader2, CheckCircle2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface CallRecordingUploadProps {
  campaignId: number;
  onUploadComplete?: () => void;
}

export default function CallRecordingUpload({ campaignId, onUploadComplete }: CallRecordingUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = trpc.callRecordings.upload.useMutation({
    onSuccess: () => {
      toast.success("Call recording uploaded successfully");
      setSelectedFile(null);
      setUploading(false);
      onUploadComplete?.();
    },
    onError: (error) => {
      toast.error(`Upload failed: ${error.message}`);
      setUploading(false);
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/m4a", "audio/ogg"];
      if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|m4a|ogg)$/i)) {
        toast.error("Please select a valid audio file (MP3, WAV, M4A, OGG)");
        return;
      }

      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast.error("File size must be less than 50MB");
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);

    try {
      // Read file as base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        const base64Data = base64.split(",")[1]; // Remove data:audio/...;base64, prefix

        await uploadMutation.mutateAsync({
          campaignId,
          fileName: selectedFile.name,
          fileData: base64Data,
          fileSize: selectedFile.size,
        });
      };
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      console.error("Upload error:", error);
      setUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileAudio className="h-5 w-5" />
          Upload Call Recording
        </CardTitle>
        <CardDescription>
          Upload sales call recordings to train your Virtual LLM
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
          {!selectedFile ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <Upload className="h-12 w-12 text-slate-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-2">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-slate-500">
                  MP3, WAV, M4A, OGG (max 50MB)
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,.mp3,.wav,.m4a,.ogg"
                onChange={handleFileSelect}
                className="hidden"
                id="call-recording-upload"
              />
              <label htmlFor="call-recording-upload">
                <Button variant="outline" asChild>
                  <span>Select File</span>
                </Button>
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileAudio className="h-8 w-8 text-blue-600" />
                  <div className="text-left">
                    <p className="font-medium text-sm">{selectedFile.name}</p>
                    <p className="text-xs text-slate-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                {!uploading && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <Button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full"
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Upload Recording
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        <div className="text-xs text-slate-500 space-y-1">
          <p>• Recordings will be automatically transcribed</p>
          <p>• Transcripts will be used to train your Virtual LLM</p>
          <p>• All data is securely stored and encrypted</p>
        </div>
      </CardContent>
    </Card>
  );
}
