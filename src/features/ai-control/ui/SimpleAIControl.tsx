import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Switch } from "@shared/ui/switch";
import { useTranslation } from "react-i18next";
import { useSimpleAIStore } from "../model/simpleAISlice";

/**
 * シンプルなAI ON/OFF コントロール
 */
export function SimpleAIControl() {
  const { t } = useTranslation();
  const { isEnabled, toggleAI } = useSimpleAIStore();

  return (
    <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-700">
      <CardHeader>
        <CardTitle className="text-base font-bold text-white text-center">
          {t("ai.title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-300">{t("ai.enable")}</span>
          <Switch checked={isEnabled} onCheckedChange={toggleAI} aria-label={t("ai.toggle")} />
        </div>
        {isEnabled && (
          <div className="mt-2 text-xs text-gray-400 text-center">{t("ai.status.active")}</div>
        )}
      </CardContent>
    </Card>
  );
}
