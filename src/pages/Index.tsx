import { useState } from 'react';
import { LoginScreen } from '@/components/pos/LoginScreen';
import { POSHeader } from '@/components/pos/POSHeader';
import { CashierDashboard } from '@/components/pos/CashierDashboard';
import { ManagerDashboard } from '@/components/pos/ManagerDashboard';
import { OwnerDashboard } from '@/components/pos/OwnerDashboard';
import { User } from '@/data/mockData';

const Index = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const renderDashboard = () => {
    switch (currentUser.role) {
      case 'cashier':
        return <CashierDashboard />;
      case 'manager':
        return <ManagerDashboard />;
      case 'owner':
        return <OwnerDashboard />;
      default:
        return <CashierDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <POSHeader user={currentUser} onLogout={handleLogout} />
      <div className="flex-1">
        {renderDashboard()}
      </div>
    </div>
  );
};

export default Index;
