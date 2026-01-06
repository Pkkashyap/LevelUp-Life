import React from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import './ActivityHeatmap.css';
import { Tooltip } from './ui/tooltip';
import { TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

const ActivityHeatmap = ({ activities, categories }) => {
  // Get date range for last 365 days
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 365);

  // Process activities into heatmap format
  const activityMap = {};
  activities.forEach((activity) => {
    const date = activity.date;
    if (!activityMap[date]) {
      activityMap[date] = { date, count: 0, activities: [] };
    }
    activityMap[date].count += 1;
    activityMap[date].activities.push(activity);
  });

  const heatmapData = Object.values(activityMap);

  // Get intensity level based on activity count
  const getIntensityClass = (count) => {
    if (count === 0) return 'color-empty';
    if (count === 1) return 'color-scale-1';
    if (count === 2) return 'color-scale-2';
    if (count <= 4) return 'color-scale-3';
    return 'color-scale-4';
  };

  return (
    <div className="activity-heatmap-container">
      <div className="heatmap-header mb-4">
        <h3 className="text-xl font-bold font-secondary">365 Day Activity View</h3>
        <p className="text-sm text-muted-foreground">GitHub-style activity calendar</p>
      </div>
      <TooltipProvider>
        <CalendarHeatmap
          startDate={startDate}
          endDate={endDate}
          values={heatmapData}
          classForValue={(value) => {
            if (!value) {
              return 'color-empty';
            }
            return getIntensityClass(value.count);
          }}
          tooltipDataAttrs={(value) => {
            if (!value || !value.date) {
              return null;
            }
            return {
              'data-tip': `${value.date}: ${value.count} ${value.count === 1 ? 'activity' : 'activities'}`,
            };
          }}
          showWeekdayLabels
        />
      </TooltipProvider>
      <div className="heatmap-legend mt-4 flex items-center gap-2 justify-end">
        <span className="text-xs text-muted-foreground">Less</span>
        <div className="flex gap-1">
          <div className="legend-box color-empty" />
          <div className="legend-box color-scale-1" />
          <div className="legend-box color-scale-2" />
          <div className="legend-box color-scale-3" />
          <div className="legend-box color-scale-4" />
        </div>
        <span className="text-xs text-muted-foreground">More</span>
      </div>
    </div>
  );
};

export default ActivityHeatmap;