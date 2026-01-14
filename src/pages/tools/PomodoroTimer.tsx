import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Play, Pause, RotateCcw, Settings, TrendingUp,
  Clock, Target, Zap, ArrowLeft, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

type SessionType = 'work' | 'shortBreak' | 'longBreak';

interface PomodoroSettings {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  soundEnabled: boolean;
}

interface Stats {
  completedPomodoros: number;
  totalMinutes: number;
  currentStreak: number;
  todayPomodoros: number;
}

const SESSION_LABELS = {
  work: 'Focus Time',
  shortBreak: 'Short Break',
  longBreak: 'Long Break',
};

export default function PomodoroTimer() {
  const [sessionType, setSessionType] = useState<SessionType>('work');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<PomodoroSettings>({
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    longBreakInterval: 4,
    autoStartBreaks: false,
    autoStartPomodoros: false,
    soundEnabled: true,
  });
  const [stats, setStats] = useState<Stats>({
    completedPomodoros: 0,
    totalMinutes: 0,
    currentStreak: 0,
    todayPomodoros: 0,
  });
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const totalTimeRef = useRef(25 * 60);

  // Load stats and settings from localStorage
  useEffect(() => {
    const savedStats = localStorage.getItem('pomodoroStats');
    const savedSettings = localStorage.getItem('pomodoroSettings');
    
    if (savedStats) setStats(JSON.parse(savedStats));
    if (savedSettings) {
      const loaded = JSON.parse(savedSettings);
      setSettings(loaded);
      setTimeLeft(loaded.workDuration * 60);
      totalTimeRef.current = loaded.workDuration * 60;
    }

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Save stats to localStorage
  useEffect(() => {
    localStorage.setItem('pomodoroStats', JSON.stringify(stats));
  }, [stats]);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('pomodoroSettings', JSON.stringify(settings));
  }, [settings]);

  // Timer logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleSessionComplete();
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timeLeft]);

  const handleSessionComplete = () => {
    setIsRunning(false);
    
    if (settings.soundEnabled) {
      playNotificationSound();
    }

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Pomodoro Timer', {
        body: sessionType === 'work' 
          ? 'Work session complete! Time for a break.' 
          : 'Break over! Ready to focus?',
        icon: '/favicon.png',
      });
    }

    if (sessionType === 'work') {
      const newStats = {
        ...stats,
        completedPomodoros: stats.completedPomodoros + 1,
        totalMinutes: stats.totalMinutes + settings.workDuration,
        currentStreak: stats.currentStreak + 1,
        todayPomodoros: stats.todayPomodoros + 1,
      };
      setStats(newStats);

      // Switch to break
      const shouldTakeLongBreak = (stats.completedPomodoros + 1) % settings.longBreakInterval === 0;
      const nextSession: SessionType = shouldTakeLongBreak ? 'longBreak' : 'shortBreak';
      const nextDuration = shouldTakeLongBreak ? settings.longBreakDuration : settings.shortBreakDuration;
      
      setSessionType(nextSession);
      setTimeLeft(nextDuration * 60);
      totalTimeRef.current = nextDuration * 60;

      if (settings.autoStartBreaks) {
        setTimeout(() => setIsRunning(true), 1000);
      }
    } else {
      setSessionType('work');
      setTimeLeft(settings.workDuration * 60);
      totalTimeRef.current = settings.workDuration * 60;

      if (settings.autoStartPomodoros) {
        setTimeout(() => setIsRunning(true), 1000);
      }
    }
  };

  const playNotificationSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    const duration = sessionType === 'work' 
      ? settings.workDuration 
      : sessionType === 'shortBreak' 
      ? settings.shortBreakDuration 
      : settings.longBreakDuration;
    setTimeLeft(duration * 60);
    totalTimeRef.current = duration * 60;
  };

  const updateSettings = (key: keyof PomodoroSettings, value: number | boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    // Update timer if changing duration for current session
    if (!isRunning) {
      if (key === 'workDuration' && sessionType === 'work') {
        setTimeLeft((value as number) * 60);
        totalTimeRef.current = (value as number) * 60;
      } else if (key === 'shortBreakDuration' && sessionType === 'shortBreak') {
        setTimeLeft((value as number) * 60);
        totalTimeRef.current = (value as number) * 60;
      } else if (key === 'longBreakDuration' && sessionType === 'longBreak') {
        setTimeLeft((value as number) * 60);
        totalTimeRef.current = (value as number) * 60;
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((totalTimeRef.current - timeLeft) / totalTimeRef.current) * 100;
  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="glass border-b border-border">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="icon" className="rounded-xl">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-black text-foreground">Pomodoro Timer</h1>
                <p className="text-sm text-muted-foreground font-medium">Stay focused, work smart</p>
              </div>
            </div>
            <Button
              variant={showSettings ? "default" : "outline"}
              size="icon"
              className="rounded-xl"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Timer Section */}
          <div className="lg:col-span-2 space-y-8">
            {/* Timer Display */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-[2.5rem] border border-border p-12"
            >
              {/* Session Type Indicator */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-primary/10 border border-primary/20">
                  <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-primary animate-pulse' : 'bg-muted-foreground'}`} />
                  <span className="text-sm font-black text-primary uppercase tracking-widest">
                    {SESSION_LABELS[sessionType]}
                  </span>
                </div>
              </div>

              {/* Circular Progress Ring */}
              <div className="relative flex items-center justify-center mb-12">
                <svg className="transform -rotate-90" width="280" height="280">
                  {/* Background circle */}
                  <circle
                    cx="140"
                    cy="140"
                    r="120"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    className="text-muted/20"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="140"
                    cy="140"
                    r="120"
                    stroke="url(#gradient)"
                    strokeWidth="12"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-1000 ease-linear"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="hsl(29 92% 45%)" />
                      <stop offset="100%" stopColor="hsl(29 92% 60%)" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Timer Text */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-7xl font-black text-gradient mb-2">
                      {formatTime(timeLeft)}
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">
                      {isRunning ? 'In Progress' : 'Paused'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-center gap-4">
                <Button
                  size="lg"
                  variant={isRunning ? "outline" : "default"}
                  className="h-16 px-10 rounded-2xl font-black text-lg"
                  onClick={toggleTimer}
                >
                  {isRunning ? (
                    <>
                      <Pause className="w-6 h-6 mr-3" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-6 h-6 mr-3" />
                      Start
                    </>
                  )}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-16 px-10 rounded-2xl font-black text-lg"
                  onClick={resetTimer}
                >
                  <RotateCcw className="w-6 h-6 mr-3" />
                  Reset
                </Button>
              </div>
            </motion.div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Completed', value: stats.completedPomodoros, icon: CheckCircle2, color: 'from-primary to-accent' },
                { label: 'Total Minutes', value: stats.totalMinutes, icon: Clock, color: 'from-orange-500 to-primary' },
                { label: 'Streak', value: stats.currentStreak, icon: Zap, color: 'from-accent to-primary' },
                { label: 'Today', value: stats.todayPomodoros, icon: Target, color: 'from-primary to-primary' },
              ].map((stat, idx) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="glass-card rounded-3xl p-6 border border-border"
                >
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-3xl font-black text-foreground mb-1">{stat.value}</p>
                  <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                    {stat.label}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Settings Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <Card className="glass-card rounded-[2.5rem] border border-border p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                  <Settings className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-black text-foreground">Settings</h2>
              </div>

              <Tabs defaultValue="durations" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="durations">Durations</TabsTrigger>
                  <TabsTrigger value="preferences">Preferences</TabsTrigger>
                </TabsList>

                <TabsContent value="durations" className="space-y-6">
                  {/* Work Duration */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-bold">Work Duration</Label>
                      <span className="text-sm font-black text-primary">{settings.workDuration} min</span>
                    </div>
                    <Slider
                      value={[settings.workDuration]}
                      onValueChange={([value]) => updateSettings('workDuration', value)}
                      min={1}
                      max={60}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  {/* Short Break Duration */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-bold">Short Break</Label>
                      <span className="text-sm font-black text-primary">{settings.shortBreakDuration} min</span>
                    </div>
                    <Slider
                      value={[settings.shortBreakDuration]}
                      onValueChange={([value]) => updateSettings('shortBreakDuration', value)}
                      min={1}
                      max={30}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  {/* Long Break Duration */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-bold">Long Break</Label>
                      <span className="text-sm font-black text-primary">{settings.longBreakDuration} min</span>
                    </div>
                    <Slider
                      value={[settings.longBreakDuration]}
                      onValueChange={([value]) => updateSettings('longBreakDuration', value)}
                      min={1}
                      max={60}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  {/* Long Break Interval */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-bold">Long Break Interval</Label>
                      <span className="text-sm font-black text-primary">{settings.longBreakInterval} sessions</span>
                    </div>
                    <Slider
                      value={[settings.longBreakInterval]}
                      onValueChange={([value]) => updateSettings('longBreakInterval', value)}
                      min={2}
                      max={10}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="preferences" className="space-y-6">
                  {/* Auto-start Breaks */}
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/50">
                    <div className="space-y-1">
                      <Label className="text-sm font-bold">Auto-start Breaks</Label>
                      <p className="text-xs text-muted-foreground">Start breaks automatically</p>
                    </div>
                    <Switch
                      checked={settings.autoStartBreaks}
                      onCheckedChange={(checked) => updateSettings('autoStartBreaks', checked)}
                    />
                  </div>

                  {/* Auto-start Pomodoros */}
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/50">
                    <div className="space-y-1">
                      <Label className="text-sm font-bold">Auto-start Pomodoros</Label>
                      <p className="text-xs text-muted-foreground">Start work sessions automatically</p>
                    </div>
                    <Switch
                      checked={settings.autoStartPomodoros}
                      onCheckedChange={(checked) => updateSettings('autoStartPomodoros', checked)}
                    />
                  </div>

                  {/* Sound Notifications */}
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/50">
                    <div className="space-y-1">
                      <Label className="text-sm font-bold">Sound Notifications</Label>
                      <p className="text-xs text-muted-foreground">Play sound when timer ends</p>
                    </div>
                    <Switch
                      checked={settings.soundEnabled}
                      onCheckedChange={(checked) => updateSettings('soundEnabled', checked)}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </Card>

            {/* Tips Card */}
            <Card className="glass-card rounded-[2.5rem] border border-border p-8">
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-black text-foreground">Pro Tips</h3>
              </div>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Take short breaks to maintain focus throughout the day</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Use long breaks for meals or physical activity</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Track your progress to build consistent study habits</span>
                </li>
              </ul>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
