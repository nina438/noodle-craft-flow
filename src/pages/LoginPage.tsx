import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!login(username, password)) {
      setError('帳號或密碼錯誤');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 erp-gradient blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full opacity-10 bg-accent blur-3xl" />
      </div>
      <Card className="w-full max-w-md shadow-xl border-border/50 animate-fade-in relative">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="mx-auto w-16 h-16 rounded-2xl erp-gradient flex items-center justify-center shadow-lg">
            <span className="text-2xl font-bold text-primary-foreground">長</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">長安製麵</h1>
            <p className="text-muted-foreground text-sm mt-1">職人町 ERP 管理系統</p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">帳號</label>
              <Input
                value={username}
                onChange={e => { setUsername(e.target.value); setError(''); }}
                placeholder="請輸入帳號"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">密碼</label>
              <Input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                placeholder="請輸入密碼"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full erp-gradient text-primary-foreground hover:opacity-90">
              登入系統
            </Button>
          </form>
          <div className="mt-6 border-t border-border pt-4">
            <p className="text-xs text-muted-foreground text-center mb-2">測試帳號</p>
            <div className="grid grid-cols-3 gap-2 text-xs text-center text-muted-foreground">
              <div className="p-2 rounded-md bg-muted"><p className="font-medium">管理員</p><p>admin</p><p>admin123</p></div>
              <div className="p-2 rounded-md bg-muted"><p className="font-medium">店長</p><p>manager</p><p>manager123</p></div>
              <div className="p-2 rounded-md bg-muted"><p className="font-medium">員工</p><p>staff</p><p>staff123</p></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
