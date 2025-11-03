import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Upload, File, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onUploadComplete: (url: string, fileName: string) => void;
  value?: string;
  fileName?: string;
}

export function FileUpload({ onUploadComplete, value, fileName }: FileUploadProps) {
  const { profile } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | undefined>(fileName);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      if (file.size > 10 * 1024 * 1024) {
        toast.error("Arquivo muito grande. Máximo 10MB.");
        return;
      }

      if (file.type !== "application/pdf") {
        toast.error("Apenas arquivos PDF são aceitos.");
        return;
      }

      setUploading(true);
      try {
        const fileExt = file.name.split(".").pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `${profile?.company_id}/nfs/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("nf-documents")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("nf-documents").getPublicUrl(filePath);

        setUploadedFile(file.name);
        onUploadComplete(filePath, file.name);
        toast.success("Arquivo enviado com sucesso!");
      } catch (error: any) {
        console.error("Error uploading file:", error);
        toast.error(error.message || "Erro ao enviar arquivo");
      } finally {
        setUploading(false);
      }
    },
    [profile?.company_id, onUploadComplete]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
    disabled: uploading,
  });

  const handleRemove = () => {
    setUploadedFile(undefined);
    onUploadComplete("", "");
  };

  if (uploadedFile) {
    return (
      <div className="flex items-center justify-between p-4 border rounded-lg bg-accent">
        <div className="flex items-center gap-3">
          <File className="h-8 w-8 text-primary" />
          <div>
            <p className="font-medium text-sm">{uploadedFile}</p>
            <p className="text-xs text-muted-foreground">PDF enviado</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRemove}
          disabled={uploading}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
        isDragActive
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-primary hover:bg-accent",
        uploading && "pointer-events-none opacity-50"
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-2">
        {uploading ? (
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        ) : (
          <Upload className="h-12 w-12 text-muted-foreground" />
        )}
        <div>
          <p className="font-medium">
            {uploading
              ? "Enviando arquivo..."
              : isDragActive
              ? "Solte o arquivo aqui"
              : "Arraste o PDF da NF ou clique para selecionar"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Apenas PDF, máximo 10MB
          </p>
        </div>
      </div>
    </div>
  );
}
