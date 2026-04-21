import { 
  LayoutDashboard, Calendar, Users, Scissors, UserCog, Target, 
  BarChart3, DollarSign, CreditCard, LogOut, Settings,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarFooter, SidebarHeader, useSidebar,
} from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { PoweredByBadge } from '@/components/PoweredByBadge';

const mainNav = [
  { title: 'Dashboard', url: '/app', icon: LayoutDashboard },
  { title: 'Agenda', url: '/app/agenda', icon: Calendar },
  { title: 'Clientes', url: '/app/clientes', icon: Users },
  { title: 'Serviços', url: '/app/servicos', icon: Scissors },
  { title: 'Profissionais', url: '/app/profissionais', icon: UserCog },
];

const businessNav = [
  { title: 'Metas', url: '/app/metas', icon: Target },
  { title: 'Relatórios', url: '/app/relatorios', icon: BarChart3 },
  { title: 'Financeiro', url: '/app/financeiro', icon: DollarSign },
  { title: 'Assinaturas', url: '/app/assinaturas', icon: CreditCard },
  { title: 'Configurações', url: '/app/configuracoes', icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { profile, tenant, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center flex-shrink-0 overflow-hidden">
            {tenant?.logo_url ? (
              <img
                src={tenant.logo_url}
                alt={tenant.name}
                className="h-full w-full object-cover"
                data-testid="img-tenant-logo"
              />
            ) : (
              <Scissors className="h-5 w-5 text-primary-foreground" />
            )}
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-foreground text-sm tracking-tight truncate">
                {tenant?.name ?? 'Minha Barbearia'}
              </span>
              <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                Painel de Gestão
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/60 px-3">
            {!collapsed && 'Principal'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-10">
                    <NavLink
                      to={item.url}
                      end={item.url === '/app'}
                      className="flex items-center gap-3 px-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!collapsed && <span className="text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/60 px-3">
            {!collapsed && 'Gestão'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {businessNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-10">
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3 px-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!collapsed && <span className="text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border space-y-2">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-primary">{initials}</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">
                {profile?.full_name ?? 'Usuário'}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {tenant?.saas_plan ? `Plano ${tenant.saas_plan}` : 'Demo'}
              </p>
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          data-testid="button-logout"
          title="Sair da conta"
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors text-sm"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>

        {!collapsed && (
          <div className="pt-2 border-t border-sidebar-border/50 flex justify-center">
            <PoweredByBadge />
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
