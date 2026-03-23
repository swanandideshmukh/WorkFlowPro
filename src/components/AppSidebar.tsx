import {
  LayoutDashboard, Columns3, ListTodo, Calendar, CheckCircle2,
  Bell, Settings, Shield, User,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarFooter, useSidebar,
} from '@/components/ui/sidebar';

const allLinks = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'employee'] },
  { title: 'Kanban Board', url: '/kanban', icon: Columns3, roles: ['admin', 'manager', 'employee'] },
  { title: 'Tasks', url: '/tasks', icon: ListTodo, roles: ['admin', 'manager', 'employee'] },
  { title: 'Calendar', url: '/calendar', icon: Calendar, roles: ['admin', 'manager', 'employee'] },
  { title: 'Daily Tasks', url: '/daily-tasks', icon: CheckCircle2, roles: ['admin', 'manager', 'employee'] },
  { title: 'Notifications', url: '/notifications', icon: Bell, roles: ['admin', 'manager', 'employee'] },
  { title: 'Profile', url: '/profile', icon: User, roles: ['admin', 'manager', 'employee'] },
  { title: 'Settings', url: '/settings', icon: Settings, roles: ['admin', 'manager'] },
  { title: 'Admin Panel', url: '/admin', icon: Shield, roles: ['admin'] },
];

const roleColors: Record<string, string> = {
  admin: 'bg-red-500/20 text-red-300',
  manager: 'bg-yellow-500/20 text-yellow-300',
  employee: 'bg-emerald-500/20 text-emerald-300',
};

export function AppSidebar() {
  const { profile, role } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  const visibleLinks = allLinks.filter((l) => role && l.roles.includes(role));

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 uppercase text-[10px] tracking-widest">
            {!collapsed && 'Navigation'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleLinks.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/dashboard'}
                      className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {!collapsed && profile && (
        <SidebarFooter className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground text-sm font-medium shrink-0">
              {profile.full_name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{profile.full_name}</p>
              {role && <Badge className={`text-[10px] px-1.5 py-0 ${roleColors[role]} border-0`}>{role}</Badge>}
            </div>
          </div>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
