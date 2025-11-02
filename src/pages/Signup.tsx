import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Loader2, Package, ArrowLeft, ArrowRight } from "lucide-react";
import { maskCNPJ, maskPhone, unmask } from "@/lib/masks";

const signupSchema = z.object({
  fullName: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  confirmPassword: z.string(),
  companyName: z.string().min(3, "Nome da empresa deve ter no mínimo 3 caracteres"),
  cnpj: z.string().min(18, "CNPJ inválido"),
  companyPhone: z.string().min(14, "Telefone inválido"),
  companyEmail: z.string().email("Email inválido"),
  companyType: z.enum(["VENDEDOR", "COMPRADOR", "AMBOS"]),
  address: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não conferem",
  path: ["confirmPassword"],
});

type SignupFormData = z.infer<typeof signupSchema>;

const Signup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    trigger,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      companyType: "VENDEDOR",
    },
  });

  const companyType = watch("companyType");
  const cnpj = watch("cnpj");
  const companyPhone = watch("companyPhone");

  const handleNextStep = async () => {
    let fieldsToValidate: (keyof SignupFormData)[] = [];
    
    if (step === 1) {
      fieldsToValidate = ["fullName", "email", "password", "confirmPassword"];
    } else if (step === 2) {
      fieldsToValidate = ["companyName", "cnpj", "companyPhone", "companyEmail"];
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep(step + 1);
    }
  };

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    try {
      // 1. Criar usuário no Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            full_name: data.fullName,
            company_name: data.companyName,
            cnpj: unmask(data.cnpj),
            company_phone: unmask(data.companyPhone),
            company_email: data.companyEmail,
            company_type: data.companyType,
            address: data.address || "",
          },
        },
      });

      if (signUpError) throw signUpError;

      if (!authData.user) {
        throw new Error("Erro ao criar usuário");
      }

      // 2. Criar empresa
      const { data: companyData, error: companyError } = await supabase
        .from("companies")
        .insert({
          name: data.companyName,
          cnpj: unmask(data.cnpj),
          email: data.companyEmail,
          phone: unmask(data.companyPhone),
          address: data.address || null,
          type: data.companyType,
        })
        .select()
        .single();

      if (companyError) throw companyError;

      // 3. Criar perfil do usuário
      const { error: userError } = await supabase.from("users").insert({
        id: authData.user.id,
        company_id: companyData.id,
        full_name: data.fullName,
        email: data.email,
        role: "ADMIN",
        is_active: true,
      });

      if (userError) throw userError;

      toast.success("Conta criada com sucesso! Verifique seu email.");
      navigate("/login");
    } catch (error: any) {
      console.error("Signup error:", error);
      toast.error(error.message || "Erro ao criar conta");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="bg-secondary rounded-full p-3">
              <Package className="h-8 w-8 text-secondary-foreground" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">Criar Conta</CardTitle>
          <CardDescription>
            Passo {step} de 3 - {step === 1 ? "Dados Pessoais" : step === 2 ? "Dados da Empresa" : "Tipo de Empresa"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome Completo</Label>
                  <Input
                    id="fullName"
                    placeholder="Seu nome completo"
                    {...register("fullName")}
                  />
                  {errors.fullName && (
                    <p className="text-sm text-destructive">{errors.fullName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    {...register("password")}
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    {...register("confirmPassword")}
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                  )}
                </div>

                <Button type="button" className="w-full" onClick={handleNextStep}>
                  Próximo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </>
            )}

            {step === 2 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nome da Empresa</Label>
                  <Input
                    id="companyName"
                    placeholder="Nome da sua empresa"
                    {...register("companyName")}
                  />
                  {errors.companyName && (
                    <p className="text-sm text-destructive">{errors.companyName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
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
                  <Label htmlFor="companyPhone">Telefone</Label>
                  <Input
                    id="companyPhone"
                    placeholder="(00) 00000-0000"
                    value={companyPhone || ""}
                    onChange={(e) => setValue("companyPhone", maskPhone(e.target.value))}
                  />
                  {errors.companyPhone && (
                    <p className="text-sm text-destructive">{errors.companyPhone.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyEmail">Email da Empresa</Label>
                  <Input
                    id="companyEmail"
                    type="email"
                    placeholder="contato@empresa.com"
                    {...register("companyEmail")}
                  />
                  {errors.companyEmail && (
                    <p className="text-sm text-destructive">{errors.companyEmail.message}</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setStep(1)}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar
                  </Button>
                  <Button type="button" className="flex-1" onClick={handleNextStep}>
                    Próximo
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="space-y-4">
                  <Label>Tipo de Empresa</Label>
                  <RadioGroup
                    value={companyType}
                    onValueChange={(value) => setValue("companyType", value as any)}
                  >
                    <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-accent cursor-pointer">
                      <RadioGroupItem value="VENDEDOR" id="vendedor" />
                      <Label htmlFor="vendedor" className="flex-1 cursor-pointer">
                        <div className="font-semibold">Sou Vendedor</div>
                        <div className="text-sm text-muted-foreground">
                          Envio notas fiscais para meus clientes
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-accent cursor-pointer">
                      <RadioGroupItem value="COMPRADOR" id="comprador" />
                      <Label htmlFor="comprador" className="flex-1 cursor-pointer">
                        <div className="font-semibold">Sou Comprador</div>
                        <div className="text-sm text-muted-foreground">
                          Recebo notas fiscais dos meus fornecedores
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-accent cursor-pointer">
                      <RadioGroupItem value="AMBOS" id="ambos" />
                      <Label htmlFor="ambos" className="flex-1 cursor-pointer">
                        <div className="font-semibold">Ambos (Compro e Vendo)</div>
                        <div className="text-sm text-muted-foreground">
                          Trabalho como vendedor e comprador
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Endereço (opcional)</Label>
                  <Input
                    id="address"
                    placeholder="Rua, número, bairro, cidade - UF"
                    {...register("address")}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setStep(2)}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar
                  </Button>
                  <Button type="submit" className="flex-1 bg-secondary hover:bg-secondary/90" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      "Criar Conta"
                    )}
                  </Button>
                </div>
              </>
            )}

            <div className="text-center text-sm">
              Já tem uma conta?{" "}
              <Link to="/login" className="text-primary font-semibold hover:underline">
                Fazer login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Signup;
