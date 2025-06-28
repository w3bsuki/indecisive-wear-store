"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Bell, X, CheckCircle, AlertCircle, Clock } from "lucide-react"

interface Notification {
  id: number
  type: "success" | "error" | "info"
  title: string
  message: string
  timestamp: string
  read: boolean
}

export function AutomationNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      type: "success",
      title: "Post Published",
      message: "Instagram post for Essential White Tee review published successfully",
      timestamp: new Date().toISOString(),
      read: false,
    },
    {
      id: 2,
      type: "info",
      title: "Post Scheduled",
      message: "Twitter post scheduled for tomorrow at 10:00 AM",
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      read: false,
    },
    {
      id: 3,
      type: "error",
      title: "Post Failed",
      message: "Facebook post failed due to API rate limit",
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      read: true,
    },
  ])

  const [isOpen, setIsOpen] = useState(false)

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAsRead = (id: number) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const removeNotification = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case "info":
        return <Clock className="h-4 w-4 text-blue-500" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)} className="relative hover:bg-black/5">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500 text-white">
            {unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-80 bg-white border-2 border-black shadow-lg z-50 font-mono">
          <div className="p-4 border-b border-black/10">
            <div className="flex items-center justify-between">
              <h3 className="font-bold uppercase tracking-wider">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
                    Mark all read
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-black/60">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`border-0 border-b border-black/10 rounded-none ${!notification.read ? "bg-blue-50" : ""}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-3 flex-1">
                        {getIcon(notification.type)}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm">{notification.title}</h4>
                          <p className="text-xs text-black/70 mt-1">{notification.message}</p>
                          <p className="text-xs text-black/50 mt-2">
                            {new Date(notification.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                            className="text-xs px-2"
                          >
                            Mark read
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeNotification(notification.id)}
                          className="h-6 w-6"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
