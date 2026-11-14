import React from 'react';
import { Bell, Trash2, X } from 'lucide-react';
import { useOS } from '../../context/OSContext';

export const NotificationsPanel: React.FC = () => {
  const { notificationsOpen, setNotificationsOpen, notifications, clearNotifications } = useOS();

  if (!notificationsOpen) return null;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="fixed bottom-14 right-3 z-[9000] w-88 dark:bg-slate-950/95 bg-white/95 border dark:border-slate-700/80 border-slate-200 rounded-2xl p-4 shadow-2xl backdrop-blur-2xl dark:text-slate-100 text-slate-900 select-none flex flex-col space-y-3 max-h-[460px]"
    >
      <div className="flex items-center justify-between pb-2 border-b dark:border-slate-800 border-slate-200">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-cyan-500" />
          <h3 className="text-xs font-bold dark:text-slate-200 text-slate-800">System Notifications</h3>
        </div>

        <div className="flex items-center gap-1">
          {notifications.length > 0 && (
            <button
              onClick={clearNotifications}
              className="p-1 text-slate-400 hover:text-rose-500 dark:hover:bg-slate-800 hover:bg-slate-100 rounded transition-colors cursor-pointer"
              title="Clear All"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => setNotificationsOpen(false)}
            className="p-1 text-slate-400 dark:hover:text-slate-200 hover:text-slate-700 dark:hover:bg-slate-800 hover:bg-slate-100 rounded transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            No active notifications.
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className="p-3 dark:bg-slate-900 bg-slate-50 border dark:border-slate-800 border-slate-200 rounded-xl space-y-1 dark:hover:border-slate-700 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold dark:text-cyan-400 text-cyan-600">{notif.app}</span>
                <span className="text-slate-500 font-mono">{notif.timestamp}</span>
              </div>
              <h4 className="text-xs font-bold dark:text-slate-200 text-slate-800">{notif.title}</h4>
              <p className="text-xs dark:text-slate-400 text-slate-600 leading-relaxed">{notif.message}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
