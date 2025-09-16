import { Button } from '@/components/ui/button';
import { User, LogOut, ShoppingBag, Bell } from 'lucide-react';
import { User as UserType } from '@/data/mockData';

interface POSHeaderProps {
  user: UserType;
  onLogout: () => void;
}

export function POSHeader({ user, onLogout }: POSHeaderProps) {
  return (
    <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between shadow-soft">
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10 bg-gradient-to-r from-primary to-primary-hover rounded-full flex items-center justify-center">
          <ShoppingBag className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Boutique POS</h1>
          <p className="text-sm text-muted-foreground">Fashion retail system</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm">
          <Bell className="w-4 h-4" />
        </Button>
        
        <div className="flex items-center space-x-3 px-3 py-2 bg-muted rounded-lg">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
          </div>
        </div>

        <Button variant="ghost" size="sm" onClick={onLogout}>
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
}