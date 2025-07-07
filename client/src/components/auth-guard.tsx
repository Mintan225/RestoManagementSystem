import { useEffect } from 'react';
import { authService } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();

  useEffect(() => {
    const handleApiError = (event: CustomEvent) => {
      if (event.detail.status === 401) {
        toast({
          title: "Session expirée",
          description: "Veuillez vous reconnecter pour continuer",
          variant: "destructive",
        });
        authService.logout();
      }
    };

    window.addEventListener('apiError', handleApiError as EventListener);
    
    return () => {
      window.removeEventListener('apiError', handleApiError as EventListener);
    };
  }, [toast]);

  return <>{children}</>;
}