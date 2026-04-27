import { useAuth } from "@/context/AuthContext";

/**
 * Returns permission flags derived from the current user's org role.
 * All flags are false when the user has no org.
 */
export function useRole() {
    const { role } = useAuth();

    return {
        isViewer:  role === "VIEWER",
        canCreate: role === "MEMBER" || role === "ADMIN" || role === "OWNER",
        canManage: role === "ADMIN"  || role === "OWNER",
        isOwner:   role === "OWNER",
        role,
    };
}
