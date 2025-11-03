import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { formatCurrency, parseCurrency } from "@/lib/currency";
import { FileUpload } from "@/components/deliveries/FileUpload";
import { FormStepper } from "@/components/deliveries/FormStepper";
import { useDeliveryForm, DeliveryFormProvider } from "@/contexts/DeliveryFormContext";
import { Step2SelectBuyer } from "@/components/deliveries/Step2SelectBuyer";
import { Step3DeliveryDetails } from "@/components/deliveries/Step3DeliveryDetails";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { unmask } from "@/lib/masks";

const step1Schema = z.object({
  nfNumber: z.string().min(1, "Número da NF é obrigatório"),
  nfSeries: z.string().optional(),
  nfDate: z.date({
    required_error: "Data de emissão é obrigatória",
  }).refine((date) => date <= new Date(), {
    message: "Data não pode ser futura",
  }),
  nfValue: z.number().positive("Valor deve ser positivo"),
  nfFileUrl: z.string().min(1, "Upload do PDF é obrigatório"),
});

type Step1FormData = z.infer<typeof step1Schema>;

function NewDeliveryContent() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { formData, updateFormData, currentStep, setCurrentStep, resetForm } = useDeliveryForm();
  const [buyerCompany, setBuyerCompany] = useState<any>(null);

  useEffect(() => {
    if (formData.buyerCompanyId) {
      supabase
        .from("companies")
        .select("*")
        .eq("id", formData.buyerCompanyId)
        .single()
        .then(({ data }) => setBuyerCompany(data));
    }
  }, [formData.buyerCompanyId]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<Step1FormData>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      nfNumber: formData.nfNumber,
      nfSeries: formData.nfSeries,
      nfDate: formData.nfDate,
      nfValue: formData.nfValue,
      nfFileUrl: formData.nfFileUrl,
    },
  });

  const nfDate = watch("nfDate");
  const nfValue = watch("nfValue");
  const nfFileUrl = watch("nfFileUrl");

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value);
    e.target.value = formatted;
    const parsed = parseCurrency(formatted);
    setValue("nfValue", parsed);
  };

  const onSubmit = (data: Step1FormData) => {
    updateFormData({
      nfNumber: data.nfNumber,
      nfSeries: data.nfSeries || "",
      nfDate: data.nfDate,
      nfValue: data.nfValue,
      nfFileUrl: data.nfFileUrl,
    });
    toast.success("Dados da NF salvos!");
    setCurrentStep(2);
  };

  const handleStep2Next = () => {
    if (!formData.buyerCompanyId) {
      toast.error("Selecione uma empresa compradora");
      return;
    }
    toast.success("Comprador selecionado!");
    setCurrentStep(3);
  };

  const handleStep3Submit = async (data: any) => {
    if (!profile?.company_id || !profile.id) {
      toast.error("Erro: usuário não autenticado");
      return;
    }

    try {
      // 1. Create delivery
      const deliveryAddress = `${data.street}, ${data.number}${
        data.complement ? `, ${data.complement}` : ""
      }, ${data.neighborhood}, ${data.city} - ${data.state}`;

      const { data: delivery, error: deliveryError } = await supabase
        .from("deliveries")
        .insert({
          seller_company_id: profile.company_id,
          buyer_company_id: formData.buyerCompanyId,
          created_by_user_id: profile.id,
          nf_number: formData.nfNumber,
          nf_series: formData.nfSeries || null,
          nf_date: format(formData.nfDate!, "yyyy-MM-dd"),
          nf_value: formData.nfValue,
          nf_file_url: formData.nfFileUrl,
          delivery_address: deliveryAddress,
          delivery_city: data.city,
          delivery_state: data.state,
          delivery_postal_code: unmask(data.postalCode),
          proposed_date: format(data.proposedDate, "yyyy-MM-dd"),
          proposed_time_start: data.proposedTimeStart,
          proposed_time_end: data.proposedTimeEnd,
          notes: data.notes || null,
          status: "AGUARDANDO_COMPRADOR",
          ball_with: "COMPRADOR",
        })
        .select()
        .single();

      if (deliveryError) throw deliveryError;

      // 2. Create timeline entry
      const { error: timelineError } = await supabase
        .from("delivery_timeline")
        .insert({
          delivery_id: delivery.id,
          user_id: profile.id,
          action: "CREATED",
          description: `${profile.full_name} criou a entrega`,
        });

      if (timelineError) throw timelineError;

      // 3. Get buyer company users and create notifications
      const { data: buyerUsers } = await supabase
        .from("users")
        .select("id")
        .eq("company_id", formData.buyerCompanyId);

      if (buyerUsers && buyerUsers.length > 0) {
        const notifications = buyerUsers.map((user) => ({
          user_id: user.id,
          delivery_id: delivery.id,
          type: "BALL_WITH_YOU",
          title: "Nova entrega para confirmar",
          message: `NF ${formData.nfNumber} aguarda sua confirmação`,
        }));

        await supabase.from("notifications").insert(notifications);
      }

      toast.success("Proposta de entrega enviada com sucesso!");
      resetForm();
      navigate(`/entregas/${delivery.id}`);
    } catch (error: any) {
      console.error("Error creating delivery:", error);
      toast.error(error.message || "Erro ao criar entrega");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <FormStepper currentStep={currentStep} totalSteps={3} />

      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Nova Entrega - Passo 1 de 3</CardTitle>
            <CardDescription>Dados da Nota Fiscal</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nfNumber">
                  Número da NF <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nfNumber"
                  type="text"
                  placeholder="123456"
                  {...register("nfNumber")}
                />
                {errors.nfNumber && (
                  <p className="text-sm text-destructive">{errors.nfNumber.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nfSeries">Série</Label>
                <Input
                  id="nfSeries"
                  type="text"
                  placeholder="1"
                  {...register("nfSeries")}
                />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label>
                  Data de Emissão <span className="text-destructive">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !nfDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {nfDate ? (
                        format(nfDate, "PPP", { locale: ptBR })
                      ) : (
                        <span>Selecione a data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={nfDate}
                      onSelect={(date) => setValue("nfDate", date as Date)}
                      disabled={(date) => date > new Date()}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                {errors.nfDate && (
                  <p className="text-sm text-destructive">{errors.nfDate.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nfValue">
                  Valor da NF <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nfValue"
                  type="text"
                  placeholder="R$ 0,00"
                  onChange={handleValueChange}
                  defaultValue={nfValue ? formatCurrency(String(nfValue * 100)) : ""}
                />
                {errors.nfValue && (
                  <p className="text-sm text-destructive">{errors.nfValue.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>
                Upload do PDF da NF <span className="text-destructive">*</span>
              </Label>
              <FileUpload
                onUploadComplete={(url, fileName) => {
                  setValue("nfFileUrl", url);
                  updateFormData({ nfFileName: fileName });
                }}
                value={nfFileUrl}
                fileName={formData.nfFileName}
              />
              {errors.nfFileUrl && (
                <p className="text-sm text-destructive">{errors.nfFileUrl.message}</p>
              )}
            </div>

            <div className="flex gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/dashboard")}
              >
                Cancelar
              </Button>
              <Button type="submit">Próximo</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      )}

      {currentStep === 2 && (
        <Step2SelectBuyer
          selectedBuyerId={formData.buyerCompanyId}
          onSelectBuyer={(buyerId) => updateFormData({ buyerCompanyId: buyerId })}
          onNext={handleStep2Next}
          onBack={() => setCurrentStep(1)}
        />
      )}

      {currentStep === 3 && (
        <Step3DeliveryDetails
          buyerCompanyAddress={buyerCompany?.address}
          onSubmit={handleStep3Submit}
          onBack={() => setCurrentStep(2)}
        />
      )}
    </div>
  );
}

const NewDelivery = () => {
  return (
    <DeliveryFormProvider>
      <NewDeliveryContent />
    </DeliveryFormProvider>
  );
};

export default NewDelivery;
