import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, ArrowLeft, Loader2 } from "lucide-react";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { maskCEP } from "@/lib/cep";
import { brazilianStates } from "@/lib/brazilianStates";
import { unmask } from "@/lib/masks";

const step3Schema = z.object({
  useCompanyAddress: z.boolean(),
  street: z.string().min(3, "Rua/Avenida é obrigatório"),
  number: z.string().min(1, "Número é obrigatório"),
  complement: z.string().optional(),
  neighborhood: z.string().min(2, "Bairro é obrigatório"),
  city: z.string().min(2, "Cidade é obrigatória"),
  state: z.string().min(2, "Estado é obrigatório"),
  postalCode: z.string().min(9, "CEP inválido"),
  proposedDate: z.date({
    required_error: "Data é obrigatória",
  }).refine((date) => date > new Date(), {
    message: "Data deve ser futura",
  }),
  proposedTimeStart: z.string().min(1, "Horário de início é obrigatório"),
  proposedTimeEnd: z.string().min(1, "Horário de fim é obrigatório"),
  notes: z.string().optional(),
}).refine((data) => {
  const [startHour, startMin] = data.proposedTimeStart.split(":").map(Number);
  const [endHour, endMin] = data.proposedTimeEnd.split(":").map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  return endMinutes > startMinutes && (endMinutes - startMinutes) >= 60;
}, {
  message: "Horário de fim deve ser pelo menos 1h após o início",
  path: ["proposedTimeEnd"],
});

type Step3FormData = z.infer<typeof step3Schema>;

interface Step3DeliveryDetailsProps {
  buyerCompanyAddress?: string | null;
  onSubmit: (data: Step3FormData) => Promise<void>;
  onBack: () => void;
}

export function Step3DeliveryDetails({
  buyerCompanyAddress,
  onSubmit,
  onBack,
}: Step3DeliveryDetailsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useCompanyAddress, setUseCompanyAddress] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<Step3FormData>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      useCompanyAddress: false,
    },
  });

  const proposedDate = watch("proposedDate");
  const postalCode = watch("postalCode");

  useEffect(() => {
    if (useCompanyAddress && buyerCompanyAddress) {
      // Simple address parsing - in production you'd want more sophisticated parsing
      const parts = buyerCompanyAddress.split(",").map(s => s.trim());
      if (parts.length >= 1) setValue("street", parts[0]);
      if (parts.length >= 2) setValue("neighborhood", parts[1]);
      if (parts.length >= 3) {
        const cityState = parts[2].split("-").map(s => s.trim());
        if (cityState.length >= 1) setValue("city", cityState[0]);
        if (cityState.length >= 2) setValue("state", cityState[1]);
      }
    }
  }, [useCompanyAddress, buyerCompanyAddress, setValue]);

  const handleFormSubmit = async (data: Step3FormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nova Entrega - Passo 3 de 3</CardTitle>
        <CardDescription>Onde e quando entregar?</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Endereço de Entrega</h3>

            {buyerCompanyAddress && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="useCompanyAddress"
                  checked={useCompanyAddress}
                  onCheckedChange={(checked) => {
                    setUseCompanyAddress(checked as boolean);
                    setValue("useCompanyAddress", checked as boolean);
                  }}
                />
                <Label htmlFor="useCompanyAddress" className="cursor-pointer">
                  Usar endereço da empresa compradora
                </Label>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="street">
                  Rua/Avenida <span className="text-destructive">*</span>
                </Label>
                <Input id="street" {...register("street")} />
                {errors.street && (
                  <p className="text-sm text-destructive">{errors.street.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="number">
                  Número <span className="text-destructive">*</span>
                </Label>
                <Input id="number" {...register("number")} />
                {errors.number && (
                  <p className="text-sm text-destructive">{errors.number.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="complement">Complemento</Label>
                <Input id="complement" {...register("complement")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="neighborhood">
                  Bairro <span className="text-destructive">*</span>
                </Label>
                <Input id="neighborhood" {...register("neighborhood")} />
                {errors.neighborhood && (
                  <p className="text-sm text-destructive">{errors.neighborhood.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">
                  Cidade <span className="text-destructive">*</span>
                </Label>
                <Input id="city" {...register("city")} />
                {errors.city && (
                  <p className="text-sm text-destructive">{errors.city.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">
                  Estado <span className="text-destructive">*</span>
                </Label>
                <Select onValueChange={(value) => setValue("state", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {brazilianStates.map((state) => (
                      <SelectItem key={state.value} value={state.value}>
                        {state.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.state && (
                  <p className="text-sm text-destructive">{errors.state.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="postalCode">
                  CEP <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="postalCode"
                  placeholder="00000-000"
                  value={postalCode || ""}
                  onChange={(e) => setValue("postalCode", maskCEP(e.target.value))}
                />
                {errors.postalCode && (
                  <p className="text-sm text-destructive">{errors.postalCode.message}</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Data e Horário Propostos</h3>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>
                  Data da Entrega <span className="text-destructive">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !proposedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {proposedDate ? (
                        format(proposedDate, "PPP", { locale: ptBR })
                      ) : (
                        <span>Selecione a data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={proposedDate}
                      onSelect={(date) => setValue("proposedDate", date as Date)}
                      disabled={(date) => date <= new Date()}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                {errors.proposedDate && (
                  <p className="text-sm text-destructive">{errors.proposedDate.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="proposedTimeStart">
                  Horário de Início <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="proposedTimeStart"
                  type="time"
                  {...register("proposedTimeStart")}
                />
                {errors.proposedTimeStart && (
                  <p className="text-sm text-destructive">{errors.proposedTimeStart.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="proposedTimeEnd">
                  Horário de Fim <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="proposedTimeEnd"
                  type="time"
                  {...register("proposedTimeEnd")}
                />
                {errors.proposedTimeEnd && (
                  <p className="text-sm text-destructive">{errors.proposedTimeEnd.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                placeholder="Informações adicionais sobre a entrega..."
                rows={4}
                {...register("notes")}
              />
            </div>
          </div>

          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              disabled={isSubmitting}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando proposta...
                </>
              ) : (
                "Enviar Proposta"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
