import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, FileText, Calendar, Users, LogOut, FolderArchive, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Logo } from '@/components/Logo';

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Início', path: '/', icon: LayoutDashboard },
    { name: 'Criar', path: '/create-exam', icon: FileText, roles: ['teacher'] },
    { name: 'Arquivos', path: '/archives', icon: FolderArchive, roles: ['teacher'] },
    { name: 'Agenda', path: '/schedule', icon: Calendar },
    { name: 'Ajustes', path: '/settings', icon: Settings, roles: ['teacher', 'student'] },
  ];

  if (user?.isAdmin) {
    navItems.push({ name: 'Dev', path: '/dev', icon: LayoutDashboard, roles: ['student', 'teacher'] });
  }

  return (
    <div className="h-[100dvh] w-full bg-background flex flex-col md:flex-row overflow-hidden max-w-[100vw]">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-72 bg-card border-r border-border flex-col z-20 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.5)]">
        <div className="p-8 flex items-center justify-start">
          <Logo />
        </div>
        
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto pt-2">
          {navItems.map((item) => {
            if (item.roles && user && !item.roles.includes(user.role)) return null;
            
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} className="block outline-none">
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-4 mb-2 py-6 text-[15px]",
                    isActive ? "bg-primary/20 text-primary-foreground font-semibold" : "text-muted-foreground font-medium hover:text-foreground"
                  )}
                >
                  <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} strokeWidth={isActive ? 2.5 : 2} />
                  {item.name === 'Criar' ? 'Criar Prova' : item.name === 'Ensino' ? 'Professores' : item.name === 'Agenda' ? 'Cronograma' : item.name === 'Ajustes' ? 'Configurações' : item.name}
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-border bg-sidebar/50">
          <div className="mb-5 px-3 flex flex-col">
            <p className="text-sm font-semibold text-foreground line-clamp-1">{user?.name}</p>
            <p className="text-xs text-muted-foreground font-medium capitalize mt-0.5">{user?.role === 'teacher' ? 'Professor' : 'Aluno'}</p>
          </div>
          <Button variant="destructive" className="w-full justify-start gap-3 h-12" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Sair do sistema
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-5 py-4 bg-background/80 backdrop-blur-md border-b border-border z-20 shadow-sm sticky top-0 mt-safe">
        <Logo />
        <Button variant="ghost" size="icon-sm" onClick={handleLogout} className="text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-full h-10 w-10">
          <LogOut className="h-5 w-5" />
        </Button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative pb-24 md:pb-0 scroll-smooth">
        <div className="max-w-5xl mx-auto p-5 sm:p-6 md:p-10 min-h-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.98 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-30 pb-safe shadow-[0_-8px_30px_-15px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-around px-1 py-1.5 min-h-[4.5rem]">
          {navItems.map((item) => {
            if (item.roles && user && !item.roles.includes(user.role)) return null;
            
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} className="flex-1 flex flex-col items-center justify-center p-1 outline-none [-webkit-tap-highlight-color:transparent]">
                <motion.div
                  whileTap={{ scale: 0.85 }}
                  animate={isActive ? { y: -2 } : { y: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className={cn(
                    "flex flex-col items-center justify-center w-full h-full rounded-2xl transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-2xl mb-1 transition-all duration-300",
                    isActive ? "bg-primary/20" : ""
                  )}>
                    <item.icon className={cn("h-[22px] w-[22px] transition-transform", isActive ? "scale-110" : "")} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <span className={cn(
                    "text-[10px] sm:text-[11px] leading-none tracking-tight transition-all duration-300",
                    isActive ? "font-bold text-primary-foreground" : "font-medium"
                  )}>
                    {item.name}
                  </span>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
