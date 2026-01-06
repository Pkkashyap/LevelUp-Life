import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../App';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { Plus, Trash2, Palette, Award } from 'lucide-react';

const Settings = () => {
  const [categories, setCategories] = useState([]);
  const [badges, setBadges] = useState([]);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showBadgeForm, setShowBadgeForm] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    icon: 'Star',
    color: '#10B981',
  });
  const [badgeFormData, setBadgeFormData] = useState({
    name: '',
    description: '',
    icon: 'Star',
    condition_type: 'activity_count',
    condition_value: 10,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [categoriesRes, badgesRes] = await Promise.all([
        api.get('/categories'),
        api.get('/badges'),
      ]);
      setCategories(categoriesRes.data);
      setBadges(badgesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load settings');
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!categoryFormData.name) {
      toast.error('Please enter a category name');
      return;
    }

    try {
      await api.post('/categories', categoryFormData);
      toast.success('Category created successfully!');
      setShowCategoryForm(false);
      setCategoryFormData({ name: '', icon: 'Star', color: '#10B981' });
      fetchData();
    } catch (error) {
      console.error('Error creating category:', error);
      toast.error('Failed to create category');
    }
  };

  const handleBadgeSubmit = async (e) => {
    e.preventDefault();
    if (!badgeFormData.name || !badgeFormData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await api.post('/badges', badgeFormData);
      toast.success('Badge created successfully!');
      setShowBadgeForm(false);
      setBadgeFormData({
        name: '',
        description: '',
        icon: 'Star',
        condition_type: 'activity_count',
        condition_value: 10,
      });
      fetchData();
    } catch (error) {
      console.error('Error creating badge:', error);
      toast.error('Failed to create badge');
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      await api.delete(`/categories/${id}`);
      toast.success('Category deleted');
      fetchData();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    }
  };

  const handleDeleteBadge = async (id) => {
    try {
      await api.delete(`/badges/${id}`);
      toast.success('Badge deleted');
      fetchData();
    } catch (error) {
      console.error('Error deleting badge:', error);
      toast.error('Failed to delete badge');
    }
  };

  const colorPresets = [
    '#3B82F6', '#8B5CF6', '#EF4444', '#6366F1',
    '#10B981', '#F59E0B', '#EC4899', '#14B8A6',
  ];

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-5xl lg:text-6xl font-secondary font-black tracking-tighter mb-2">
          Settings
        </h1>
        <p className="text-lg text-muted-foreground">Customize your tracking experience</p>
      </motion.div>

      <Tabs defaultValue="categories" className="w-full">
        <TabsList className="grid w-full grid-cols-2 border-2 border-black mb-6">
          <TabsTrigger value="categories" className="font-bold" data-testid="categories-tab">
            <Palette className="mr-2" size={18} />
            Categories
          </TabsTrigger>
          <TabsTrigger value="badges" className="font-bold" data-testid="badges-tab">
            <Award className="mr-2" size={18} />
            Badges
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
            <Button
              onClick={() => setShowCategoryForm(!showCategoryForm)}
              className="bg-primary text-white border-2 border-black shadow-brutal hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-bold"
              data-testid="add-category-btn"
            >
              <Plus size={20} className="mr-2" />
              Add Custom Category
            </Button>
          </motion.div>

          {showCategoryForm && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-8">
              <Card className="border-2 border-black shadow-brutal">
                <CardHeader>
                  <CardTitle className="font-secondary text-2xl">Create Custom Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCategorySubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="name" className="font-bold">Category Name *</Label>
                      <Input id="name" value={categoryFormData.name} onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })} placeholder="e.g., Reading, Meditation" className="border-2 border-black" data-testid="category-name-input" />
                    </div>
                    <div>
                      <Label className="font-bold mb-3 block">Color *</Label>
                      <div className="grid grid-cols-8 gap-2">
                        {colorPresets.map((color) => (
                          <button key={color} type="button" onClick={() => setCategoryFormData({ ...categoryFormData, color })} className={`w-10 h-10 rounded-lg border-2 transition-all ${categoryFormData.color === color ? 'border-black shadow-brutal scale-110' : 'border-transparent'}`} style={{ backgroundColor: color }} data-testid={`color-${color}`} />
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button type="submit" className="flex-1 bg-primary text-white border-2 border-black shadow-brutal hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-bold" data-testid="submit-category-btn">Create Category</Button>
                      <Button type="button" onClick={() => setShowCategoryForm(false)} variant="outline" className="border-2 border-black shadow-brutal hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-bold">Cancel</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((category, index) => (
              <motion.div key={category.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className="bg-white p-6 rounded-xl border-2 border-black shadow-brutal hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all" data-testid={`category-card-${index}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg border-2 border-black flex items-center justify-center" style={{ backgroundColor: category.color }}>
                      <Palette className="text-white" size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold font-secondary">{category.name}</h3>
                      <p className="text-sm text-muted-foreground">{category.is_custom ? 'Custom' : 'Default'}</p>
                    </div>
                  </div>
                  {category.is_custom && (
                    <Button onClick={() => handleDeleteCategory(category.id)} variant="destructive" size="icon" className="border-2 border-black shadow-brutal hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all" data-testid={`delete-category-${index}`}>
                      <Trash2 size={18} />
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="badges">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
            <Button onClick={() => setShowBadgeForm(!showBadgeForm)} className="bg-secondary text-white border-2 border-black shadow-brutal hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-bold" data-testid="add-badge-btn">
              <Plus size={20} className="mr-2" />
              Create Custom Badge
            </Button>
          </motion.div>

          {showBadgeForm && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-8">
              <Card className="border-2 border-black shadow-brutal">
                <CardHeader>
                  <CardTitle className="font-secondary text-2xl">Create Custom Badge</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleBadgeSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="badge-name" className="font-bold">Badge Name *</Label>
                      <Input id="badge-name" value={badgeFormData.name} onChange={(e) => setBadgeFormData({ ...badgeFormData, name: e.target.value })} placeholder="e.g., Marathon Master" className="border-2 border-black" data-testid="badge-name-input" />
                    </div>
                    <div>
                      <Label htmlFor="badge-description" className="font-bold">Description *</Label>
                      <Input id="badge-description" value={badgeFormData.description} onChange={(e) => setBadgeFormData({ ...badgeFormData, description: e.target.value })} placeholder="What does this badge represent?" className="border-2 border-black" data-testid="badge-description-input" />
                    </div>
                    <div>
                      <Label className="font-bold">Unlock Condition</Label>
                      <Select value={badgeFormData.condition_type} onValueChange={(value) => setBadgeFormData({ ...badgeFormData, condition_type: value })}>
                        <SelectTrigger className="border-2 border-black"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="activity_count">Total Activities</SelectItem>
                          <SelectItem value="streak">Streak Days</SelectItem>
                          <SelectItem value="level">Reach Level</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="condition-value" className="font-bold">Condition Value *</Label>
                      <Input id="condition-value" type="number" value={badgeFormData.condition_value} onChange={(e) => setBadgeFormData({ ...badgeFormData, condition_value: parseInt(e.target.value) })} placeholder="e.g., 50" className="border-2 border-black" data-testid="condition-value-input" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {badgeFormData.condition_type === 'activity_count' && 'Number of activities to log'}
                        {badgeFormData.condition_type === 'streak' && 'Consecutive days to maintain'}
                        {badgeFormData.condition_type === 'level' && 'Level to reach'}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button type="submit" className="flex-1 bg-secondary text-white border-2 border-black shadow-brutal hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-bold" data-testid="submit-badge-btn">Create Badge</Button>
                      <Button type="button" onClick={() => setShowBadgeForm(false)} variant="outline" className="border-2 border-black shadow-brutal hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-bold">Cancel</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {badges.map((badge, index) => (
              <motion.div key={badge.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.05 }} className="bg-white p-6 rounded-xl border-2 border-black shadow-brutal hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all" data-testid={`badge-settings-card-${index}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-full border-2 border-black bg-accent flex items-center justify-center">
                    <Award size={24} />
                  </div>
                  {badge.id.includes('custom') && (
                    <Button onClick={() => handleDeleteBadge(badge.id)} variant="destructive" size="icon" className="border-2 border-black shadow-brutal hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all h-8 w-8">
                      <Trash2 size={14} />
                    </Button>
                  )}
                </div>
                <h3 className="text-lg font-bold font-secondary mb-1">{badge.name}</h3>
                <p className="text-sm text-muted-foreground mb-2">{badge.description}</p>
                <div className="flex items-center gap-2 text-xs">
                  <span className={`px-2 py-1 rounded-full border-2 border-black font-bold ${badge.id.includes('custom') ? 'bg-secondary/20 text-secondary' : 'bg-primary/20 text-primary'}`}>
                    {badge.id.includes('custom') ? 'Custom' : 'Default'}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
