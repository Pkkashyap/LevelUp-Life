import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../App';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';

const Analytics = () => {
  const [categories, setCategories] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('7');

  useEffect(() => {
    fetchData();
  }, [selectedPeriod]);

  const fetchData = async () => {
    try {
      const [categoriesRes, dailyRes, summaryRes] = await Promise.all([
        api.get('/categories'),
        api.get(`/analytics/daily?days=${selectedPeriod}`),
        api.get('/analytics/summary'),
      ]);
      setCategories(categoriesRes.data);
      setDailyData(dailyRes.data);
      setSummary(summaryRes.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics');
    }
  };

  const pieData = summary?.category_totals
    ? Object.entries(summary.category_totals).map(([name, value]) => ({
        name,
        value,
      }))
    : [];

  const COLORS = ['#3B82F6', '#8B5CF6', '#EF4444', '#6366F1', '#10B981', '#F59E0B'];

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-5xl lg:text-6xl font-secondary font-black tracking-tighter mb-2">
          Analytics
        </h1>
        <p className="text-lg text-muted-foreground">Visualize your progress</p>
      </motion.div>

      {/* Period Selector */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-48 border-2 border-black shadow-brutal" data-testid="period-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 Days</SelectItem>
            <SelectItem value="14">Last 14 Days</SelectItem>
            <SelectItem value="30">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Activity Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-2 border-black shadow-brutal" data-testid="daily-chart">
            <CardHeader>
              <CardTitle className="font-secondary text-2xl">Daily Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyData}>
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
                    <Line
                      key={cat.id}
                      type="monotone"
                      dataKey={cat.name}
                      stroke={cat.color}
                      strokeWidth={3}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Category Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-2 border-black shadow-brutal" data-testid="category-breakdown">
            <CardHeader>
              <CardTitle className="font-secondary text-2xl">Category Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      stroke="#000000"
                      strokeWidth={2}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        border: '2px solid #000000',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center">
                  <p className="text-muted-foreground">No data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Weekly Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2"
        >
          <Card className="border-2 border-black shadow-brutal" data-testid="weekly-comparison">
            <CardHeader>
              <CardTitle className="font-secondary text-2xl">Activity Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
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
                    <Bar key={cat.id} dataKey={cat.name} fill={cat.color} stroke="#000000" strokeWidth={2} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Summary Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2"
        >
          <Card className="border-2 border-black shadow-brutal" data-testid="summary-stats">
            <CardHeader>
              <CardTitle className="font-secondary text-2xl">30-Day Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {summary?.category_totals &&
                  Object.entries(summary.category_totals).map(([name, value]) => {
                    const category = categories.find((c) => c.name === name);
                    return (
                      <div
                        key={name}
                        className="p-4 rounded-lg border-2 border-black"
                        style={{ backgroundColor: `${category?.color}20` }}
                      >
                        <p className="text-sm font-bold text-muted-foreground">{name}</p>
                        <p className="text-3xl font-black font-secondary mt-1">{value}m</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {(value / 60).toFixed(1)} hours
                        </p>
                      </div>
                    );
                  })}
              </div>
              {summary?.total_activities > 0 && (
                <div className="mt-6 p-4 bg-primary/10 rounded-lg border-2 border-black">
                  <p className="text-lg font-bold">Total Activities: {summary.total_activities}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Analytics;