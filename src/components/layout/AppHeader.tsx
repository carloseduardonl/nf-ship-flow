import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useNavigate } from "react-router-dom";
import { NotificationsDropdown } from "./NotificationsDropdown";

interface AppHeaderProps {
  userName?: string;
  companyName?: string;
  onSignOut: () => void;
}

export function AppHeader({ userName, companyName, onSignOut }: AppHeaderProps) {
  const navigate = useNavigate();
  const initials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <header className="sticky top-0 z-50 h-14 md:h-16 border-b bg-background shadow-sm">
      <div className="flex h-full items-center px-3 md:px-4 gap-2 md:gap-4">
        <SidebarTrigger className="h-8 w-8" />

        <div className="flex items-center gap-2 flex-1 justify-center md:justify-start">
          <div className="bg-primary rounded-full p-1.5">
            <Package className="h-4 w-4 md:h-5 md:w-5 text-primary-foreground" />
          </div>
          <span className="text-base md:text-xl font-bold text-primary">
            NF Scheduler
          </span>
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          <NotificationsDropdown />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 md:h-10 md:w-10 rounded-full">
                <Avatar className="h-8 w-8 md:h-10 md:w-10">
                  <AvatarFallback className="bg-secondary text-secondary-foreground text-xs md:text-sm">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{userName || "Usuário"}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {companyName || "Empresa"}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/configuracoes")}>
                Configurações
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onSignOut}>Sair</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
