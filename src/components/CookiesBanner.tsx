import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n";
import { Cookie, Shield, BarChart3, Settings2, X } from "lucide-react";

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  functional: boolean;
}

const STORAGE_KEY = "cookie-consent";

export function CookiesBanner() {
  const { t } = useI18n();
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    functional: true,
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      setIsVisible(true);
    } else {
      const parsed = JSON.parse(saved);
      setPreferences(parsed);
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      functional: true,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allAccepted));
    setPreferences(allAccepted);
    setIsVisible(false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    setIsVisible(false);
    setShowSettings(false);
  };

  const handleOpenSettings = () => {
    setShowSettings(true);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Cookie Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Cookie className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-foreground">
                  {t("cookies.message")}
                </p>
                <a
                  href="/cookies"
                  className="text-xs text-primary hover:underline mt-1 inline-block"
                >
                  {t("cookies.privacy")}
                </a>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenSettings}
                className="gap-1.5"
              >
                <Settings2 className="h-3.5 w-3.5" />
                {t("cookies.settings")}
              </Button>
              <Button
                size="sm"
                onClick={handleAcceptAll}
                className="bg-gradient-gold text-primary-foreground hover:opacity-90 gap-1.5"
              >
                <Shield className="h-3.5 w-3.5" />
                {t("cookies.accept")}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-lg flex items-center gap-2">
              <Cookie className="h-5 w-5 text-primary" />
              {t("cookies.settings")}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Necessary - always on */}
            <div className="flex items-start justify-between gap-4 p-3 rounded-lg bg-muted/50">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <Shield className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {t("cookies.necessary")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t("cookies.necessaryDesc")}
                  </p>
                </div>
              </div>
              <Switch checked={true} disabled />
            </div>

            {/* Analytics */}
            <div className="flex items-start justify-between gap-4 p-3 rounded-lg bg-background border border-border/30">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-md bg-purple-500/10 flex items-center justify-center shrink-0">
                  <BarChart3 className="h-4 w-4 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {t("cookies.analytics")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t("cookies.analyticsDesc")}
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.analytics}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, analytics: checked })
                }
              />
            </div>

            {/* Functional */}
            <div className="flex items-start justify-between gap-4 p-3 rounded-lg bg-background border border-border/30">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-md bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Settings2 className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {t("cookies.functional")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t("cookies.functionalDesc")}
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.functional}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, functional: checked })
                }
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowSettings(false)}
              className="w-full sm:w-auto"
            >
              <X className="h-4 w-4 mr-1.5" />
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleSavePreferences}
              className="bg-gradient-gold text-primary-foreground hover:opacity-90 w-full sm:w-auto"
            >
              {t("cookies.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
