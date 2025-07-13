import { Gamepad2, Minimize2, Monitor } from "lucide-react";
import type React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTheme } from "@/contexts/ThemeContext";

const modeConfig = {
  compact: {
    label: "Compact",
    icon: Minimize2,
    description: "Maximum space efficiency",
  },
  normal: {
    label: "Normal",
    icon: Monitor,
    description: "Balanced layout",
  },
  gaming: {
    label: "Gaming",
    icon: Gamepad2,
    description: "Enhanced visual effects",
  },
} as const;

interface ThemeModeSelectorProps {
  className?: string;
  showDescription?: boolean;
}

export const ThemeModeSelector: React.FC<ThemeModeSelectorProps> = ({
  className,
  showDescription = false,
}) => {
  const { mode, setMode, availableModes, isTransitioning } = useTheme();

  const currentConfig = modeConfig[mode];
  const CurrentIcon = currentConfig.icon;

  const handleModeChange = (newMode: string) => {
    if (["compact", "normal", "gaming"].includes(newMode)) {
      setMode(newMode as "compact" | "normal" | "gaming");
    }
  };

  return (
    <div className={className}>
      <Select
        value={mode}
        onValueChange={handleModeChange}
        disabled={isTransitioning}
        data-testid="theme-mode-selector"
      >
        <SelectTrigger
          className="w-[180px]"
          aria-label={`Current theme: ${currentConfig.label}. Click to change.`}
        >
          <div className="flex items-center">
            <CurrentIcon className="w-4 h-4 mr-2" />
            <SelectValue>
              <span className="flex items-center">
                {currentConfig.label}
                {isTransitioning && (
                  <div className="ml-2 animate-spin w-3 h-3 border border-current border-t-transparent rounded-full" />
                )}
              </span>
            </SelectValue>
          </div>
        </SelectTrigger>

        <SelectContent>
          {availableModes.map((themeMode) => {
            const config = modeConfig[themeMode];
            const Icon = config.icon;

            return (
              <SelectItem key={themeMode} value={themeMode} data-testid={`theme-mode-${themeMode}`}>
                <div className="flex items-center">
                  <Icon className="w-4 h-4 mr-2" />
                  <div className="flex flex-col">
                    <span className="font-medium">{config.label}</span>
                    {showDescription && (
                      <span className="text-xs text-muted-foreground">{config.description}</span>
                    )}
                  </div>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
};
