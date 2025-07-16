import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { SkipLinks } from "@/components/accessibility/SkipLinks";
import { useAdaptivePerformance } from "@/hooks/core/useAdaptivePerformance";
import { useDesignTokens } from "@/hooks/core/useDesignTokens";
import { cn } from "@/lib/utils";

interface GameLayoutProps {
  children: ReactNode;
  mode?: "compact" | "normal";
  enableAIFeatures?: boolean;
}

/**
 * GameLayout component with compact/normal mode support
 *
 * Provides a CSS Grid-based layout system that supports:
 * - Compact mode: 200px sidebar width for 20% space efficiency improvement
 * - Normal mode: 240px sidebar width (default)
 * - Responsive design with mobile optimization
 * - Smooth transitions between modes
 * - AI features column when enabled
 */
export const GameLayout: React.FC<GameLayoutProps> = ({
  children,
  mode = "normal",
  enableAIFeatures = false,
}) => {
  const { t } = useTranslation();
  const { layout } = useDesignTokens();
  const { animationsEnabled } = useAdaptivePerformance();

  // Calculate grid columns and areas based on mode and AI features
  const sidebarWidth =
    mode === "compact" ? layout.sidebar.width.compact : layout.sidebar.width.normal;
  const gridColumns = enableAIFeatures ? `${sidebarWidth} 1fr 300px` : `${sidebarWidth} 1fr`;
  const gridAreas = enableAIFeatures ? '"sidebar main ai"' : '"sidebar main"';

  return (
    <div
      className={cn(
        "min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-3.5",
        animationsEnabled && "transition-all duration-300",
      )}
      style={
        {
          "--sidebar-width": sidebarWidth,
          "--grid-columns": gridColumns,
        } as React.CSSProperties
      }
      data-testid="game-layout"
      data-layout-mode={mode}
      data-ai-enabled={enableAIFeatures}
    >
      {/* Skip links for keyboard navigation */}
      <SkipLinks />

      <main
        id="main-content"
        className={cn(
          "grid gap-5 items-start justify-center min-h-[calc(100vh-2rem)] pt-3",
          "desktop-layout",
          mode === "compact" && "compact-mode",
          animationsEnabled && "transition-grid",
        )}
        style={{
          gridTemplateColumns: gridColumns,
          gridTemplateAreas: gridAreas,
        }}
        aria-labelledby="app-title"
      >
        {/* Accessible page title for screen readers */}
        <h1 id="app-title" className="sr-only">
          {t("app.title")}
        </h1>
        {children}
      </main>
    </div>
  );
};
