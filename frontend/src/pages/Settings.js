import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../App';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { Plus, Trash2, Palette } from 'lucide-react';

const Settings = () => {
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    icon: 'Star',
    color: '#10B981',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Please enter a category name');
      return;
    }

    try {
      await api.post('/categories', formData);
      toast.success('Category created successfully!');
      setShowForm(false);
      setFormData({ name: '', icon: 'Star', color: '#10B981' });
      fetchCategories();
    } catch (error) {
      console.error('Error creating category:', error);
      toast.error('Failed to create category');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/categories/${id}`);
      toast.success('Category deleted');
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    }
  };

  const colorPresets = [
    '#3B82F6',
    '#8B5CF6',
    '#EF4444',
    '#6366F1',
    '#10B981',
    '#F59E0B',
    '#EC4899',
    '#14B8A6',
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
        <p className="text-lg text-muted-foreground">Manage your categories</p>
      </motion.div>

      {/* Add Category Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary text-white border-2 border-black shadow-brutal hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-bold"
          data-testid="add-category-btn"
        >
          <Plus size={20} className="mr-2" />
          Add Custom Category
        </Button>
      </motion.div>

      {/* Add Category Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-8"
        >
          <Card className="border-2 border-black shadow-brutal">
            <CardHeader>
              <CardTitle className="font-secondary text-2xl">Create Custom Category</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name" className="font-bold">Category Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Reading, Meditation, Coding"
                    className="border-2 border-black"
                    data-testid="category-name-input"
                  />
                </div>
                <div>
                  <Label className="font-bold mb-3 block">Color *</Label>
                  <div className="grid grid-cols-8 gap-2">
                    {colorPresets.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className={`w-10 h-10 rounded-lg border-2 transition-all ${
                          formData.color === color
                            ? 'border-black shadow-brutal scale-110'
                            : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                        data-testid={`color-${color}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    type="submit"
                    className="flex-1 bg-primary text-white border-2 border-black shadow-brutal hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-bold"
                    data-testid="submit-category-btn"
                  >
                    Create Category
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setShowForm(false)}
                    variant="outline"
                    className="border-2 border-black shadow-brutal hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-bold"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Categories List */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold font-secondary mb-4">Your Categories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white p-6 rounded-xl border-2 border-black shadow-brutal hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              data-testid={`category-card-${index}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-lg border-2 border-black flex items-center justify-center"
                    style={{ backgroundColor: category.color }}
                  >
                    <Palette className="text-white" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold font-secondary">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {category.is_custom ? 'Custom' : 'Default'}
                    </p>
                  </div>
                </div>
                {category.is_custom && (
                  <Button
                    onClick={() => handleDelete(category.id)}
                    variant="destructive"
                    size="icon"
                    className="border-2 border-black shadow-brutal hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                    data-testid={`delete-category-${index}`}
                  >
                    <Trash2 size={18} />
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Settings;