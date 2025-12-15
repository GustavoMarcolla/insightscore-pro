import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";

type AuthMode = "login" | "register" | "forgot";

const loginSchema = z.object({
  email: z.string().email({ message: "E-mail inválido" }),
  password: z.string().min(6, { message: "Senha deve ter pelo menos 6 caracteres" }),
});

const registerSchema = z.object({
  name: z.string().min(2, { message: "Nome deve ter pelo menos 2 caracteres" }),
  email: z.string().email({ message: "E-mail inválido" }),
  password: z.string().min(6, { message: "Senha deve ter pelo menos 6 caracteres" }),
});

const forgotSchema = z.object({
  email: z.string().email({ message: "E-mail inválido" }),
});

export default function Auth() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, signUp, resetPassword, user, loading } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, loading, navigate]);

  const clearErrors = () => setErrors({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    setIsLoading(true);

    try {
      if (mode === "login") {
        const validation = loginSchema.safeParse({ email, password });
        if (!validation.success) {
          const fieldErrors: Record<string, string> = {};
          validation.error.errors.forEach((err) => {
            if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
          });
          setErrors(fieldErrors);
          setIsLoading(false);
          return;
        }

        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast({
              variant: "destructive",
              title: "Erro ao entrar",
              description: "E-mail ou senha incorretos",
            });
          } else {
            toast({
              variant: "destructive",
              title: "Erro ao entrar",
              description: error.message,
            });
          }
        } else {
          toast({
            title: "Login realizado",
            description: "Bem-vindo ao Qualifica+",
          });
          navigate("/dashboard");
        }
      } else if (mode === "register") {
        const validation = registerSchema.safeParse({ name, email, password });
        if (!validation.success) {
          const fieldErrors: Record<string, string> = {};
          validation.error.errors.forEach((err) => {
            if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
          });
          setErrors(fieldErrors);
          setIsLoading(false);
          return;
        }

        const { error } = await signUp(email, password, name);
        if (error) {
          if (error.message.includes("already registered")) {
            toast({
              variant: "destructive",
              title: "Erro ao criar conta",
              description: "Este e-mail já está cadastrado",
            });
          } else {
            toast({
              variant: "destructive",
              title: "Erro ao criar conta",
              description: error.message,
            });
          }
        } else {
          toast({
            title: "Conta criada com sucesso",
            description: "Você já pode acessar o sistema",
          });
          navigate("/dashboard");
        }
      } else if (mode === "forgot") {
        const validation = forgotSchema.safeParse({ email });
        if (!validation.success) {
          const fieldErrors: Record<string, string> = {};
          validation.error.errors.forEach((err) => {
            if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
          });
          setErrors(fieldErrors);
          setIsLoading(false);
          return;
        }

        const { error } = await resetPassword(email);
        if (error) {
          toast({
            variant: "destructive",
            title: "Erro ao recuperar senha",
            description: error.message,
          });
        } else {
          toast({
            title: "E-mail enviado",
            description: "Verifique sua caixa de entrada para redefinir a senha",
          });
          setMode("login");
        }
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro inesperado",
        description: "Tente novamente mais tarde",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left Panel - Brand */}
      <div className="hidden w-1/2 bg-sidebar text-sidebar-foreground lg:flex lg:flex-col lg:justify-between p-12">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-teal">
              <span className="text-xl font-bold text-white">Q+</span>
            </div>
            <span className="text-2xl font-semibold text-sidebar-foreground">
              Qualifica+
            </span>
          </div>
        </div>
        
        <div className="space-y-6">
          <h1 className="text-4xl font-bold text-sidebar-foreground">
            Sistema de Qualificação<br />de Fornecedores
          </h1>
          <p className="text-lg text-sidebar-muted max-w-md">
            Avalie, monitore e melhore o desempenho dos seus fornecedores 
            com métricas objetivas e em tempo real.
          </p>
        </div>

        <p className="text-sm text-sidebar-muted">
          © 2024 Qualifica+. Todos os direitos reservados.
        </p>
      </div>

      {/* Right Panel - Form */}
      <div className="flex w-full items-center justify-center p-8 lg:w-1/2">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="flex items-center justify-center gap-3 lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-teal">
              <span className="text-xl font-bold text-white">Q+</span>
            </div>
            <span className="text-2xl font-semibold">Qualifica+</span>
          </div>

          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-2xl font-semibold">
              {mode === "login" && "Entrar"}
              {mode === "register" && "Criar conta"}
              {mode === "forgot" && "Recuperar senha"}
            </h2>
            <p className="text-muted-foreground">
              {mode === "login" && "Entre com suas credenciais para acessar"}
              {mode === "register" && "Preencha os dados para criar sua conta"}
              {mode === "forgot" && "Informe seu e-mail para recuperar a senha"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div className="space-y-2">
                <Label htmlFor="name" className="field-label">
                  Nome completo<span className="required-asterisk">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Seu nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`pl-10 ${errors.name ? "border-destructive" : ""}`}
                  />
                </div>
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="field-label">
                E-mail<span className="required-asterisk">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`pl-10 ${errors.email ? "border-destructive" : ""}`}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            {mode !== "forgot" && (
              <div className="space-y-2">
                <Label htmlFor="password" className="field-label">
                  Senha<span className="required-asterisk">*</span>
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`pl-10 pr-10 ${errors.password ? "border-destructive" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>
            )}

            {mode === "login" && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setMode("forgot")}
                  className="text-sm text-primary hover:underline"
                >
                  Esqueceu a senha?
                </button>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              ) : (
                <>
                  {mode === "login" && "Entrar"}
                  {mode === "register" && "Criar conta"}
                  {mode === "forgot" && "Enviar e-mail"}
                </>
              )}
            </Button>
          </form>

          <div className="text-center text-sm">
            {mode === "login" && (
              <p className="text-muted-foreground">
                Não tem uma conta?{" "}
                <button
                  onClick={() => {
                    setMode("register");
                    clearErrors();
                  }}
                  className="text-primary hover:underline"
                >
                  Cadastre-se
                </button>
              </p>
            )}
            {(mode === "register" || mode === "forgot") && (
              <p className="text-muted-foreground">
                Já tem uma conta?{" "}
                <button
                  onClick={() => {
                    setMode("login");
                    clearErrors();
                  }}
                  className="text-primary hover:underline"
                >
                  Entrar
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
