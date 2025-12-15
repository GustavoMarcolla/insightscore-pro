import { useEffect, useState, useCallback, useRef } from "react";

// Constantes
const SENIOR_X_ORIGINS = [
  'https://platform.senior.com.br',
  'https://cloud-leaf.senior.com.br',
];
const SENIOR_DOMAIN_PATTERN = /\.senior\.com\.br$/;
const STORAGE_KEY_USER = 'senior_user';
const STORAGE_KEY_TOKEN = 'senior_token';
const STORAGE_KEY_SENIOR_MODE = 'senior_mode';

// Debug: evita spam de logs para origens desconhecidas
const seenMessageOrigins = new Set<string>();

/**
 * Verifica se a origem é de um domínio Senior válido
 */
function isSeniorOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    return SENIOR_DOMAIN_PATTERN.test(url.hostname) || SENIOR_X_ORIGINS.includes(origin);
  } catch {
    return false;
  }
}

// Interface do usuário Senior X
export interface SeniorUser {
  id: string;
  username: string;
  fullName: string;
  email: string;
  tenantDomain: string;
}

// Interface do payload de autenticação
interface SeniorXAuthPayload {
  token?: {
    access_token?: string;
    username?: string;
    fullName?: string;
    email?: string;
    tenantName?: string;
    locale?: string;
  };
  servicesUrl?: string;
}

/**
 * Normaliza o username removendo a parte @tenant
 */
function normalizeUsername(username: string): string {
  if (username && username.includes('@')) {
    return username.split('@')[0];
  }
  return username;
}

/**
 * Normaliza o nome completo substituindo + por espaços
 */
function normalizeFullName(fullName: string): string {
  return fullName?.replace(/\+/g, ' ') || '';
}

/**
 * Hook para autenticação via Senior X
 */
export function useSeniorX() {
  const [seniorUser, setSeniorUser] = useState<SeniorUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isSeniorXMode, setIsSeniorXMode] = useState(false);
  const [isLikelySeniorX, setIsLikelySeniorX] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const isAuthenticatedRef = useRef(false);

  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated]);

  /**
   * Processa a mensagem de autenticação recebida da Senior X
   */
  const handleAuthMessage = useCallback((data: any): void => {
    try {
      // Aceita string JSON ou objeto
      const raw = typeof data === 'string' ? JSON.parse(data) : data;

      // Alguns integradores encapsulam o payload
      const token = raw?.token ?? raw?.payload?.token ?? raw?.data?.token ?? {};
      const access_token = token?.access_token ?? token?.accessToken;

      if (access_token) {
        // Marca que estamos em modo Senior X
        setIsSeniorXMode(true);
        localStorage.setItem(STORAGE_KEY_SENIOR_MODE, 'true');

        // Armazena o token
        setAccessToken(access_token);
        localStorage.setItem(STORAGE_KEY_TOKEN, access_token);

        // Monta o objeto do usuário
        const username = token?.username || '';
        const newUser: SeniorUser = {
          id: normalizeUsername(username),
          username: normalizeUsername(username),
          fullName: normalizeFullName(token?.fullName || ''),
          email: token?.email || '',
          tenantDomain: token?.tenantName || ''
        };

        setSeniorUser(newUser);
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newUser));
        setIsAuthenticated(true);
        setIsLoading(false);

        console.log('[SeniorX] Usuário autenticado:', newUser.fullName);
      } else {
        console.log('[SeniorX] Mensagem recebida, mas sem access_token');
      }
    } catch (error) {
      console.error('[SeniorX] Erro ao processar mensagem de autenticação:', error);
    }
  }, []);

  /**
   * Limpa os dados de autenticação Senior X
   */
  const clearSeniorAuth = useCallback(() => {
    setSeniorUser(null);
    setAccessToken(null);
    setIsAuthenticated(false);
    setIsSeniorXMode(false);
    localStorage.removeItem(STORAGE_KEY_USER);
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_SENIOR_MODE);
  }, []);

  useEffect(() => {
    const isInIframe = window.self !== window.top;

    // Heurística para identificar Senior X sem depender de receber mensagem
    // Aceita qualquer domínio *.senior.com.br como referrer
    const likelySenior = isInIframe && SENIOR_DOMAIN_PATTERN.test(new URL(document.referrer || 'http://localhost').hostname);
    setIsLikelySeniorX(likelySenior);

    // Fora de iframe, nunca devemos ficar em "modo Senior X" (isso quebra o logout normal)
    if (!isInIframe) {
      if (localStorage.getItem(STORAGE_KEY_SENIOR_MODE) === 'true') {
        localStorage.removeItem(STORAGE_KEY_SENIOR_MODE);
        localStorage.removeItem(STORAGE_KEY_USER);
        localStorage.removeItem(STORAGE_KEY_TOKEN);
      }

      setIsSeniorXMode(false);
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }

    // Dentro de iframe: tenta restaurar sessão prévia (apenas se já marcou Senior Mode antes)
    const wasSeniorMode = localStorage.getItem(STORAGE_KEY_SENIOR_MODE) === 'true';

    if (wasSeniorMode) {
      const storedUser = localStorage.getItem(STORAGE_KEY_USER);
      const storedToken = localStorage.getItem(STORAGE_KEY_TOKEN);

      if (storedUser && storedToken) {
        try {
          setSeniorUser(JSON.parse(storedUser));
          setAccessToken(storedToken);
          setIsAuthenticated(true);
          setIsSeniorXMode(true);
          setIsLoading(false);
          console.log('[SeniorX] Dados de autenticação carregados do localStorage');
        } catch (e) {
          console.error('[SeniorX] Erro ao carregar dados do localStorage:', e);
          clearSeniorAuth();
        }
      }
    }

    const handleMessage = (event: MessageEvent) => {
      // Aceita qualquer domínio *.senior.com.br
      if (!isSeniorOrigin(event.origin)) {
        if (!seenMessageOrigins.has(event.origin)) {
          console.log('[SeniorX] Mensagem ignorada (origem diferente):', event.origin);
          seenMessageOrigins.add(event.origin);
        }
        return;
      }

      console.log('[SeniorX] Mensagem recebida do Senior X:', event.origin);
      handleAuthMessage(event.data);
    };

    window.addEventListener('message', handleMessage);

    const requestInitialData = () => {
      try {
        // targetOrigin '*' para garantir entrega (a validação de segurança é na volta, via event.origin)
        window.parent?.postMessage('requestInitialData', '*');
      } catch {
        // ignore
      }
    };

    // Solicita dados imediatamente e faz retry por alguns segundos
    requestInitialData();
    const retryInterval = setInterval(() => {
      if (isAuthenticatedRef.current) {
        clearInterval(retryInterval);
        return;
      }
      requestInitialData();
    }, 1000);

    const timeout = setTimeout(() => {
      setIsLoading(false);
      clearInterval(retryInterval);
    }, 8000);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearInterval(retryInterval);
      clearTimeout(timeout);
    };
  }, [handleAuthMessage, clearSeniorAuth]);

  return {
    seniorUser,
    accessToken,
    isSeniorXMode,
    isLikelySeniorX,
    isLoading,
    isAuthenticated,
    clearSeniorAuth,
  };
}
