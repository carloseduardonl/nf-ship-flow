import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Package, Calendar, TruckIcon, CheckCircle } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary rounded-full p-2">
              <Package className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-primary">NF Scheduler</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/login">Entrar</Link>
            </Button>
            <Button asChild className="bg-secondary hover:bg-secondary/90">
              <Link to="/signup">Criar Conta</Link>
            </Button>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto space-y-8">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Agende Entregas B2B com Facilidade
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Sistema completo para gerenciar o agendamento de entregas entre vendedores e compradores.
            Simplifique sua logística e melhore a comunicação.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild className="bg-secondary hover:bg-secondary/90">
              <Link to="/signup">Começar Gratuitamente</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/login">Fazer Login</Link>
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20">
            <div className="bg-card p-6 rounded-lg border shadow-sm">
              <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Agendamento Fácil</h3>
              <p className="text-sm text-muted-foreground">
                Agende entregas de forma simples e rápida
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg border shadow-sm">
              <div className="bg-secondary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <TruckIcon className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Rastreamento</h3>
              <p className="text-sm text-muted-foreground">
                Acompanhe o status de todas as entregas
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg border shadow-sm">
              <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Gestão de NF</h3>
              <p className="text-sm text-muted-foreground">
                Organize suas notas fiscais em um só lugar
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg border shadow-sm">
              <div className="bg-secondary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Confirmação Rápida</h3>
              <p className="text-sm text-muted-foreground">
                Confirme entregas com poucos cliques
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
