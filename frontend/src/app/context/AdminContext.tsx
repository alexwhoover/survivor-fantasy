import { createContext, useContext, useEffect, useState } from "react";
import { isAdminSignedIn } from "../../api";

interface AdminContextValue {
  /** True only for the site admin. Everyone else browses read-only. */
  isAdmin: boolean;
  setIsAdmin: (isAdmin: boolean) => void;
  /** The initial session check is still in flight; admin-only UI stays hidden until it lands. */
  loading: boolean;
}

const AdminContext = createContext<AdminContextValue>({
  isAdmin: false,
  setIsAdmin: () => {},
  loading: true,
});

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // The server session is the only source of truth, so this re-checks on every page
  // load rather than caching anything client-side. A visitor's check simply returns
  // false — it isn't an error state, and nothing on the page waits on it.
  useEffect(() => {
    isAdminSignedIn()
      .then(setIsAdmin)
      .catch(() => setIsAdmin(false))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminContext.Provider value={{ isAdmin, setIsAdmin, loading }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  return useContext(AdminContext);
}
