import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Users, User, Bell, Loader2, Trash2, Filter, Calendar, History, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { formatDistanceToNow } from "date-fns";

const notificationTypes = [
  { value: "info", label: "Info", icon: "ℹ️", color: "text-blue-500" },
  { value: "event", label: "Event", icon: "📅", color: "text-primary" },
  { value: "achievement", label: "Achievement", icon: "🏆", color: "text-yellow-500" },
  { value: "forum", label: "Forum", icon: "💬", color: "text-purple-500" },
];

const filterOptions = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "all", label: "All Time" },
];

function SendNotificationsContent() {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showManage, setShowManage] = useState(false);
  const [sentNotifications, setSentNotifications] = useState<any[]>([]);
  const [dateFilter, setDateFilter] = useState("week");
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
  const [deletingBulk, setDeletingBulk] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    week: 0,
    old: 0,
  });
  const [cleaningOld, setCleaningOld] = useState(false);
  const [formData, setFormData] = useState({
    recipient_type: "all",
    user_id: "",
    title: "",
    message: "",
    type: "info",
    link: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
    if (showManage) {
      fetchSentNotifications();
      fetchStats();
    }
  }, [showManage, dateFilter]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .order("full_name");

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fetchSentNotifications = async () => {
    setLoadingHistory(true);
    try {
      let query = supabase
        .from("notifications")
        .select(`
          id,
          user_id,
          title,
          message,
          type,
          link,
          is_read,
          created_at
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      // Apply date filter
      const now = new Date();
      if (dateFilter === "today") {
        const today = new Date(now.setHours(0, 0, 0, 0)).toISOString();
        query = query.gte("created_at", today);
      } else if (dateFilter === "week") {
        const weekAgo = new Date(now.setDate(now.getDate() - 7)).toISOString();
        query = query.gte("created_at", weekAgo);
      } else if (dateFilter === "month") {
        const monthAgo = new Date(now.setMonth(now.getMonth() - 1)).toISOString();
        query = query.gte("created_at", monthAgo);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch user details for each notification
      const userIds = [...new Set(data?.map(n => n.user_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", userIds);

      const profilesMap: Record<string, any> = {};
      profiles?.forEach(p => {
        profilesMap[p.user_id] = p;
      });

      const notificationsWithProfiles = data?.map(n => ({
        ...n,
        profiles: profilesMap[n.user_id],
      })) || [];

      setSentNotifications(notificationsWithProfiles);
    } catch (error) {
      console.error("Error fetching sent notifications:", error);
      toast({
        title: "Error",
        description: "Failed to load notifications.",
        variant: "destructive",
      });
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchStats = async () => {
    try {
      const now = new Date();
      const today = new Date(now.setHours(0, 0, 0, 0)).toISOString();
      const weekAgo = new Date(now.setDate(now.getDate() - 7)).toISOString();
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [totalRes, todayRes, weekRes, oldRes] = await Promise.all([
        supabase.from("notifications").select("id", { count: "exact", head: true }),
        supabase.from("notifications").select("id", { count: "exact", head: true }).gte("created_at", today),
        supabase.from("notifications").select("id", { count: "exact", head: true }).gte("created_at", weekAgo),
        supabase.from("notifications").select("id", { count: "exact", head: true }).lt("created_at", sevenDaysAgo),
      ]);

      setStats({
        total: totalRes.count || 0,
        today: todayRes.count || 0,
        week: weekRes.count || 0,
        old: oldRes.count || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const cleanupOldNotifications = async () => {
    if (!confirm('Delete all notifications older than 7 days?')) {
      return;
    }

    setCleaningOld(true);
    try {
      const { error } = await supabase.rpc('delete_old_notifications' as any);

      if (error) throw error;

      toast({
        title: "Cleanup Complete",
        description: `Deleted ${stats.old} old notifications.`,
      });

      fetchStats();
      fetchSentNotifications();
    } catch (error) {
      console.error("Error cleaning up:", error);
      toast({
        title: "Error",
        description: "Failed to cleanup old notifications.",
        variant: "destructive",
      });
    } finally {
      setCleaningOld(false);
    }
  };

  const deleteNotification = async (id: string) => {
    if (!confirm("Delete this notification?")) return;

    try {
      console.log("Attempting to delete notification:", id);
      
      const { data, error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", id)
        .select();

      if (error) {
        console.error("Delete error:", error);
        throw error;
      }

      console.log("Delete successful:", data);

      toast({
        title: "Deleted",
        description: "Notification deleted successfully.",
      });

      // Remove from local state immediately
      setSentNotifications(prev => prev.filter(n => n.id !== id));
      
      // Refresh data
      fetchSentNotifications();
      fetchStats();
    } catch (error: any) {
      console.error("Error deleting notification:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete notification.",
        variant: "destructive",
      });
    }
  };

  const toggleSelectNotification = (id: string) => {
    const newSelected = new Set(selectedNotifications);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedNotifications(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedNotifications.size === sentNotifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(new Set(sentNotifications.map(n => n.id)));
    }
  };

  const deleteBulk = async () => {
    if (selectedNotifications.size === 0) return;
    
    if (!confirm(`Delete ${selectedNotifications.size} selected notifications?`)) return;

    setDeletingBulk(true);
    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .in("id", Array.from(selectedNotifications));

      if (error) throw error;

      toast({
        title: "Deleted",
        description: `Successfully deleted ${selectedNotifications.size} notifications.`,
      });

      setSelectedNotifications(new Set());
      fetchSentNotifications();
      fetchStats();
    } catch (error) {
      console.error("Error deleting notifications:", error);
      toast({
        title: "Error",
        description: "Failed to delete notifications.",
        variant: "destructive",
      });
    } finally {
      setDeletingBulk(false);
    }
  };

  const sendNotification = async () => {
    if (!formData.title || !formData.message) {
      toast({
        title: "Missing Information",
        description: "Please fill in title and message.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (formData.recipient_type === "all") {
        // Send to all users
        const notifications = users.map((user) => ({
          user_id: user.user_id,
          title: formData.title,
          message: formData.message,
          type: formData.type,
          link: formData.link || null,
        }));

        const { error } = await supabase
          .from("notifications")
          .insert(notifications);

        if (error) throw error;

        toast({
          title: "Notifications Sent",
          description: `Successfully sent to ${users.length} users.`,
        });
      } else {
        // Send to specific user
        if (!formData.user_id) {
          toast({
            title: "No User Selected",
            description: "Please select a user.",
            variant: "destructive",
          });
          return;
        }

        const { error } = await supabase
          .from("notifications")
          .insert({
            user_id: formData.user_id,
            title: formData.title,
            message: formData.message,
            type: formData.type,
            link: formData.link || null,
          });

        if (error) throw error;

        toast({
          title: "Notification Sent",
          description: "Successfully sent to the selected user.",
        });
      }

      // Reset form
      setFormData({
        recipient_type: "all",
        user_id: "",
        title: "",
        message: "",
        type: "info",
        link: "",
      });
    } catch (error) {
      console.error("Error sending notification:", error);
      toast({
        title: "Error",
        description: "Failed to send notification. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground mb-2">
            {showManage ? "Manage Notifications" : "Send Notifications"}
          </h1>
          <p className="text-muted-foreground">
            {showManage ? "View and manage sent notifications" : "Send custom notifications to users"}
          </p>
        </div>
        <Button
          onClick={() => setShowManage(!showManage)}
          variant="outline"
          className="gap-2"
        >
          {showManage ? (
            <>
              <Send className="w-4 h-4" />
              Send New
            </>
          ) : (
            <>
              <History className="w-4 h-4" />
              View History
            </>
          )}
        </Button>
      </div>

      {showManage ? (
        // Manage Notifications View
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 glass border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Total</p>
                  <p className="text-2xl font-black text-foreground">{stats.total}</p>
                </div>
                <Calendar className="w-8 h-8 text-primary opacity-50" />
              </div>
            </Card>

            <Card className="p-4 glass border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Today</p>
                  <p className="text-2xl font-black text-foreground">{stats.today}</p>
                </div>
                <Calendar className="w-8 h-8 text-green-500 opacity-50" />
              </div>
            </Card>

            <Card className="p-4 glass border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">This Week</p>
                  <p className="text-2xl font-black text-foreground">{stats.week}</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-500 opacity-50" />
              </div>
            </Card>

            <Card className="p-4 glass border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Old (7+ days)</p>
                  <p className="text-2xl font-black text-foreground">{stats.old}</p>
                </div>
                <Calendar className="w-8 h-8 text-orange-500 opacity-50" />
              </div>
            </Card>
          </div>

          {/* Cleanup Button */}
          {stats.old > 0 && (
            <Card className="p-4 glass border-white/10 border-orange-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/20">
                    <Trash2 className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Auto Cleanup Available</h3>
                    <p className="text-sm text-muted-foreground">
                      {stats.old} notifications are older than 7 days
                    </p>
                  </div>
                </div>
                <Button
                  onClick={cleanupOldNotifications}
                  disabled={cleaningOld}
                  variant="outline"
                  className="gap-2 border-orange-500/20 hover:bg-orange-500/10"
                >
                  {cleaningOld ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Cleaning...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Cleanup Old
                    </>
                  )}
                </Button>
              </div>
            </Card>
          )}

          {/* Date Filter */}
          <Card className="p-4 glass border-white/10">
            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-primary" />
              <div className="flex gap-2">
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setDateFilter(option.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      dateFilter === option.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-white/5 text-muted-foreground hover:bg-white/10"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Notifications List */}
          <Card className="p-6 glass border-white/10">
            {loadingHistory ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : sentNotifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No notifications found</p>
              </div>
            ) : (
              <>
                {/* Bulk Actions */}
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedNotifications.size === sentNotifications.length && sentNotifications.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-white/20 bg-white/5 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-muted-foreground">
                      {selectedNotifications.size > 0
                        ? `${selectedNotifications.size} selected`
                        : "Select all"}
                    </span>
                  </div>
                  {selectedNotifications.size > 0 && (
                    <Button
                      onClick={deleteBulk}
                      disabled={deletingBulk}
                      variant="destructive"
                      size="sm"
                      className="gap-2"
                    >
                      {deletingBulk ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          Delete Selected
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {/* Notifications */}
                <div className="space-y-3">
                  {sentNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <input
                          type="checkbox"
                          checked={selectedNotifications.has(notification.id)}
                          onChange={() => toggleSelectNotification(notification.id)}
                          className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 text-primary focus:ring-primary"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">
                              {notificationTypes.find((t) => t.value === notification.type)?.icon || "📢"}
                            </span>
                            <h3 className="font-bold text-foreground">{notification.title}</h3>
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                notificationTypes.find((t) => t.value === notification.type)?.color || "text-blue-500"
                              } bg-white/10`}
                            >
                              {notification.type}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>
                              To: {notification.profiles?.full_name || "User"} ({notification.profiles?.email})
                            </span>
                            <span>•</span>
                            <span>{formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}</span>
                            {notification.link && (
                              <>
                                <span>•</span>
                                <span className="text-primary">{notification.link}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <Button
                          onClick={() => deleteNotification(notification.id)}
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>
        </div>
      ) : (
        // Send Notifications View (existing form)
        <Card className="p-6 glass border-white/10">
        <div className="space-y-6">
          {/* Recipient Type - Enhanced */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-3">
              Send To
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setFormData({ ...formData, recipient_type: "all", user_id: "" })}
                className={`relative p-6 rounded-xl border-2 transition-all group hover:scale-105 ${
                  formData.recipient_type === "all"
                    ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                    : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"
                }`}
              >
                {/* Selected Indicator */}
                {formData.recipient_type === "all" && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary border-2 border-background flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                  </div>
                )}
                
                <Users className={`w-8 h-8 mx-auto mb-3 transition-all group-hover:scale-110 ${
                  formData.recipient_type === "all" ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                }`} />
                <p className={`font-bold transition-colors ${
                  formData.recipient_type === "all" ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                }`}>
                  All Users
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Send to everyone
                </p>
                
                {/* Hover Glow Effect */}
                <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity ${
                  formData.recipient_type === "all" ? "bg-primary/5" : "bg-white/5"
                }`} />
              </button>
              
              <button
                onClick={() => setFormData({ ...formData, recipient_type: "specific" })}
                className={`relative p-6 rounded-xl border-2 transition-all group hover:scale-105 ${
                  formData.recipient_type === "specific"
                    ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                    : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"
                }`}
              >
                {/* Selected Indicator */}
                {formData.recipient_type === "specific" && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary border-2 border-background flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                  </div>
                )}
                
                <User className={`w-8 h-8 mx-auto mb-3 transition-all group-hover:scale-110 ${
                  formData.recipient_type === "specific" ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                }`} />
                <p className={`font-bold transition-colors ${
                  formData.recipient_type === "specific" ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                }`}>
                  Specific User
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Choose one user
                </p>
                
                {/* Hover Glow Effect */}
                <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity ${
                  formData.recipient_type === "specific" ? "bg-primary/5" : "bg-white/5"
                }`} />
              </button>
            </div>
          </div>

          {/* User Selection with Search - Improved Dropdown Style */}
          {formData.recipient_type === "specific" && (
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Select User
              </label>
              
              {/* Selected User Display */}
              {formData.user_id && !searchQuery ? (
                <div className="relative">
                  <div className="p-4 rounded-xl bg-primary/10 border-2 border-primary/30 flex items-center gap-3 group hover:bg-primary/15 transition-all">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground text-sm font-bold shadow-lg">
                      {users.find(u => u.user_id === formData.user_id)?.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground">
                        {users.find(u => u.user_id === formData.user_id)?.full_name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {users.find(u => u.user_id === formData.user_id)?.email}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setFormData({ ...formData, user_id: "" });
                        setSearchQuery("");
                      }}
                      className="p-2 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-all"
                      title="Clear selection"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => setSearchQuery(" ")}
                    className="absolute right-12 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground transition-colors"
                    title="Change user"
                  >
                    <User className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                /* Search Input */
                <div className="relative">
                  <User className="absolute left-3 top-3.5 w-5 h-5 text-muted-foreground pointer-events-none z-10" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or email..."
                    className="pl-10 bg-white/5 border-white/10 h-12"
                    autoFocus
                  />
                  
                  {/* Dropdown List */}
                  {searchQuery && (
                    <div className="absolute top-full left-0 right-0 mt-2 max-h-80 overflow-y-auto rounded-xl border border-white/10 bg-card shadow-2xl z-50 backdrop-blur-xl">
                      {filteredUsers.length === 0 ? (
                        <div className="p-8 text-center">
                          <User className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                          <p className="text-muted-foreground font-medium">No users found</p>
                          <p className="text-xs text-muted-foreground/60 mt-1">Try a different search term</p>
                        </div>
                      ) : (
                        <>
                          <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-white/10 px-4 py-2 z-10">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                              {filteredUsers.length} {filteredUsers.length === 1 ? 'User' : 'Users'} Found
                            </p>
                          </div>
                          <div className="p-2">
                            {filteredUsers.map((user, index) => (
                              <button
                                key={user.user_id}
                                onClick={() => {
                                  setFormData({ ...formData, user_id: user.user_id });
                                  setSearchQuery("");
                                }}
                                className="w-full text-left px-3 py-3 rounded-lg hover:bg-primary/10 transition-all border border-transparent hover:border-primary/20 flex items-center gap-3 group"
                              >
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground text-sm font-bold shadow-lg group-hover:scale-110 transition-transform flex-shrink-0">
                                  {user.full_name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-foreground group-hover:text-primary transition-colors truncate">
                                    {user.full_name}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {user.email}
                                  </p>
                                </div>
                                <div className="w-2 h-2 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Notification Type - Enhanced Card Style */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-3">
              Notification Type
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {notificationTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setFormData({ ...formData, type: type.value })}
                  className={`relative p-5 rounded-xl border-2 transition-all group hover:scale-105 ${
                    formData.type === type.value
                      ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                      : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"
                  }`}
                >
                  {/* Selected Indicator */}
                  {formData.type === type.value && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary border-2 border-background flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                    </div>
                  )}
                  
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                    {type.icon}
                  </div>
                  <p className={`text-sm font-bold transition-colors ${
                    formData.type === type.value ? type.color : "text-muted-foreground group-hover:text-foreground"
                  }`}>
                    {type.label}
                  </p>
                  
                  {/* Hover Glow Effect */}
                  <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity ${
                    formData.type === type.value ? "bg-primary/5" : "bg-white/5"
                  }`} />
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Title
            </label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter notification title"
              className="bg-white/5 border-white/10"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Message
            </label>
            <Textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Enter notification message"
              rows={4}
              className="bg-white/5 border-white/10"
            />
          </div>

          {/* Link (Optional) */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Link (Optional)
            </label>
            <Input
              value={formData.link}
              onChange={(e) => setFormData({ ...formData, link: e.target.value })}
              placeholder="/dashboard/events"
              className="bg-white/5 border-white/10"
            />
          </div>

          {/* Send Button */}
          <Button
            onClick={sendNotification}
            disabled={loading}
            className="w-full h-12 gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Send Notification
              </>
            )}
          </Button>
        </div>
      </Card>
      )}
    </div>
  );
}

export default function SendNotifications() {
  return (
    <AdminLayout>
      <SendNotificationsContent />
    </AdminLayout>
  );
}
