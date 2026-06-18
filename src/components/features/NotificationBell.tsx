import { useState } from 'react';
import { Bell, Check, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

export function NotificationBell() {
  const { data: notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleNotificationClick = async (notif: any) => {
    if (!notif.isRead) {
      await markAsRead.mutateAsync(notif.id);
    }
    setOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground ring-2 ring-background">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[380px] p-0 shadow-xl border-border/50">
        <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/30">
          <h4 className="font-semibold text-sm">Notificações</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs font-medium text-primary hover:bg-transparent hover:underline"
              onClick={() => markAllAsRead.mutate()}
            >
              Marcar todas como lidas
            </Button>
          )}
        </div>
        <div className="flex flex-col max-h-[400px] overflow-y-auto">
          {!notifications || notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground font-medium">Nenhuma notificação</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={cn(
                  "flex items-start gap-3 p-4 border-b last:border-0 cursor-pointer transition-colors hover:bg-muted/50",
                  !notif.isRead ? "bg-primary/5" : ""
                )}
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn("text-sm font-semibold", !notif.isRead ? "text-foreground" : "text-muted-foreground")}>
                      {notif.title}
                    </p>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: ptBR })}
                    </span>
                  </div>
                  {notif.content && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notif.content}
                    </p>
                  )}
                </div>
                {!notif.isRead && (
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                )}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
