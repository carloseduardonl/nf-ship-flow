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
import { toast } from "sonner";

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
  const { formData, updateFormData, currentStep, setCurrentStep } = useDeliveryForm();

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
    // TODO: Navigate to step 2 when implemented
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <FormStepper currentStep={currentStep} totalSteps={3} />

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
