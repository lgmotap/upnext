import type { AppSession } from "./session";

/**
 * Role-based permission checks. Mirrors the matrix in
 * docs/10-auth-and-permissions.md. Deny by default — callers must verify
 * tenant ownership of the target entity separately.
 */

export function canManageBusiness(session: AppSession): boolean {
  return session.role === "owner" || session.role === "admin";
}

export function canManageServices(session: AppSession): boolean {
  return session.role === "owner" || session.role === "admin" || session.role === "dispatcher";
}

export function canManageTeam(session: AppSession): boolean {
  return session.role === "owner" || session.role === "admin";
}

export function canManageBilling(session: AppSession): boolean {
  return session.role === "owner";
}
