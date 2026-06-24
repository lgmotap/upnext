export type ResearchRole =
  | "public"
  | "owner"
  | "admin"
  | "staff"
  | "provider"
  | "customer-portal";

export type PageSource = "marketing" | "app" | "help-center" | "portal" | "manual";

export interface RegistryPage {
  id: string;
  phase: string;
  url: string;
  role: ResearchRole;
  source?: PageSource;
  label?: string;
  notes?: string;
  viewport?: "desktop" | "mobile";
  waitForSelector?: string;
  waitMs?: number;
  discoveredFrom?: string;
}

export interface RegistryFlow {
  id: string;
  phase: string;
  role: ResearchRole;
  label: string;
  steps: Array<{
    pageId?: string;
    url?: string;
    action?: "click" | "fill" | "wait";
    selector?: string;
    value?: string;
    waitMs?: number;
    label?: string;
  }>;
}

export interface PageRegistry {
  target: string;
  displayName: string;
  publicBaseUrl: string;
  appBaseUrl: string;
  appLoginUrl?: string;
  helpBaseUrl?: string;
  crawlDelayMs: number;
  phases: Array<{ id: string; name: string; description?: string }>;
  roles: Array<{ id: ResearchRole; label: string; storageFile: string }>;
  pages: RegistryPage[];
  flows?: RegistryFlow[];
}

export interface FormFieldCapture {
  tag: string;
  type: string;
  name: string;
  id: string;
  label: string;
  placeholder: string;
  required: boolean;
  disabled: boolean;
  options: string[];
  ariaLabel: string;
}

export interface FormCapture {
  id: string;
  name: string;
  action: string;
  method: string;
  fields: FormFieldCapture[];
}

export interface TableCapture {
  id: string;
  caption: string;
  columns: string[];
  rowCountVisible: number;
}

export interface NavItemCapture {
  text: string;
  href: string;
  ariaLabel: string;
}

export interface PageCapture {
  pageId: string;
  url: string;
  finalUrl: string;
  role: ResearchRole;
  phase: string;
  label: string;
  capturedAt: string;
  viewport: { width: number; height: number };
  title: string;
  metaDescription: string;
  breadcrumbs: string[];
  headings: Array<{ level: number; text: string }>;
  navigation: {
    primary: NavItemCapture[];
    secondary: NavItemCapture[];
    tabs: NavItemCapture[];
  };
  actions: {
    buttons: NavItemCapture[];
    links: NavItemCapture[];
  };
  forms: FormCapture[];
  tables: TableCapture[];
  modals: Array<{ text: string; role: string }>;
  badges: string[];
  lockIndicators: string[];
  emptyStates: string[];
  visibleTextSample: string;
  errors: string[];
}

export interface CaptureManifest {
  target: string;
  generatedAt: string;
  pages: Array<{
    pageId: string;
    phase: string;
    role: ResearchRole;
    url: string;
    capturedAt: string;
    jsonPath: string;
    screenshotPath: string;
    status: "ok" | "error" | "skipped";
    error?: string;
  }>;
}
