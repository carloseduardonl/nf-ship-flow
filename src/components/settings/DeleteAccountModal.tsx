import { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface DeleteAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail: string;
}

export function DeleteAccountModal({
  open,
  onOpenChange,
  userEmail,
}: DeleteAccountModalProps) {
  const navigate = useNavigate();
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirmText !== "EXCLUIR MINHA CONTA") {
      toast.error("Digite o texto de confirmação corretamente");
      return;
    }

    setIsDeleting(true);
    try {
      // Desativar conta (em vez de excluir completamente)
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Usuário não encontrado");

      // Marcar como inativo
      const { error: updateError } = await supabase
        .from("users")
        .update({ is_active: false })
        .eq("id", userData.user.id);

      if (updateError) throw updateError;

      // Fazer logout
      await supabase.auth.signOut();

      toast.success("Conta desativada com sucesso");
      navigate("/login");
    } catch (error: any) {
      console.error("Error deleting account:", error);
      toast.error(error.message || "Erro ao excluir conta");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir Conta</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação é permanente e não pode ser desfeita. Todos os seus dados
            serão removidos.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Atenção!</strong> Ao excluir sua conta, você perderá acesso a
            todas as entregas e dados associados.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="confirmText">
            Digite <strong>EXCLUIR MINHA CONTA</strong> para confirmar:
          </Label>
          <Input
            id="confirmText"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="EXCLUIR MINHA CONTA"
          />
        </div>

        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setConfirmText("");
              onOpenChange(false);
            }}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || confirmText !== "EXCLUIR MINHA CONTA"}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Excluindo...
              </>
            ) : (
              "Excluir Conta"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
