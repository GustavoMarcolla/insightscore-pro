import { Settings, User, Building2, Bell, Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const configSections = [
  {
    icon: User,
    title: "Perfil do Usuário",
    description: "Gerencie suas informações pessoais e credenciais",
    action: "Editar Perfil",
  },
  {
    icon: Building2,
    title: "Dados da Empresa",
    description: "Configure as informações da sua organização",
    action: "Configurar",
  },
  {
    icon: Bell,
    title: "Notificações",
    description: "Defina suas preferências de alertas e comunicações",
    action: "Configurar",
  },
  {
    icon: Shield,
    title: "Segurança",
    description: "Gerencie senhas e configurações de acesso",
    action: "Configurar",
  },
];

export default function Configuracoes() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie as configurações do sistema
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {configSections.map((section) => (
          <Card key={section.title} className="card-section">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <section.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">{section.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {section.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                {section.action}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Score Configuration */}
      <div className="card-section">
        <div className="card-header-section">
          <h2 className="section-title">Motor de Pontuação</h2>
        </div>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Configure as faixas de classificação dos fornecedores baseadas no score.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-md border border-success bg-success/10 p-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-success" />
                <span className="font-medium text-success">Verde</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">80% - 100%</p>
            </div>
            <div className="rounded-md border border-warning bg-warning/10 p-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-warning" />
                <span className="font-medium text-warning-foreground">Amarelo</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">70% - 79%</p>
            </div>
            <div className="rounded-md border border-destructive bg-destructive/10 p-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-destructive" />
                <span className="font-medium text-destructive">Vermelho</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">0% - 69%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
