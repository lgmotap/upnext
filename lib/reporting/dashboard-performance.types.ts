export type DashboardPerformanceRange = {
  fromYmd: string;
  toYmd: string;
  start: Date;
  end: Date;
  label: string;
  priorFromYmd: string;
  priorToYmd: string;
  priorStart: Date;
  priorEnd: Date;
  dayCount: number;
};

export type DashboardPerformanceData = {
  range: DashboardPerformanceRange;
  bookings: {
    newCustomers: number;
    newCustomersChangePct: number | null;
    jobsScheduled: number;
    jobsScheduledChangePct: number | null;
    /** Daily jobs scheduled counts aligned to performance range days. */
    dailyJobsScheduled: number[];
    /** Daily new-customer counts aligned to performance range days. */
    dailyNewCustomers: number[];
  };
  metrics: {
    jobsCompleted: number;
    jobsCompletedChangePct: number | null;
    averageJobValueCents: number;
    averageJobValueChangePct: number | null;
    repeatCustomersPct: number;
    repeatCustomersChangePct: number | null;
    canceledRescheduled: number;
    canceledRescheduledChangePct: number | null;
  };
  revenue: {
    totalCents: number;
    changePct: number | null;
    dailyCents: number[];
    dailyLabels: string[];
  };
};
