import { useQuery } from "@tanstack/react-query";
import { useAuth } from "react-oidc-context";
import { useTenant } from "./TenantContext";
import { getRolePermissions } from "../lib/api";

export function usePermissions() {
  const auth = useAuth();
  const { currentTenant } = useTenant();

  const { data: roleData } = useQuery({
    queryKey: ["rolePermissions", currentTenant?.roleId],
    queryFn: () => getRolePermissions(currentTenant!.roleId),
    enabled: !!auth.isAuthenticated && !!currentTenant?.roleId,
    staleTime: 60_000,
  });

  const permissions = new Set(
    roleData?.permissions?.map((p) => p.codename) ?? []
  );

  const hasPermission = (codename: string): boolean => {
    return permissions.has(codename);
  };

  return { hasPermission, permissions };
}
