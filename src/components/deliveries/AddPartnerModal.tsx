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
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { maskCNPJ, maskPhone, unmask } from "@/lib/masks";
import { validateCNPJ } from "@/lib/cnpj";

const addPartnerSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  cnpj: z
    .string()
    .min(18, "CNPJ inválido")
    .refine((val) => validateCNPJ(val), "CNPJ inválido"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type AddPartnerFormData = z.infer<typeof addPartnerSchema>;

interface AddPartnerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (data: Omit<AddPartnerFormData, "cnpj" | "phone"> & { cnpj: string; phone: string | null }) => Promise<string | null>;
}

export function AddPartnerModal({ open, onOpenChange, onAdd }: AddPartnerModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<AddPartnerFormData>({
    resolver: zodResolver(addPartnerSchema),
  });

  const cnpj = watch("cnpj");
  const phone = watch("phone");

  const onSubmit = async (data: AddPartnerFormData) => {
    setIsSubmitting(true);
    try {
      const companyId = await onAdd({
        name: data.name,
        cnpj: unmask(data.cnpj),
        email: data.email,
        phone: data.phone ? unmask(data.phone) : null,
        address: data.address || null,
      });

      if (companyId) {
        toast.success("Empresa parceira adicionada com sucesso!");
        reset();
        onOpenChange(false);
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao adicionar empresa");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Nova Empresa Parceira</DialogTitle>
          <DialogDescription>
            Cadastre uma nova empresa para realizar entregas
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Nome da Empresa <span className="text-destructive">*</span>
            </Label>
            <Input id="name" {...register("name")} />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cnpj">
              CNPJ <span className="text-destructive">*</span>
            </Label>
            <Input
              id="cnpj"
              placeholder="00.000.000/0000-00"
              value={cnpj || ""}
              onChange={(e) => setValue("cnpj", maskCNPJ(e.target.value))}
            />
            {errors.cnpj && (
              <p className="text-sm text-destructive">{errors.cnpj.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              placeholder="(00) 00000-0000"
              value={phone || ""}
              onChange={(e) => setValue("phone", maskPhone(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Endereço Completo</Label>
            <Input
              id="address"
              placeholder="Rua, número, bairro, cidade - UF"
              {...register("address")}
            />
          </div>

          <div className="flex gap-2 justify-end">
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
                  Adicionando...
                </>
              ) : (
                "Adicionar"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
