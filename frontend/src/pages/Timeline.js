import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../App';
import { Clock, Calendar as CalendarIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

const Timeline = () => {
  const [activities, setActivities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [timelineData, setTimelineData] = useState([]);

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    try {
      const [activitiesRes, categoriesRes] = await Promise.all([
        api.get('/activities'),
        api.get('/categories'),
      ]);
      setActivities(activitiesRes.data);
      setCategories(categoriesRes.data);
      processTimelineData(activitiesRes.data, categoriesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load timeline');
    }
  };

  const processTimelineData = (allActivities, allCategories) => {
    const dayActivities = allActivities.filter(a => a.date === selectedDate);
    
    // Create 24-hour timeline blocks
    const timeline = [];
    for (let hour = 0; hour < 24; hour++) {
      timeline.push({
        hour,
        activities: [],
        totalMinutes: 0
      });
    }

    // Place activities at their actual logged times
    dayActivities.forEach(activity => {
      const category = allCategories.find(c => c.id === activity.category_id);
      
      // Parse start time
      const [startHour, startMinute] = activity.start_time.split(':').map(Number);
      const duration = activity.duration;
      
      // Calculate which hours this activity spans
      let remainingMinutes = duration;
      let currentHour = startHour;
      let currentMinute = startMinute;
      
      while (remainingMinutes > 0 && currentHour < 24) {
        const minutesInThisHour = Math.min(remainingMinutes, 60 - currentMinute);
        
        timeline[currentHour].activities.push({
          ...activity,
          category,
          minutesInHour: minutesInThisHour,
          startMinuteInHour: currentMinute
        });
        timeline[currentHour].totalMinutes += minutesInThisHour;
        
        remainingMinutes -= minutesInThisHour;
        currentHour++;
        currentMinute = 0; // After first hour, always start at :00
      }
    });

    setTimelineData(timeline);
  };

  const formatHour = (hour) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour} ${period}`;
  };

  const getTotalDuration = () => {
    return activities
      .filter(a => a.date === selectedDate)
      .reduce((sum, a) => sum + a.duration, 0);
  };

  const getCategoryBreakdown = () => {
    const dayActivities = activities.filter(a => a.date === selectedDate);
    const breakdown = {};
    
    dayActivities.forEach(activity => {
      if (!breakdown[activity.category_name]) {
        breakdown[activity.category_name] = {
          duration: 0,
          color: categories.find(c => c.id === activity.category_id)?.color
        };
      }
      breakdown[activity.category_name].duration += activity.duration;
    });
    
    return breakdown;
  };

  const categoryBreakdown = getCategoryBreakdown();
  const totalDuration = getTotalDuration();

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-5xl lg:text-6xl font-secondary font-black tracking-tighter mb-2">
          24-Hour Timeline
        </h1>
        <p className="text-lg text-muted-foreground">See what you did throughout the day</p>
      </motion.div>

      {/* Date Selector */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <Card className="border-2 border-black shadow-brutal">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <CalendarIcon size={24} />
              <div className="flex-1">
                <Label className="font-bold mb-2 block">Select Date</Label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border-2 border-black"
                  data-testid="date-selector"
                />
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Duration</p>
                <p className="text-3xl font-black font-secondary">{totalDuration}m</p>
                <p className="text-sm text-muted-foreground">{(totalDuration / 60).toFixed(1)} hours</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Category Summary */}
      {Object.keys(categoryBreakdown).length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <Card className="border-2 border-black shadow-brutal">
            <CardHeader>
              <CardTitle className="font-secondary text-2xl">Daily Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(categoryBreakdown).map(([name, data]) => (
                  <div
                    key={name}
                    className="p-4 rounded-lg border-2 border-black"
                    style={{ backgroundColor: `${data.color}20` }}
                  >
                    <div
                      className="w-8 h-8 rounded-full border-2 border-black mb-2"
                      style={{ backgroundColor: data.color }}
                    />
                    <p className="font-bold text-sm">{name}</p>
                    <p className="text-2xl font-black font-secondary">{data.duration}m</p>
                    <p className="text-xs text-muted-foreground">
                      {((data.duration / totalDuration) * 100).toFixed(0)}% of day
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* 24-Hour Timeline */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-2 border-black shadow-brutal">
          <CardHeader>
            <CardTitle className="font-secondary text-2xl flex items-center gap-2">
              <Clock size={24} />
              Hour-by-Hour View
            </CardTitle>
          </CardHeader>
          <CardContent>
            {timelineData.some(t => t.activities.length > 0) ? (
              <div className="space-y-2">
                {timelineData.map((block, index) => (
                  block.activities.length > 0 && (
                    <motion.div
                      key={block.hour}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="flex items-start gap-4 p-4 bg-muted rounded-lg border-2 border-black"
                      data-testid={`timeline-hour-${block.hour}`}
                    >
                      <div className="w-20 flex-shrink-0">
                        <p className="font-bold text-lg">{formatHour(block.hour)}</p>
                        <p className="text-xs text-muted-foreground">{block.totalMinutes}m</p>
                      </div>
                      <div className="flex-1 space-y-2">
                        {block.activities.map((activity, idx) => (
                          <div
                            key={`${activity.id}-${idx}`}
                            className="flex items-center gap-3 p-3 bg-white rounded-lg border-2 border-black"
                          >
                            <div
                              className="w-10 h-10 rounded-lg border-2 border-black flex items-center justify-center text-white font-bold text-sm"
                              style={{ backgroundColor: activity.category?.color }}
                            >
                              {activity.minutesInHour}m
                            </div>
                            <div className="flex-1">
                              <p className="font-bold">{activity.category_name}</p>
                              {activity.notes && (
                                <p className="text-sm text-muted-foreground">{activity.notes}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-primary">+{activity.minutesInHour * 10} XP</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <Clock size={64} className="mx-auto mb-4 text-muted-foreground" />
                <p className="text-2xl font-bold text-muted-foreground mb-2">No activities on this day</p>
                <p className="text-muted-foreground">Select a different date or log some activities!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Timeline;
