import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Star, Lock, Sparkles, TrendingUp } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
  category: string;
}

interface UserAchievement {
  achievement_id: string;
  earned_at: string;
}

interface Profile {
  xp_points: number;
  level: number;
}

export default function Achievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      // Fetch all achievements
      const { data: achievementsData } = await supabase
        .from("achievements")
        .select("*")
        .order("xp_reward", { ascending: true });

      // Fetch user achievements
      const { data: userAchievementsData } = await supabase
        .from("user_achievements")
        .select("achievement_id, earned_at")
        .eq("user_id", user.id);

      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("xp_points, level")
        .eq("user_id", user.id)
        .maybeSingle();

      setAchievements(achievementsData || []);
      setUserAchievements(userAchievementsData || []);
      setProfile(profileData);
    } catch (error) {
      console.error("Error fetching achievements:", error);
    } finally {
      setLoading(false);
    }
  };

  const isEarned = (achievementId: string) => {
    return userAchievements.some((ua) => ua.achievement_id === achievementId);
  };

  const earnedCount = userAchievements.length;
  const totalCount = achievements.length;
  const progressPercent = totalCount > 0 ? (earnedCount / totalCount) * 100 : 0;

  const xpToNextLevel = (profile?.level || 1) * 100;
  const currentXpProgress = (profile?.xp_points || 0) % 100;
  const levelProgress = (currentXpProgress / 100) * 100;

  const categories = [...new Set(achievements.map((a) => a.category))];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header Stats */}
        <div className="grid md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-br from-primary to-accent rounded-2xl p-6 text-primary-foreground"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
                <Trophy className="w-8 h-8" />
              </div>
              <div>
                <p className="text-primary-foreground/70 text-sm">Level</p>
                <p className="font-heading text-3xl font-bold">
                  {profile?.level || 1}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>XP Progress</span>
                <span>{currentXpProgress}/100</span>
              </div>
              <div className="h-2 bg-primary-foreground/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-foreground rounded-full transition-all duration-500"
                  style={{ width: `${levelProgress}%` }}
                />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-card rounded-2xl border border-border p-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-secondary/10 flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-secondary" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Total XP</p>
                <p className="font-heading text-3xl font-bold text-foreground">
                  {profile?.xp_points || 0}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-card rounded-2xl border border-border p-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center">
                <Star className="w-8 h-8 text-accent" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Achievements</p>
                <p className="font-heading text-3xl font-bold text-foreground">
                  {earnedCount}/{totalCount}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Achievements by Category */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="h-40 bg-card rounded-2xl border border-border animate-pulse"
              />
            ))}
          </div>
        ) : (
          categories.map((category) => (
            <div key={category} className="space-y-4">
              <h2 className="font-heading text-lg font-semibold text-foreground capitalize">
                {category} Achievements
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {achievements
                  .filter((a) => a.category === category)
                  .map((achievement, index) => {
                    const earned = isEarned(achievement.id);
                    return (
                      <motion.div
                        key={achievement.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className={`relative p-5 rounded-2xl border transition-all duration-300 ${
                          earned
                            ? "bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30"
                            : "bg-card border-border opacity-60"
                        }`}
                      >
                        {!earned && (
                          <div className="absolute top-3 right-3">
                            <Lock className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                        <div
                          className={`text-4xl mb-3 ${
                            earned ? "" : "grayscale"
                          }`}
                        >
                          {achievement.icon}
                        </div>
                        <h3
                          className={`font-medium mb-1 ${
                            earned ? "text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          {achievement.name}
                        </h3>
                        <p className="text-xs text-muted-foreground mb-2">
                          {achievement.description}
                        </p>
                        <div
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                            earned
                              ? "bg-secondary/20 text-secondary"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <Sparkles className="w-3 h-3" />
                          +{achievement.xp_reward} XP
                        </div>
                      </motion.div>
                    );
                  })}
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}
