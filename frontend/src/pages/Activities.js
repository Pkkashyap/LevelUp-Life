import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../App';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { Plus, Trash2, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

const Activities = () => {
  const [activities, setActivities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    category_id: '',
    date: new Date().toISOString().split('T')[0],
    duration: '',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [activitiesRes, categoriesRes] = await Promise.all([
        api.get('/activities'),
        api.get('/categories'),
      ]);
      setActivities(activitiesRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load activities');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.category_id || !formData.duration) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const category = categories.find((c) => c.id === formData.category_id);
      await api.post('/activities', {
        ...formData,
        category_name: category.name,
        duration: parseInt(formData.duration),
      });
      toast.success('Activity logged successfully! +' + parseInt(formData.duration) * 10 + ' XP');
      setShowForm(false);
      setFormData({
        category_id: '',
        date: new Date().toISOString().split('T')[0],
        duration: '',
        notes: '',
      });
      fetchData();
    } catch (error) {
      console.error('Error creating activity:', error);
      toast.error('Failed to log activity');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/activities/${id}`);
      toast.success('Activity deleted');
      fetchData();
    } catch (error) {
      console.error('Error deleting activity:', error);
      toast.error('Failed to delete activity');
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-5xl lg:text-6xl font-secondary font-black tracking-tighter mb-2">
            Activities
          </h1>
          <p className="text-lg text-muted-foreground">Track your daily progress</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary text-white border-2 border-black shadow-brutal hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-bold"
          data-testid="add-activity-btn"
        >
          <Plus size={20} className="mr-2" />
          Log Activity
        </Button>
      </motion.div>

      {/* Add Activity Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-8"
        >
          <Card className="border-2 border-black shadow-brutal">
            <CardHeader>
              <CardTitle className="font-secondary text-2xl">Log New Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="category" className="font-bold">Category *</Label>
                  <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                    <SelectTrigger className="border-2 border-black" data-testid="category-select">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="date" className="font-bold">Date *</Label>
                  <Input
                    type="date"
                    id="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="border-2 border-black"
                    data-testid="date-input"
                  />
                </div>
                <div>
                  <Label htmlFor="duration" className="font-bold">Duration (minutes) *</Label>
                  <Input
                    type="number"
                    id="duration"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="60"
                    className="border-2 border-black"
                    data-testid="duration-input"
                  />
                </div>
                <div>
                  <Label htmlFor="notes" className="font-bold">Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Add any notes..."
                    className="border-2 border-black"
                    data-testid="notes-input"
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    type="submit"
                    className="flex-1 bg-primary text-white border-2 border-black shadow-brutal hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-bold"
                    data-testid="submit-activity-btn"
                  >
                    Log Activity
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setShowForm(false)}
                    variant="outline"
                    className="border-2 border-black shadow-brutal hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-bold"
                    data-testid="cancel-btn"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Activities List */}
      <div className="space-y-4">
        {activities.length > 0 ? (
          activities.map((activity, index) => {
            const category = categories.find((c) => c.id === activity.category_id);
            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white p-6 rounded-xl border-2 border-black shadow-brutal hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                data-testid={`activity-card-${index}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div
                      className="w-12 h-12 rounded-lg border-2 border-black flex items-center justify-center font-bold text-white"
                      style={{ backgroundColor: category?.color }}
                    >
                      {activity.duration}m
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold font-secondary">{activity.category_name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Calendar size={14} />
                        <span>{new Date(activity.date).toLocaleDateString()}</span>
                      </div>
                      {activity.notes && (
                        <p className="mt-2 text-sm text-muted-foreground">{activity.notes}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={() => handleDelete(activity.id)}
                    variant="destructive"
                    size="icon"
                    className="border-2 border-black shadow-brutal hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                    data-testid={`delete-activity-${index}`}
                  >
                    <Trash2 size={18} />
                  </Button>
                </div>
              </motion.div>
            );
          })
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <p className="text-2xl font-bold text-muted-foreground mb-4">No activities yet</p>
            <p className="text-muted-foreground mb-6">Start logging your first activity!</p>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-primary text-white border-2 border-black shadow-brutal hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-bold"
            >
              <Plus size={20} className="mr-2" />
              Log Your First Activity
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Activities;