import type { Master } from "@/lib/types";
import {
  CLASSIC_PAGE_THEME,
  type PageTheme,
} from "@/lib/page-theme";
import {
  canCustomizePageTheme,
  syncMasterSubscription,
  type SubscriptionInfo,
} from "@/lib/subscription";

export function resolvePublicPageTheme(
  master: Master | null,
  sub?: SubscriptionInfo | null
): { theme: PageTheme; custom: boolean } {
  if (!master) {
    return { theme: { ...CLASSIC_PAGE_THEME }, custom: false };
  }
  const info = sub ?? syncMasterSubscription(master.id);
  if (!canCustomizePageTheme(info)) {
    return { theme: { ...CLASSIC_PAGE_THEME }, custom: false };
  }
  return { theme: master.page_theme, custom: true };
}
