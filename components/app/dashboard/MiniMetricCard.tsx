import { MiniMetricSparkline } from "@/components/app/dashboard/MiniMetricSparkline";
import {
  dashboardMiniMetricCardClass,
  dashboardType,
} from "@/components/app/dashboard/dashboard-card-styles";

type SparklineMiniMetricCardProps = {
  variant: "sparkline";
  title: string;
  value: string;
  sparklineData: number[];
  sparklineColor?: string;
};

type PlainMiniMetricCardProps = {
  variant: "plain";
  title: string;
  value: string;
};

export type MiniMetricCardProps = SparklineMiniMetricCardProps | PlainMiniMetricCardProps;

export function MiniMetricCard(props: MiniMetricCardProps) {
  const { title, value } = props;

  if (props.variant === "sparkline") {
    return (
      <div className={`flex h-[96px] flex-col ${dashboardMiniMetricCardClass}`}>
        <p className={dashboardType.metricLabel}>{title}</p>
        <p className={`mt-1 ${dashboardType.metricValue}`}>{value}</p>
        <div className="mt-auto h-5 min-w-0 pt-1.5">
          <MiniMetricSparkline data={props.sparklineData} color={props.sparklineColor} />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-[72px] flex-col justify-center ${dashboardMiniMetricCardClass}`}>
      <p className={dashboardType.metricLabel}>{title}</p>
      <p className={`mt-1 ${dashboardType.metricValue}`}>{value}</p>
    </div>
  );
}
