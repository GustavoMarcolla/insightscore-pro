import { useEffect, useState, useCallback } from "react";

// Constantes
const SENIOR_X_ORIGIN = 'https://platform.senior.com.br';
const STORAGE_KEY_USER = 'senior_user';
const STORAGE_KEY_TOKEN = 'senior_token';
const STORAGE_KEY_SENIOR_MODE = 'senior_mode';

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
        // Marca que estamos em modo Senior X
        setIsSeniorXMode(true);
        localStorage.setItem(STORAGE_KEY_SENIOR_MODE, 'true');

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
    setIsSeniorXMode(false);
    localStorage.removeItem(STORAGE_KEY_USER);
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_SENIOR_MODE);
  }, []);

  useEffect(() => {
    // Verifica se já estava em modo Senior X (reload da página)
    const wasSeniorMode = localStorage.getItem(STORAGE_KEY_SENIOR_MODE) === 'true';
    
    if (wasSeniorMode) {
      // Carrega dados existentes do localStorage
      const storedUser = localStorage.getItem(STORAGE_KEY_USER);
      const storedToken = localStorage.getItem(STORAGE_KEY_TOKEN);

      if (storedUser && storedToken) {
        try {
          setSeniorUser(JSON.parse(storedUser));
          setAccessToken(storedToken);
          setIsAuthenticated(true);
          setIsSeniorXMode(true);
          console.log('[SeniorX] Dados de autenticação carregados do localStorage');
        } catch (e) {
          console.error('[SeniorX] Erro ao carregar dados do localStorage:', e);
          clearSeniorAuth();
        }
      }
    }

    // Listener para mensagens da plataforma pai
    const handleMessage = (event: MessageEvent) => {
      // CRÍTICO: Validar origem da mensagem - só aceita do Senior X
      if (event.origin !== SENIOR_X_ORIGIN) {
        return; // Ignora mensagens de outras origens
      }

      console.log('[SeniorX] Mensagem recebida da plataforma Senior X');
      handleAuthMessage(event.data);
    };

    window.addEventListener('message', handleMessage);

    // Se está em iframe, solicita dados de autenticação à plataforma pai
    const isInIframe = window.self !== window.top;
    if (isInIframe && window.parent) {
      console.log('[SeniorX] Em iframe, solicitando dados de autenticação');
      // Envia para Senior X (se for o pai correto, responderá)
      try {
        window.parent.postMessage('requestInitialData', SENIOR_X_ORIGIN);
      } catch (e) {
        // Ignora erro se não conseguir enviar (não é Senior X)
      }
    }

    // Timeout para finalizar loading (não bloqueia se não for Senior X)
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(timeout);
    };
  }, [handleAuthMessage, clearSeniorAuth]);

  return {
    seniorUser,
    accessToken,
    isSeniorXMode,
    isLoading,
    isAuthenticated,
    clearSeniorAuth,
  };
}
