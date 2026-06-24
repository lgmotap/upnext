"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAppSession } from "@/server/permissions/session";
import { canManageBookings, canCompleteAssignedJob } from "@/server/permissions/can";
import { requireJobAccess } from "@/server/permissions/job-access";
import {
  getRescheduleDaysForBooking,
  getRescheduleDaysForJob,
  getRescheduleSlotsForBooking,
  getRescheduleSlotsForJob,
  rescheduleBookingRequest,
  rescheduleJob,
} from "@/server/services/scheduling";
import {
  notifyJobOnTheWay,
  notifyJobRunningLate,
} from "@/server/services/notifications";
import {
  rescheduleBookingRequestSchema,
  rescheduleJobSchema,
  crewOnTheWaySchema,
  crewRunningLateSchema,
} from "@/server/validators/scheduling";
import type { SlotDay } from "@/lib/availability/slots";

function formatTime12h(hm: string): string {
  const [h, m] = hm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
}

async function requireBookingManager() {
  const session = await getAppSession();
  if (!session || !canManageBookings(session)) return null;
  return session;
}

export async function fetchJobRescheduleDaysAction(jobId: string) {
  const session = await requireBookingManager();
  if (!session) return { days: [] as SlotDay[], timeZone: "America/New_York" };

  const result = await getRescheduleDaysForJob(session.organizationId, jobId);
  if (!result) return { days: [] as SlotDay[], timeZone: "America/New_York" };
  return result;
}

export async function fetchJobRescheduleSlotsAction(jobId: string, dateYmd: string) {
  const session = await requireBookingManager();
  if (!session) return { slots: [] as { date: string; time: string; label: string }[] };

  const slots = await getRescheduleSlotsForJob(session.organizationId, jobId, dateYmd);
  if (!slots) return { slots: [] as { date: string; time: string; label: string }[] };
  return {
    slots: slots.map((s) => ({ date: s.date, time: s.time, label: formatTime12h(s.time) })),
  };
}

export async function fetchBookingRescheduleDaysAction(bookingRequestId: string) {
  const session = await requireBookingManager();
  if (!session) return { days: [] as SlotDay[], timeZone: "America/New_York" };

  const result = await getRescheduleDaysForBooking(session.organizationId, bookingRequestId);
  if (!result) return { days: [] as SlotDay[], timeZone: "America/New_York" };
  return result;
}

export async function fetchBookingRescheduleSlotsAction(bookingRequestId: string, dateYmd: string) {
  const session = await requireBookingManager();
  if (!session) return { slots: [] as { date: string; time: string; label: string }[] };

  const slots = await getRescheduleSlotsForBooking(session.organizationId, bookingRequestId, dateYmd);
  if (!slots) return { slots: [] as { date: string; time: string; label: string }[] };
  return {
    slots: slots.map((s) => ({ date: s.date, time: s.time, label: formatTime12h(s.time) })),
  };
}

export async function rescheduleJobAction(formData: FormData): Promise<void> {
  const session = await requireBookingManager();
  if (!session) redirect("/app/jobs?error=denied");

  const parsed = rescheduleJobSchema.safeParse({
    jobId: formData.get("jobId"),
    date: formData.get("date"),
    time: formData.get("time"),
  });
  if (!parsed.success) {
    const id = String(formData.get("jobId") ?? "");
    redirect(id ? `/app/jobs/${id}?error=invalid` : "/app/jobs?error=invalid");
  }

  if (!(await requireJobAccess(session, parsed.data.jobId))) {
    redirect("/app/jobs?error=denied");
  }

  const result = await rescheduleJob(
    session.organizationId,
    parsed.data.jobId,
    parsed.data.date,
    parsed.data.time,
  );
  if (!result.ok) {
    redirect(`/app/jobs/${parsed.data.jobId}?error=${encodeURIComponent(result.error)}`);
  }

  revalidatePath("/app/jobs");
  revalidatePath(`/app/jobs/${parsed.data.jobId}`);
  revalidatePath("/app/calendar");
  revalidatePath("/app/dashboard");
  revalidatePath("/crew");
  redirect(`/app/jobs/${parsed.data.jobId}?rescheduled=1`);
}

export async function rescheduleBookingRequestAction(formData: FormData): Promise<void> {
  const session = await requireBookingManager();
  if (!session) redirect("/app/bookings?error=denied");

  const parsed = rescheduleBookingRequestSchema.safeParse({
    bookingRequestId: formData.get("bookingRequestId"),
    date: formData.get("date"),
    time: formData.get("time"),
  });
  if (!parsed.success) {
    const id = String(formData.get("bookingRequestId") ?? "");
    redirect(id ? `/app/bookings/${id}?error=invalid` : "/app/bookings?error=invalid");
  }

  const result = await rescheduleBookingRequest(
    session.organizationId,
    parsed.data.bookingRequestId,
    parsed.data.date,
    parsed.data.time,
  );
  if (!result.ok) {
    redirect(
      `/app/bookings/${parsed.data.bookingRequestId}?error=${encodeURIComponent(result.error)}`,
    );
  }

  revalidatePath("/app/bookings");
  revalidatePath(`/app/bookings/${parsed.data.bookingRequestId}`);
  redirect(`/app/bookings/${parsed.data.bookingRequestId}?rescheduled=1`);
}

export async function notifyOnTheWayAction(formData: FormData): Promise<void> {
  const session = await getAppSession();
  if (!session || !canCompleteAssignedJob(session)) redirect("/crew?error=denied");

  const parsed = crewOnTheWaySchema.safeParse({ jobId: formData.get("jobId") });
  if (!parsed.success) redirect("/crew?error=invalid");

  if (!(await requireJobAccess(session, parsed.data.jobId))) redirect("/crew?error=denied");

  await notifyJobOnTheWay(session.organizationId, parsed.data.jobId);
  revalidatePath(`/crew/jobs/${parsed.data.jobId}`);
  redirect(`/crew/jobs/${parsed.data.jobId}?status=on_the_way`);
}

export async function notifyRunningLateAction(formData: FormData): Promise<void> {
  const session = await getAppSession();
  if (!session || !canCompleteAssignedJob(session)) redirect("/crew?error=denied");

  const parsed = crewRunningLateSchema.safeParse({
    jobId: formData.get("jobId"),
    etaMinutes: formData.get("etaMinutes") || undefined,
  });
  if (!parsed.success) redirect("/crew?error=invalid");

  if (!(await requireJobAccess(session, parsed.data.jobId))) redirect("/crew?error=denied");

  await notifyJobRunningLate(session.organizationId, parsed.data.jobId, parsed.data.etaMinutes);
  revalidatePath(`/crew/jobs/${parsed.data.jobId}`);
  redirect(`/crew/jobs/${parsed.data.jobId}?status=running_late`);
}
