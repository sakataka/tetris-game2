import { Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

export function LanguageSelector() {
  const { i18n } = useTranslation();

  const languages = [
    { value: "ja", label: "日本語", flag: "🇯🇵" },
    { value: "en", label: "English", flag: "🇺🇸" },
  ];

  const currentLanguage = languages.find((lang) => lang.value === i18n.language);

  return (
    <div className="absolute top-4 right-4 z-50">
      <Select value={i18n.language} onValueChange={(value) => i18n.changeLanguage(value)}>
        <SelectTrigger className="w-[140px] bg-gray-900/70 backdrop-blur-sm border-gray-700 text-white hover:bg-gray-800/70 transition-colors">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <SelectValue>
              <span className="flex items-center gap-1">
                {currentLanguage?.flag} {currentLanguage?.label}
              </span>
            </SelectValue>
          </div>
        </SelectTrigger>
        <SelectContent className="bg-gray-900 border-gray-700">
          {languages.map((lang) => (
            <SelectItem
              key={lang.value}
              value={lang.value}
              className="text-white hover:bg-gray-800 focus:bg-gray-800"
            >
              <div className="flex items-center gap-2">
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
                {lang.value === i18n.language && (
                  <Badge variant="secondary" className="ml-auto bg-gray-700 text-gray-300 text-xs">
                    Current
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
