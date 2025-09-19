import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { mockUsers, User } from '@/data/mockData';
import { ShoppingBag, Lock, User as UserIcon } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mock authentication
    const user = mockUsers.find(u => u.email === email);
    if (user && password === 'demo123') {
      onLogin(user);
      setError('');
    } else {
      setError('Invalid credentials. Use demo123 as password.');
    }
  };

  const quickLogin = (role: 'cashier' | 'manager' | 'owner') => {
    const user = mockUsers.find(u => u.role === role);
    if (user) onLogin(user);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-primary to-primary-hover rounded-full flex items-center justify-center shadow-elegant">
            <ShoppingBag className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent">
            Boutique POS
          </h1>
          <p className="text-muted-foreground">Fashion retail management system</p>
        </div>

        <Card className="p-6 shadow-card border-0 bg-card/80 backdrop-blur-sm">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Email address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {error && (
              <p className="text-destructive text-sm text-center">{error}</p>
            )}

            <Button type="submit" className="w-full bg-primary hover:bg-primary-hover">
              Sign In
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t">
            <p className="text-xs text-muted-foreground text-center mb-4">Quick Demo Access:</p>
            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={() => quickLogin('cashier')}
                className="w-full text-left justify-start"
              >
                <UserIcon className="w-4 h-4 mr-2" />
                Cashier Account (kamil@boutique.com)
              </Button>
              <Button
                variant="outline"
                onClick={() => quickLogin('manager')}
                className="w-full text-left justify-start"
              >
                <UserIcon className="w-4 h-4 mr-2" />
                Manager Account (sajid@boutique.com)
              </Button>
              <Button
                variant="outline"
                onClick={() => quickLogin('owner')}
                className="w-full text-left justify-start"
              >
                <UserIcon className="w-4 h-4 mr-2" />
                Owner Account (sajid@boutique.com)
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}