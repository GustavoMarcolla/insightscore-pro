import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

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
 * Sincroniza o usuário SeniorX com o Supabase (cria se não existir e faz login)
 */
async function syncSeniorUserWithSupabase(email: string, fullName: string, seniorUserId: string): Promise<boolean> {
  try {
    console.log('[SeniorX] Sincronizando usuário com Supabase:', email);
    
    const { data, error } = await supabase.functions.invoke('sync-seniorx-user', {
      body: { email, fullName, seniorUserId }
    });

    if (error) {
      console.error('[SeniorX] Erro ao sincronizar usuário:', error);
      return false;
    }

    if (data?.token_hash) {
      // Usa o token_hash para fazer login no Supabase
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: data.token_hash,
        type: 'magiclink',
      });

      if (verifyError) {
        console.error('[SeniorX] Erro ao verificar OTP:', verifyError);
        return false;
      }

      console.log('[SeniorX] Login no Supabase realizado com sucesso');
      return true;
    }

    return false;
  } catch (error) {
    console.error('[SeniorX] Erro ao sincronizar usuário:', error);
    return false;
  }
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
  const [isSyncing, setIsSyncing] = useState(false);

  const isAuthenticatedRef = useRef(false);
  const isSyncingRef = useRef(false);

  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated]);

  /**
   * Processa a mensagem de autenticação recebida da Senior X
   */
  const handleAuthMessage = useCallback(async (data: any): Promise<void> => {
    // Evita processar múltiplas vezes
    if (isSyncingRef.current || isAuthenticatedRef.current) {
      return;
    }

    try {
      // Aceita string JSON ou objeto
      const raw = typeof data === 'string' ? JSON.parse(data) : data;

      // Alguns integradores encapsulam o payload
      const token = raw?.token ?? raw?.payload?.token ?? raw?.data?.token ?? {};
      const access_token = token?.access_token ?? token?.accessToken;

      if (access_token) {
        const email = token?.email || '';
        const username = token?.username || '';
        const fullName = normalizeFullName(token?.fullName || '');

        if (!email) {
          console.error('[SeniorX] Email não recebido na autenticação');
          setIsLoading(false);
          return;
        }

        // Marca que estamos em modo Senior X
        setIsSeniorXMode(true);
        localStorage.setItem(STORAGE_KEY_SENIOR_MODE, 'true');

        // Armazena o token Senior X
        setAccessToken(access_token);
        localStorage.setItem(STORAGE_KEY_TOKEN, access_token);

        // Monta o objeto do usuário Senior
        const newUser: SeniorUser = {
          id: normalizeUsername(username),
          username: normalizeUsername(username),
          fullName,
          email,
          tenantDomain: token?.tenantName || ''
        };

        setSeniorUser(newUser);
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newUser));

        // Sincroniza com Supabase para ter acesso aos dados
        isSyncingRef.current = true;
        setIsSyncing(true);
        
        const synced = await syncSeniorUserWithSupabase(email, fullName, normalizeUsername(username));
        
        isSyncingRef.current = false;
        setIsSyncing(false);
        setIsAuthenticated(true);
        setIsLoading(false);

        if (synced) {
          console.log('[SeniorX] Usuário autenticado e sincronizado:', newUser.fullName);
        } else {
          console.warn('[SeniorX] Usuário autenticado mas não sincronizado com Supabase');
        }
      } else {
        console.log('[SeniorX] Mensagem recebida, mas sem access_token');
      }
    } catch (error) {
      console.error('[SeniorX] Erro ao processar mensagem de autenticação:', error);
      setIsLoading(false);
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
          const parsedUser = JSON.parse(storedUser) as SeniorUser;
          setSeniorUser(parsedUser);
          setAccessToken(storedToken);
          setIsSeniorXMode(true);
          
          // Verifica se há sessão Supabase válida
          supabase.auth.getSession().then(async ({ data: { session } }) => {
            if (session) {
              // Sessão Supabase válida, apenas restaura o estado
              setIsAuthenticated(true);
              setIsLoading(false);
              console.log('[SeniorX] Dados de autenticação carregados do localStorage com sessão Supabase válida');
            } else {
              // Sessão Supabase expirada, precisa re-sincronizar
              console.log('[SeniorX] Sessão Supabase expirada, re-sincronizando...');
              isSyncingRef.current = true;
              setIsSyncing(true);
              
              const synced = await syncSeniorUserWithSupabase(
                parsedUser.email, 
                parsedUser.fullName, 
                parsedUser.id
              );
              
              isSyncingRef.current = false;
              setIsSyncing(false);
              setIsAuthenticated(true);
              setIsLoading(false);
              
              if (synced) {
                console.log('[SeniorX] Re-sincronização com Supabase bem sucedida');
              } else {
                console.warn('[SeniorX] Falha na re-sincronização com Supabase');
              }
            }
          });
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
    isSyncing,
    clearSeniorAuth,
  };
}
