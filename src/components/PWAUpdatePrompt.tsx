import { useEffect } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl) {
      console.log("[PWA] Service worker registered:", swUrl);
    },
    onRegisterError(error) {
      console.error("[PWA] Service worker registration error:", error);
    },
  });

  useEffect(() => {
    if (offlineReady) {
      toast.success("App pronto para uso offline");
      setOfflineReady(false);
    }
  }, [offlineReady, setOfflineReady]);

  useEffect(() => {
    if (needRefresh) {
      toast("Nova versão disponível", {
        description: "Atualize para obter as últimas melhorias.",
        duration: Infinity,
        action: (
          <Button
            size="sm"
            onClick={() => {
              updateServiceWorker(true);
              setNeedRefresh(false);
            }}
          >
            Atualizar
          </Button>
        ),
      });
    }
  }, [needRefresh, setNeedRefresh, updateServiceWorker]);

  return null;
}
