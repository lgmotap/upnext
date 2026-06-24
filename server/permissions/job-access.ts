import type { AppSession } from "./session";
import { canManageBookings, canViewAllJobs } from "./can";
import { isMemberAssignedToJob } from "@/server/repositories/assignments";

/** Workers may only access jobs assigned to them; dispatchers+ see all org jobs. */
export async function canAccessJob(session: AppSession, jobId: string): Promise<boolean> {
  if (canViewAllJobs(session)) return true;
  if (session.role === "worker") {
    return isMemberAssignedToJob(session.organizationId, session.membershipId, jobId);
  }
  return false;
}

export async function requireJobAccess(session: AppSession, jobId: string): Promise<boolean> {
  return canAccessJob(session, jobId);
}

export function canAssignJobs(session: AppSession): boolean {
  return canManageBookings(session);
}
