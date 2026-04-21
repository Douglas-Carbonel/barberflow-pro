import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { applyBrandingColor, DEFAULT_PRIMARY_COLOR } from '@/lib/theme';
import { Scissors, Palette, Image as ImageIcon, Save, RotateCcw } from 'lucide-react';

const PRESET_COLORS = [
  '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6',
  '#10b981', '#ec4899', '#14b8a6', '#0f172a',
];

export default function Configuracoes() {
  const { tenant, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState(DEFAULT_PRIMARY_COLOR);
  const [tenantName, setTenantName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (tenant) {
      setLogoUrl(tenant.logo_url ?? '');
      setPrimaryColor(tenant.primary_color ?? DEFAULT_PRIMARY_COLOR);
      setTenantName(tenant.name ?? '');
    }
  }, [tenant]);

  // Live preview as the user picks a color
  useEffect(() => {
    applyBrandingColor(primaryColor);
  }, [primaryColor]);

  const handleSave = async () => {
    if (!tenant) return;
    setSaving(true);
    const { error } = await supabase
      .from('tenants')
      .update({
        name: tenantName.trim() || tenant.name,
        logo_url: logoUrl.trim() || null,
        primary_color: primaryColor,
      })
      .eq('id', tenant.id);
    setSaving(false);

    if (error) {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    await refreshProfile();
    toast({
      title: 'Configurações salvas',
      description: 'A identidade visual da sua empresa foi atualizada.',
    });
  };

  const handleReset = () => {
    setPrimaryColor(DEFAULT_PRIMARY_COLOR);
    setLogoUrl('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground" data-testid="text-page-title">
          Configurações
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Personalize a identidade visual do seu painel.
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-6">
        <div className="flex items-center gap-2 pb-3 border-b border-border">
          <Palette className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-foreground">Identidade Visual</h2>
        </div>

        {/* Tenant name */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Nome da empresa</label>
          <input
            type="text"
            value={tenantName}
            onChange={(e) => setTenantName(e.target.value)}
            data-testid="input-tenant-name"
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
            placeholder="Minha Barbearia"
          />
        </div>

        {/* Logo URL */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <ImageIcon className="h-3.5 w-3.5" />
            URL do logo
          </label>
          <input
            type="url"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            data-testid="input-logo-url"
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
            placeholder="https://exemplo.com/logo.png"
          />
          <p className="text-[11px] text-muted-foreground">
            Cole o link de uma imagem hospedada na internet. Deixe em branco para usar o ícone padrão.
          </p>
        </div>

        {/* Color picker */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">Cor principal</label>
          <div className="flex items-center gap-3 flex-wrap">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setPrimaryColor(c)}
                data-testid={`button-color-${c.replace('#', '')}`}
                className={`h-9 w-9 rounded-lg border-2 transition-all ${
                  primaryColor.toLowerCase() === c.toLowerCase()
                    ? 'border-foreground scale-110'
                    : 'border-transparent hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
                aria-label={`Cor ${c}`}
              />
            ))}
            <div className="flex items-center gap-2 ml-2">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                data-testid="input-color-picker"
                className="h-9 w-12 rounded-lg cursor-pointer bg-transparent border border-border"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                data-testid="input-color-hex"
                className="w-24 bg-background border border-border rounded-lg px-2 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
                placeholder="#f59e0b"
              />
            </div>
          </div>
        </div>

        {/* Live preview */}
        <div className="bg-secondary/50 rounded-lg p-4 space-y-3">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Pré-visualização</p>
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-lg flex items-center justify-center overflow-hidden"
              style={{ backgroundColor: primaryColor }}
            >
              {logoUrl ? (
                <img src={logoUrl} alt="logo" className="h-full w-full object-cover" />
              ) : (
                <Scissors className="h-5 w-5 text-white" />
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{tenantName || 'Minha Barbearia'}</p>
              <p className="text-[10px] text-muted-foreground">Painel de Gestão</p>
            </div>
            <button
              type="button"
              className="ml-auto px-4 py-2 rounded-lg text-white text-sm font-medium"
              style={{ backgroundColor: primaryColor }}
            >
              Botão exemplo
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            data-testid="button-save-settings"
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </button>
          <button
            onClick={handleReset}
            type="button"
            data-testid="button-reset-settings"
            className="text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg text-sm flex items-center gap-2"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restaurar padrão
          </button>
        </div>
      </div>

      <div className="bg-secondary/30 border border-border rounded-xl p-4 text-xs text-muted-foreground">
        Você pode personalizar livremente o logo e a cor da sua empresa. A marca <span className="font-semibold text-foreground">NewAge</span>, criadora desta plataforma, permanece visível como crédito do produto.
      </div>
    </div>
  );
}
