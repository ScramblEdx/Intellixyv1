import { motion } from 'motion/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Settings as SettingsIcon, Palette } from 'lucide-react';

export default function Settings() {
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Configurações</h1>
        <p className="text-muted-foreground mt-1">Gerencie suas preferências do sistema.</p>
      </motion.div>

      <Card className="shadow-sm border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Palette className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Aparência</CardTitle>
              <CardDescription>Personalize o tema da sua interface de usuário.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
            <div className="flex flex-col space-y-0.5">
              <label className="text-sm font-medium leading-none">
                Modo Escuro
              </label>
              <span className="text-[13px] text-muted-foreground">
                Habilite um tema mais escuro e confortável para ambientes com pouca luz.
              </span>
            </div>
            <ThemeToggle />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
