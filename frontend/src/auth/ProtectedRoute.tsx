import { useAuth } from "react-oidc-context";
import { useEffect } from "react";
import type { ReactNode } from "react";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const auth = useAuth();

  // Kick off the login redirect from an effect, not during render. Calling
  // signinRedirect() in the render body updates AuthProvider state mid-render
  // ("Cannot update a component while rendering a different component") and
  // re-fires on every render.
  useEffect(() => {
    if (!auth.isLoading && !auth.error && !auth.isAuthenticated) {
      void auth.signinRedirect();
    }
  }, [auth.isLoading, auth.error, auth.isAuthenticated, auth]);

  if (auth.isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (auth.error) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3 max-w-md px-6">
          <h2 className="text-lg font-semibold text-foreground">Authentication Error</h2>
          <p className="text-sm text-muted-foreground">{auth.error.message}</p>
          <button
            onClick={() => auth.signinRedirect()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    // Redirect is triggered by the effect above; just show a spinner meanwhile.
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
