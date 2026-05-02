import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';

export default function PendingApproval() {
  const { logout } = useAuth();

  return (
    <div className="min-h-[100dvh] w-full bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-sm border-slate-200">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Aguardando Aprovação</CardTitle>
          <CardDescription className="opacity-80">
             Seu cadastro como professor foi recebido.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <div className="bg-orange-50 text-orange-800 p-4 rounded-lg border border-orange-200">
            <p className="font-medium">Espere pela aprovação dos admins para verificar e liberar seu acesso ao sistema.</p>
          </div>
          <Button onClick={logout} variant="outline" className="w-full">
            Sair e voltar ao login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
