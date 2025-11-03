import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const inviteMemberSchema = z.object({
  email: z.string().email("Email inválido"),
  fullName: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  role: z.enum(["ADMIN", "USER"]),
});

type InviteMemberFormData = z.infer<typeof inviteMemberSchema>;

interface InviteMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  onInvited: () => void;
}

export function InviteMemberModal({
  open,
  onOpenChange,
  companyId,
  onInvited,
}: InviteMemberModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<InviteMemberFormData>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: {
      role: "USER",
    },
  });

  const role = watch("role");

  const onSubmit = async (data: InviteMemberFormData) => {
    setIsSubmitting(true);
    try {
      // Chamar edge function para convidar usuário
      const { data: inviteData, error } = await supabase.functions.invoke(
        "invite-team-member",
        {
          body: {
            email: data.email,
            fullName: data.fullName,
            role: data.role,
            companyId,
          },
        }
      );

      if (error) throw error;

      toast.success("Convite enviado com sucesso!");
      reset();
      onOpenChange(false);
      onInvited();
    } catch (error: any) {
      console.error("Error inviting member:", error);
      toast.error(error.message || "Erro ao enviar convite");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Convidar novo membro</DialogTitle>
          <DialogDescription>
            O membro receberá um email com instruções para acessar o sistema
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="colaborador@empresa.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">
              Nome completo <span className="text-destructive">*</span>
            </Label>
            <Input
              id="fullName"
              placeholder="João da Silva"
              {...register("fullName")}
            />
            {errors.fullName && (
              <p className="text-sm text-destructive">
                {errors.fullName.message}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Label>Permissão</Label>
            <RadioGroup
              value={role}
              onValueChange={(value) => setValue("role", value as "ADMIN" | "USER")}
            >
              <div className="flex items-start space-x-3 space-y-0">
                <RadioGroupItem value="ADMIN" id="admin" />
                <div className="space-y-1">
                  <Label htmlFor="admin" className="font-medium cursor-pointer">
                    Administrador
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Pode gerenciar equipe e empresa
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3 space-y-0">
                <RadioGroupItem value="USER" id="user" />
                <div className="space-y-1">
                  <Label htmlFor="user" className="font-medium cursor-pointer">
                    Usuário
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Pode criar e gerenciar entregas
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar Convite"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
