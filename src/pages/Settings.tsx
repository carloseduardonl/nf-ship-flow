import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2, KeyRound, Shield, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AvatarUpload } from "@/components/settings/AvatarUpload";
import { ChangePasswordModal } from "@/components/settings/ChangePasswordModal";
import { DeleteAccountModal } from "@/components/settings/DeleteAccountModal";
import { maskCNPJ, maskPhone } from "@/lib/masks";

const profileSchema = z.object({
  full_name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  phone: z.string().optional(),
});

const companySchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  address: z.string().optional(),
  type: z.enum(["VENDEDOR", "COMPRADOR", "AMBOS"]),
});

type ProfileFormData = z.infer<typeof profileSchema>;
type CompanyFormData = z.infer<typeof companySchema>;

const Settings = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState<any>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notificationPrefs, setNotificationPrefs] = useState({
    email_ball_with_me: true,
    email_delivery_confirmed: true,
    email_message_received: true,
    email_daily_summary: false,
    push_notifications: false,
  });

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  const companyForm = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
  });

  useEffect(() => {
    if (profile) {
      profileForm.reset({
        full_name: profile.full_name,
        phone: profile.phone || "",
      });
      setAvatarUrl(profile.avatar_url);
      setNotificationPrefs(
        profile.notification_preferences || notificationPrefs
      );
    }
  }, [profile]);

  useEffect(() => {
    const fetchCompany = async () => {
      if (!profile?.company_id) return;

      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("id", profile.company_id)
        .single();

      if (!error && data) {
        setCompany(data);
        companyForm.reset({
          name: data.name,
          email: data.email,
          phone: data.phone || "",
          address: data.address || "",
          type: data.type as "VENDEDOR" | "COMPRADOR" | "AMBOS",
        });
      }
    };

    fetchCompany();
  }, [profile?.company_id]);

  const onProfileSubmit = async (data: ProfileFormData) => {
    if (!profile?.id) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("users")
        .update({
          full_name: data.full_name,
          phone: data.phone || null,
        })
        .eq("id", profile.id);

      if (error) throw error;

      toast.success("Perfil atualizado com sucesso!");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Erro ao atualizar perfil");
    } finally {
      setLoading(false);
    }
  };

  const onCompanySubmit = async (data: CompanyFormData) => {
    if (!profile?.company_id) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("companies")
        .update({
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          address: data.address || null,
          type: data.type,
        })
        .eq("id", profile.company_id);

      if (error) throw error;

      toast.success("Dados da empresa atualizados com sucesso!");
    } catch (error: any) {
      console.error("Error updating company:", error);
      toast.error(error.message || "Erro ao atualizar empresa");
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationChange = async (key: string, value: boolean) => {
    if (!profile?.id) return;

    const newPrefs = { ...notificationPrefs, [key]: value };
    setNotificationPrefs(newPrefs);

    try {
      const { error } = await supabase
        .from("users")
        .update({ notification_preferences: newPrefs })
        .eq("id", profile.id);

      if (error) throw error;

      toast.success("Preferências de notificação atualizadas!");
    } catch (error: any) {
      console.error("Error updating notifications:", error);
      toast.error("Erro ao atualizar preferências");
    }
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie suas preferências e informações da conta
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          {profile.role === "ADMIN" && (
            <TabsTrigger value="company">Empresa</TabsTrigger>
          )}
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Perfil</CardTitle>
              <CardDescription>
                Atualize suas informações pessoais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <AvatarUpload
                userId={profile.id}
                currentAvatarUrl={avatarUrl}
                userName={profile.full_name}
                onUploadComplete={setAvatarUrl}
              />

              <Separator />

              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">
                    Nome Completo <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="full_name"
                    {...profileForm.register("full_name")}
                  />
                  {profileForm.formState.errors.full_name && (
                    <p className="text-sm text-destructive">
                      {profileForm.formState.errors.full_name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={profile.email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    O email não pode ser alterado
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    placeholder="(00) 00000-0000"
                    {...profileForm.register("phone")}
                  />
                </div>

                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar Alterações"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {profile.role === "ADMIN" && (
          <TabsContent value="company">
            <Card>
              <CardHeader>
                <CardTitle>Informações da Empresa</CardTitle>
                <CardDescription>
                  Gerencie os dados da sua empresa
                </CardDescription>
              </CardHeader>
              <CardContent>
                {company ? (
                  <form onSubmit={companyForm.handleSubmit(onCompanySubmit)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="company_name">
                        Nome da Empresa <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="company_name"
                        {...companyForm.register("name")}
                      />
                      {companyForm.formState.errors.name && (
                        <p className="text-sm text-destructive">
                          {companyForm.formState.errors.name.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="company_cnpj">CNPJ</Label>
                      <Input
                        id="company_cnpj"
                        value={maskCNPJ(company.cnpj)}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">
                        O CNPJ não pode ser alterado
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="company_email">Email</Label>
                      <Input
                        id="company_email"
                        type="email"
                        {...companyForm.register("email")}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="company_phone">Telefone</Label>
                      <Input
                        id="company_phone"
                        placeholder="(00) 00000-0000"
                        {...companyForm.register("phone")}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="company_address">Endereço Completo</Label>
                      <Input
                        id="company_address"
                        placeholder="Rua, número, bairro, cidade - UF"
                        {...companyForm.register("address")}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="company_type">Tipo</Label>
                      <Select
                        value={companyForm.watch("type")}
                        onValueChange={(value) =>
                          companyForm.setValue("type", value as any)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="VENDEDOR">Vendedor</SelectItem>
                          <SelectItem value="COMPRADOR">Comprador</SelectItem>
                          <SelectItem value="AMBOS">Ambos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button type="submit" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        "Salvar Alterações"
                      )}
                    </Button>
                  </form>
                ) : (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Preferências de Notificação</CardTitle>
              <CardDescription>
                Escolha como deseja ser notificado sobre atualizações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3 space-y-0">
                <Checkbox
                  id="email_ball_with_me"
                  checked={notificationPrefs.email_ball_with_me}
                  onCheckedChange={(checked) =>
                    handleNotificationChange("email_ball_with_me", checked as boolean)
                  }
                />
                <div className="space-y-1 leading-none">
                  <Label htmlFor="email_ball_with_me" className="cursor-pointer">
                    Receber email quando a bola está comigo
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Notifica quando uma entrega precisa da sua ação
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 space-y-0">
                <Checkbox
                  id="email_delivery_confirmed"
                  checked={notificationPrefs.email_delivery_confirmed}
                  onCheckedChange={(checked) =>
                    handleNotificationChange("email_delivery_confirmed", checked as boolean)
                  }
                />
                <div className="space-y-1 leading-none">
                  <Label htmlFor="email_delivery_confirmed" className="cursor-pointer">
                    Receber email quando entrega é confirmada
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Notifica sobre confirmações de data e horário
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 space-y-0">
                <Checkbox
                  id="email_message_received"
                  checked={notificationPrefs.email_message_received}
                  onCheckedChange={(checked) =>
                    handleNotificationChange("email_message_received", checked as boolean)
                  }
                />
                <div className="space-y-1 leading-none">
                  <Label htmlFor="email_message_received" className="cursor-pointer">
                    Receber email quando recebo mensagem
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Notifica sobre novas mensagens no chat da entrega
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 space-y-0">
                <Checkbox
                  id="email_daily_summary"
                  checked={notificationPrefs.email_daily_summary}
                  onCheckedChange={(checked) =>
                    handleNotificationChange("email_daily_summary", checked as boolean)
                  }
                />
                <div className="space-y-1 leading-none">
                  <Label htmlFor="email_daily_summary" className="cursor-pointer">
                    Receber email de resumo diário
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receba um resumo diário de todas as suas entregas
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 space-y-0">
                <Checkbox
                  id="push_notifications"
                  checked={notificationPrefs.push_notifications}
                  onCheckedChange={(checked) =>
                    handleNotificationChange("push_notifications", checked as boolean)
                  }
                  disabled
                />
                <div className="space-y-1 leading-none opacity-50">
                  <Label htmlFor="push_notifications">
                    Notificações push no navegador
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Em breve - Receba notificações direto no navegador
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Segurança da Conta</CardTitle>
              <CardDescription>
                Gerencie a segurança e privacidade da sua conta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-3">Senha</h3>
                <Button
                  variant="outline"
                  onClick={() => setShowPasswordModal(true)}
                >
                  <KeyRound className="mr-2 h-4 w-4" />
                  Alterar Senha
                </Button>
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-medium mb-3">
                  Autenticação de Dois Fatores
                </h3>
                <Button variant="outline" disabled>
                  <Shield className="mr-2 h-4 w-4" />
                  Ativar 2FA (Em breve)
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Adicione uma camada extra de segurança à sua conta
                </p>
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-medium mb-3 text-destructive">
                  Zona de Perigo
                </h3>
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteModal(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir Minha Conta
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Esta ação é permanente e não pode ser desfeita
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ChangePasswordModal
        open={showPasswordModal}
        onOpenChange={setShowPasswordModal}
      />

      <DeleteAccountModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        userEmail={profile.email}
      />
    </div>
  );
};

export default Settings;
