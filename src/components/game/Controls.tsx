import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CARD_STYLES, CONTROL_STYLES } from "@/utils/styles";

export function Controls() {
  const { t } = useTranslation();

  const controls = [
    { key: "← →", action: t("game.controls.move") },
    { key: "↓", action: t("game.controls.softDrop") },
    { key: "↑", action: t("game.controls.rotate") },
    { key: "Space", action: t("game.controls.hardDrop") },
    { key: "Shift", action: t("game.controls.hold") },
    { key: "P", action: t("game.controls.pause") },
    { key: "R", action: t("game.controls.reset") },
  ];

  return (
    <Card className={`${CARD_STYLES.base} ${CARD_STYLES.hover} ${CARD_STYLES.interactive}`}>
      <CardHeader>
        <CardTitle className="text-base font-bold text-gray-300 text-center">
          {t("game.controls.title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {controls.map(({ key, action }) => (
            <div
              key={key}
              className={`flex items-center justify-between py-1.5 px-3 ${CONTROL_STYLES.interactiveItem} rounded-md`}
            >
              <Badge variant="outline" className="font-mono text-xs border-gray-600 text-gray-300">
                {key}
              </Badge>
              <span className="text-sm text-gray-300">{action}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
