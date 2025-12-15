import { useEffect, useState, useCallback } from "react";

// Constantes
const SENIOR_X_ORIGIN = 'https://platform.senior.com.br';
const STORAGE_KEY_USER = 'senior_user';
const STORAGE_KEY_TOKEN = 'senior_token';

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
  const [isInIframe, setIsInIframe] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  /**
   * Processa a mensagem de autenticação recebida da Senior X
   */
  const handleAuthMessage = useCallback((data: any): void => {
    try {
      // Aceita string JSON ou objeto
      const payload: SeniorXAuthPayload = typeof data === 'string' ? JSON.parse(data) : data;

      // Extrai o token
      const token = payload.token || {};

      if (token?.access_token) {
        // Armazena o token
        const newToken = token.access_token;
        setAccessToken(newToken);
        localStorage.setItem(STORAGE_KEY_TOKEN, newToken);

        // Monta o objeto do usuário
        const username = token.username || '';
        const newUser: SeniorUser = {
          id: normalizeUsername(username),
          username: normalizeUsername(username),
          fullName: normalizeFullName(token.fullName || ''),
          email: token.email || '',
          tenantDomain: token.tenantName || ''
        };

        setSeniorUser(newUser);
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newUser));
        setIsAuthenticated(true);
        setIsLoading(false);

        console.log('[SeniorX] Usuário autenticado:', newUser.fullName);
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
    localStorage.removeItem(STORAGE_KEY_USER);
    localStorage.removeItem(STORAGE_KEY_TOKEN);
  }, []);

  useEffect(() => {
    // Verifica se está rodando em iframe
    const inIframe = window.self !== window.top;
    setIsInIframe(inIframe);

    // Se não está em iframe, não precisa fazer nada
    if (!inIframe) {
      setIsLoading(false);
      return;
    }

    console.log('[SeniorX] Detectado ambiente iframe, iniciando autenticação SSO');

    // Carrega dados existentes do localStorage (se houver)
    const storedUser = localStorage.getItem(STORAGE_KEY_USER);
    const storedToken = localStorage.getItem(STORAGE_KEY_TOKEN);

    if (storedUser && storedToken) {
      try {
        setSeniorUser(JSON.parse(storedUser));
        setAccessToken(storedToken);
        setIsAuthenticated(true);
        console.log('[SeniorX] Dados de autenticação carregados do localStorage');
      } catch (e) {
        console.error('[SeniorX] Erro ao carregar dados do localStorage:', e);
      }
    }

    // Listener para mensagens da plataforma pai
    const handleMessage = (event: MessageEvent) => {
      // CRÍTICO: Validar origem da mensagem
      if (event.origin !== SENIOR_X_ORIGIN) {
        return; // Ignora mensagens de outras origens
      }

      console.log('[SeniorX] Mensagem recebida da plataforma');
      handleAuthMessage(event.data);
    };

    window.addEventListener('message', handleMessage);

    // Solicita dados de autenticação à plataforma pai
    if (window.parent && window.parent !== window) {
      console.log('[SeniorX] Solicitando dados de autenticação à plataforma pai');
      window.parent.postMessage('requestInitialData', SENIOR_X_ORIGIN);
    }

    // Timeout para verificação de autenticação
    const timeouts = [
      setTimeout(() => {
        if (!isAuthenticated) {
          console.log('[SeniorX] Verificando autenticação (500ms)...');
        }
      }, 500),
      setTimeout(() => {
        if (!isAuthenticated) {
          console.log('[SeniorX] Verificando autenticação (1500ms)...');
        }
      }, 1500),
      setTimeout(() => {
        setIsLoading(false);
        if (!isAuthenticated) {
          console.log('[SeniorX] Timeout de autenticação atingido');
        }
      }, 3000)
    ];

    return () => {
      window.removeEventListener('message', handleMessage);
      timeouts.forEach(clearTimeout);
    };
  }, [handleAuthMessage, isAuthenticated]);

  return {
    seniorUser,
    accessToken,
    isInIframe,
    isLoading,
    isAuthenticated,
    clearSeniorAuth,
  };
}
