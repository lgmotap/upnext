import {
  emailFromAddress,
  isResendConfigured,
  isResendSandboxMode,
  resendSandboxInbox,
} from "./config";

export type ResendDomainRecord = {
  id: string;
  name: string;
  status: string;
};

export type ResendProductionGateIssue =
  | "resend_api_key_missing"
  | "no_verified_domain"
  | "email_from_uses_test_domain"
  | "email_from_domain_mismatch"
  | "sandbox_redirect_enabled";

export type ResendProductionGateResult = {
  ok: boolean;
  issues: ResendProductionGateIssue[];
  verifiedDomains: string[];
  emailFrom: string;
  fromDomain: string | null;
  sandboxInbox: string | null;
};

const PLACEHOLDER = /^(placeholder|changeme|your_|xxx|todo|replace_me|example\.com|yourdomain)/i;

/** Parse address from `Name <user@domain.com>` or plain `user@domain.com`. */
export function parseFromEmail(from: string): string | null {
  const trimmed = from.trim();
  const bracketed = trimmed.match(/<([^>]+)>/);
  const email = (bracketed?.[1] ?? trimmed).trim();
  if (!email.includes("@")) return null;
  return email;
}

export function domainFromEmail(email: string): string | null {
  const at = email.lastIndexOf("@");
  if (at < 0) return null;
  return email.slice(at + 1).toLowerCase();
}

export async function fetchResendDomains(apiKey: string): Promise<ResendDomainRecord[]> {
  const res = await fetch("https://api.resend.com/domains", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend domains API ${res.status}: ${body.slice(0, 200)}`);
  }

  const json = (await res.json()) as { data?: ResendDomainRecord[] };
  return json.data ?? [];
}

/** Env-only checks (no API call). */
export function getResendProductionGateEnvStatus(): Omit<
  ResendProductionGateResult,
  "verifiedDomains"
> & { verifiedDomains?: string[] } {
  const emailFrom = emailFromAddress();
  const fromEmail = parseFromEmail(emailFrom);
  const fromDomain = fromEmail ? domainFromEmail(fromEmail) : null;
  const sandboxInbox = resendSandboxInbox();
  const issues: ResendProductionGateIssue[] = [];

  if (!isResendConfigured()) {
    issues.push("resend_api_key_missing");
  }

  if (isResendSandboxMode() || emailFrom.includes("@resend.dev")) {
    issues.push("email_from_uses_test_domain");
  }

  if (sandboxInbox) {
    issues.push("sandbox_redirect_enabled");
  }

  return {
    ok: issues.length === 0,
    issues,
    emailFrom,
    fromDomain,
    sandboxInbox,
  };
}

/** Full production gate: verified domain in Resend + env aligned. */
export async function checkResendProductionGate(
  apiKey = process.env.RESEND_API_KEY?.trim() ?? "",
): Promise<ResendProductionGateResult> {
  const envStatus = getResendProductionGateEnvStatus();
  const issues = [...envStatus.issues];

  if (!apiKey || !isResendConfigured()) {
    return {
      ok: false,
      issues,
      verifiedDomains: [],
      emailFrom: envStatus.emailFrom,
      fromDomain: envStatus.fromDomain,
      sandboxInbox: envStatus.sandboxInbox,
    };
  }

  const domains = await fetchResendDomains(apiKey);
  const verifiedDomains = domains
    .filter((d) => d.status === "verified")
    .map((d) => d.name.toLowerCase());

  if (verifiedDomains.length === 0) {
    issues.push("no_verified_domain");
  }

  const fromDomain = envStatus.fromDomain;
  if (
    fromDomain &&
    verifiedDomains.length > 0 &&
    !verifiedDomains.some((d) => fromDomain === d || fromDomain.endsWith(`.${d}`))
  ) {
    issues.push("email_from_domain_mismatch");
  }

  if (fromDomain && PLACEHOLDER.test(fromDomain)) {
    if (!issues.includes("email_from_uses_test_domain")) {
      issues.push("email_from_uses_test_domain");
    }
  }

  const uniqueIssues = [...new Set(issues)];

  return {
    ok: uniqueIssues.length === 0,
    issues: uniqueIssues,
    verifiedDomains,
    emailFrom: envStatus.emailFrom,
    fromDomain,
    sandboxInbox: envStatus.sandboxInbox,
  };
}

export function formatProductionGateReport(result: ResendProductionGateResult): string {
  const lines: string[] = ["UpNext Resend production gate", ""];

  if (result.verifiedDomains.length > 0) {
    lines.push(`  ✓ Verified domains: ${result.verifiedDomains.join(", ")}`);
  } else {
    lines.push("  ✗ No verified domains on UpNext Resend account");
  }

  lines.push(`  EMAIL_FROM: ${result.emailFrom}`);
  if (result.sandboxInbox) {
    lines.push(`  ✗ RESEND_SANDBOX_TO is set (${result.sandboxInbox}) — remove on Preview/Production`);
  } else {
    lines.push("  ✓ RESEND_SANDBOX_TO unset");
  }

  for (const issue of result.issues) {
    switch (issue) {
      case "resend_api_key_missing":
        lines.push("  ✗ RESEND_API_KEY missing or placeholder");
        break;
      case "no_verified_domain":
        lines.push("  ✗ Add and verify a sending domain in Resend Dashboard");
        break;
      case "email_from_uses_test_domain":
        lines.push("  ✗ EMAIL_FROM still uses @resend.dev — set to your verified domain");
        break;
      case "email_from_domain_mismatch":
        lines.push(
          `  ✗ EMAIL_FROM domain (${result.fromDomain ?? "?"}) does not match verified domain(s)`,
        );
        break;
      case "sandbox_redirect_enabled":
        lines.push("  ✗ Sandbox redirect active — unset RESEND_SANDBOX_TO");
        break;
    }
  }

  lines.push("");
  if (result.ok) {
    lines.push("✓ Resend production gate passed — safe to mark launch checklist item.");
  } else {
    lines.push("✗ Resend production gate failed — see docs/resend-setup.md");
  }

  return lines.join("\n");
}
