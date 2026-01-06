import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../App';
import { Flame, Trophy, Activity as ActivityIcon, TrendingUp, Plus } from 'lucide-react';
import { Progress } from '../components/ui/progress';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, activitiesRes, categoriesRes, dailyRes] = await Promise.all([
        api.get('/stats'),
        api.get('/activities'),
        api.get('/categories'),
        api.get('/analytics/daily?days=7'),
      ]);
      setStats(statsRes.data);
      setActivities(activitiesRes.data.slice(0, 5));
      setCategories(categoriesRes.data);
      setDailyData(dailyRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const xpToNextLevel = 100 * stats?.level;
  const xpProgress = (stats?.xp / xpToNextLevel) * 100;

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-5xl lg:text-7xl font-secondary font-black tracking-tighter mb-2">
          Welcome Back!
        </h1>
        <p className="text-lg text-muted-foreground mb-8">Let's level up your life today</p>
      </motion.div>

      {/* Level Progress Bar */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-8 p-6 bg-gradient-to-r from-primary to-secondary rounded-xl border-2 border-black shadow-brutal"
        data-testid="level-progress-section"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-full p-2 border-2 border-black">
              <Trophy className="text-accent" size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Level {stats?.level}</h2>
              <p className="text-white/80 text-sm">{stats?.xp} / {xpToNextLevel} XP</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white/80 text-sm">Next Level</p>
            <p className="text-3xl font-bold text-white">{stats?.level + 1}</p>
          </div>
        </div>
        <div className="h-6 bg-white/20 rounded-full overflow-hidden border-2 border-black">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${xpProgress}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full bg-accent"
          />
        </div>
      </motion.div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Streak Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-xl border-2 border-black shadow-brutal hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
          data-testid="streak-card"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-accent/20 rounded-lg border-2 border-black">
              <Flame className="text-accent" size={24} strokeWidth={3} />
            </div>
            <h3 className="font-bold text-lg">Current Streak</h3>
          </div>
          <p className="text-4xl font-black font-secondary">{stats?.current_streak} days</p>
          <p className="text-sm text-muted-foreground mt-1">Longest: {stats?.longest_streak} days</p>
        </motion.div>

        {/* Total Activities Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-xl border-2 border-black shadow-brutal hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
          data-testid="total-activities-card"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-primary/20 rounded-lg border-2 border-black">
              <ActivityIcon className="text-primary" size={24} strokeWidth={3} />
            </div>
            <h3 className="font-bold text-lg">Activities</h3>
          </div>
          <p className="text-4xl font-black font-secondary">{stats?.total_activities}</p>
          <p className="text-sm text-muted-foreground mt-1">Total logged</p>
        </motion.div>

        {/* Level Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white p-6 rounded-xl border-2 border-black shadow-brutal hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
          data-testid="level-card"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-secondary/20 rounded-lg border-2 border-black">
              <TrendingUp className="text-secondary" size={24} strokeWidth={3} />
            </div>
            <h3 className="font-bold text-lg">Current Level</h3>
          </div>
          <p className="text-4xl font-black font-secondary">Level {stats?.level}</p>
          <p className="text-sm text-muted-foreground mt-1">{stats?.xp} XP earned</p>
        </motion.div>

        {/* Quick Add Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          onClick={() => navigate('/activities')}
          className="bg-gradient-to-br from-accent to-accent/80 p-6 rounded-xl border-2 border-black shadow-brutal hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer flex flex-col items-center justify-center"
          data-testid="quick-add-btn"
        >
          <Plus size={48} strokeWidth={3} className="mb-2" />
          <p className="font-bold text-lg text-center">Log Activity</p>
        </motion.div>
      </div>

      {/* Charts and Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="lg:col-span-2 bg-white p-6 rounded-xl border-2 border-black shadow-brutal"
          data-testid="weekly-chart"
        >
          <h3 className="text-2xl font-bold mb-4 font-secondary">Last 7 Days</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="date" stroke="#64748B" />
              <YAxis stroke="#64748B" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '2px solid #000000',
                  borderRadius: '8px',
                }}
              />
              {categories.map((cat) => (
                <Bar key={cat.id} dataKey={cat.name} fill={cat.color} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Recent Activities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white p-6 rounded-xl border-2 border-black shadow-brutal"
          data-testid="recent-activities"
        >
          <h3 className="text-2xl font-bold mb-4 font-secondary">Recent Activities</h3>
          <div className="space-y-3">
            {activities.length > 0 ? (
              activities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="flex items-center gap-3 p-3 bg-muted rounded-lg border-2 border-black"
                  data-testid={`activity-item-${index}`}
                >
                  <div
                    className="w-3 h-3 rounded-full border-2 border-black"
                    style={{ backgroundColor: categories.find((c) => c.id === activity.category_id)?.color }}
                  />
                  <div className="flex-1">
                    <p className="font-bold text-sm">{activity.category_name}</p>
                    <p className="text-xs text-muted-foreground">{activity.date}</p>
                  </div>
                  <span className="font-bold text-sm">{activity.duration}m</span>
                </motion.div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">No activities yet. Start logging!</p>
            )}
          </div>
          <Button
            onClick={() => navigate('/activities')}
            className="w-full mt-4 bg-primary text-white border-2 border-black shadow-brutal hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-bold"
            data-testid="view-all-activities-btn"
          >
            View All Activities
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;