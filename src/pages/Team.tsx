import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Loader2, MoreVertical, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTeam } from "@/hooks/useTeam";
import { InviteMemberModal } from "@/components/team/InviteMemberModal";
import { toast } from "sonner";

const Team = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { teamMembers, loading, updateMemberStatus, updateMemberRole, refetch } =
    useTeam();
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Proteger rota - apenas ADMIN pode acessar
  useEffect(() => {
    if (!loading && profile?.role !== "ADMIN") {
      toast.error("Você não tem permissão para acessar esta página");
      navigate("/dashboard");
    }
  }, [profile, loading, navigate]);

  const handleToggleStatus = async (memberId: string, currentStatus: boolean) => {
    const success = await updateMemberStatus(memberId, !currentStatus);
    if (success) {
      toast.success(
        `Membro ${!currentStatus ? "ativado" : "desativado"} com sucesso`
      );
    } else {
      toast.error("Erro ao atualizar status do membro");
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Não renderizar nada se não for admin (enquanto redireciona)
  if (profile?.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Equipe</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie os membros da sua equipe
          </p>
        </div>
        <Button onClick={() => setShowInviteModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Convidar Membro
        </Button>
      </div>

      {teamMembers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Nenhum membro na equipe</h2>
          <p className="text-muted-foreground mb-4">
            Convide membros para colaborar na gestão de entregas
          </p>
          <Button onClick={() => setShowInviteModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Convidar Primeiro Membro
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Membro</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Permissão</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {getInitials(member.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{member.full_name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {member.email}
                  </TableCell>
                  <TableCell>
                    <Badge variant={member.role === "ADMIN" ? "default" : "secondary"}>
                      {member.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={member.is_active ? "default" : "outline"}
                      className={
                        member.is_active
                          ? "bg-green-500 hover:bg-green-600"
                          : ""
                      }
                    >
                      {member.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {member.id !== profile?.id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              handleToggleStatus(member.id, member.is_active)
                            }
                          >
                            {member.is_active ? "Desativar" : "Ativar"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              // Implementar remoção
                              toast.info("Funcionalidade em desenvolvimento");
                            }}
                          >
                            Remover
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <InviteMemberModal
        open={showInviteModal}
        onOpenChange={setShowInviteModal}
        companyId={profile?.company_id || ""}
        onInvited={refetch}
      />
    </div>
  );
};

export default Team;
