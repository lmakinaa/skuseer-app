import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useAuth } from "react-oidc-context";
import { setAuthToken, setTenantId, getMe, type MeResponse } from "../lib/api";

interface TenantInfo {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  roleId: string;
  roleName: string;
}

interface UserInfo {
  id: string;
  email: string;
  fullName: string | null;
  isPlatformAdmin: boolean;
}

interface TenantContextValue {
  currentTenant: TenantInfo | null;
  tenants: TenantInfo[];
  user: UserInfo | null;
  switchTenant: (tenantId: string) => void;
  isLoading: boolean;
}

const TenantCtx = createContext<TenantContextValue>({
  currentTenant: null,
  tenants: [],
  user: null,
  switchTenant: () => {},
  isLoading: true,
});

export function useTenant() {
  return useContext(TenantCtx);
}

export function TenantProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const [tenants, setTenants] = useState<TenantInfo[]>([]);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [currentTenantId, setCurrentTenantId] = useState<string | null>(
    localStorage.getItem("stockseer_tenant_id")
  );
  const [isLoading, setIsLoading] = useState(true);

  // Sync auth token to API client
  useEffect(() => {
    if (auth.user?.access_token) {
      setAuthToken(auth.user.access_token);
    } else {
      setAuthToken(null);
    }
  }, [auth.user?.access_token]);

  // Sync tenant ID to API client
  useEffect(() => {
    setTenantId(currentTenantId);
    if (currentTenantId) {
      localStorage.setItem("stockseer_tenant_id", currentTenantId);
    }
  }, [currentTenantId]);

  // Fetch user info and tenants on auth
  useEffect(() => {
    if (!auth.isAuthenticated || !auth.user?.access_token) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const me: MeResponse = await getMe();
        if (cancelled) return;

        setUser({
          id: me.user.id,
          email: me.user.email,
          fullName: me.user.fullName,
          isPlatformAdmin: me.user.isPlatformAdmin,
        });

        const tenantList: TenantInfo[] = me.tenants.map((t) => ({
          tenantId: t.tenantId,
          tenantName: t.tenantName,
          tenantSlug: t.tenantSlug,
          roleId: t.roleId,
          roleName: t.roleName,
        }));
        setTenants(tenantList);

        // Auto-select tenant
        if (tenantList.length > 0) {
          const stored = localStorage.getItem("stockseer_tenant_id");
          const match = tenantList.find((t) => t.tenantId === stored);
          setCurrentTenantId(match ? match.tenantId : tenantList[0].tenantId);
        }
      } catch (err) {
        console.error("Failed to fetch user info:", err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [auth.isAuthenticated, auth.user?.access_token]);

  const switchTenant = useCallback((tenantId: string) => {
    setCurrentTenantId(tenantId);
  }, []);

  const currentTenant = tenants.find((t) => t.tenantId === currentTenantId) ?? null;

  return (
    <TenantCtx.Provider value={{ currentTenant, tenants, user, switchTenant, isLoading }}>
      {children}
    </TenantCtx.Provider>
  );
}
