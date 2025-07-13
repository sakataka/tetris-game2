import { Layout, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LayoutModeToggleProps {
  onModeChange: (mode: "compact" | "normal") => void;
  currentMode: "compact" | "normal";
  className?: string;
}

/**
 * LayoutModeToggle component for switching between compact and normal layouts
 *
 * Features:
 * - Visual toggle between compact and normal modes
 * - Clear icons and labels for user understanding
 * - Accessible button with proper ARIA labels
 * - Integrates with existing button styling
 */
export const LayoutModeToggle: React.FC<LayoutModeToggleProps> = ({
  onModeChange,
  currentMode,
  className,
}) => {
  const handleToggle = () => {
    const newMode = currentMode === "compact" ? "normal" : "compact";
    onModeChange(newMode);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggle}
      data-testid="layout-mode-toggle"
      className={className}
      aria-label={`Switch to ${currentMode === "compact" ? "normal" : "compact"} layout`}
      title={`Current: ${currentMode} layout. Click to switch to ${currentMode === "compact" ? "normal" : "compact"} layout.`}
    >
      {currentMode === "compact" ? (
        <>
          <Layout className="w-4 h-4 mr-2" />
          Normal
        </>
      ) : (
        <>
          <LayoutGrid className="w-4 h-4 mr-2" />
          Compact
        </>
      )}
    </Button>
  );
};
