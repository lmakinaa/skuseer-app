import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PageLayout from "@/components/PageLayout";
import { useTenant } from "@/auth/TenantContext";
import { getAdminUsers, togglePlatformAdmin, type UserResponse } from "@/lib/api";
import { Shield, ShieldOff } from "lucide-react";

const AdminUsers = () => {
  const { user } = useTenant();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: getAdminUsers,
    enabled: !!user?.isPlatformAdmin,
  });

  const toggleMut = useMutation({
    mutationFn: (userId: string) => togglePlatformAdmin(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });

  if (!user?.isPlatformAdmin) {
    return (
      <PageLayout title="Access Denied">
        <p className="text-muted-foreground">Platform admin access required.</p>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Users" subtitle="All users across the platform">
      <p className="text-sm text-muted-foreground">{users.length} user(s)</p>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Platform Admin</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u: UserResponse) => (
                <tr key={u.id} className="border-b border-border last:border-0 hover:bg-accent/50">
                  <td className="px-4 py-3 font-medium">{u.fullName || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                      u.isPlatformAdmin ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
                    }`}>
                      {u.isPlatformAdmin ? <><Shield className="w-3 h-3" /> Admin</> : "User"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleMut.mutate(u.id)}
                      disabled={u.id === user?.id}
                      className="flex items-center gap-1 px-2 py-1 border border-border rounded-md text-xs hover:bg-accent disabled:opacity-30"
                      title={u.id === user?.id ? "Cannot change your own admin status" : ""}
                    >
                      {u.isPlatformAdmin ? (
                        <><ShieldOff className="w-3 h-3" /> Revoke Admin</>
                      ) : (
                        <><Shield className="w-3 h-3" /> Make Admin</>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageLayout>
  );
};

export default AdminUsers;
