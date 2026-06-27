import { phase, seoMeta, type LaunchPhase } from "@/lib/config";

export function getSeoMeta(overridePhase?: LaunchPhase) {
  return seoMeta[overridePhase ?? phase];
}
