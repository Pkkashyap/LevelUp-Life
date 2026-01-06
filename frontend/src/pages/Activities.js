import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../App';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { Plus, Trash2, Calendar, Filter, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const Activities = () => {
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const itemsPerPage = 10;
  const [formData, setFormData] = useState({
    category_id: '',
    date: new Date().toISOString().split('T')[0],
    start_time: new Date().toTimeString().slice(0, 5), // Current time HH:MM
    duration: '',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [activities, filterCategory, filterDate]);

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

  const applyFilters = () => {
    let filtered = [...activities];
    
    if (filterCategory !== 'all') {
      filtered = filtered.filter(a => a.category_id === filterCategory);
    }
    
    if (filterDate) {
      filtered = filtered.filter(a => a.date === filterDate);
    }
    
    setFilteredActivities(filtered);
    setCurrentPage(1);
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

  const exportToPDF = () => {
    try {
      if (filteredActivities.length === 0) {
        toast.error('No activities to export');
        return;
      }

      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(20);
      doc.setTextColor(124, 58, 237);
      doc.text('LevelUp Life - Activity Report', 14, 20);
      
      // Add metadata
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
      doc.text(`Total Activities: ${filteredActivities.length}`, 14, 37);
      
      // Prepare table data
      const tableData = filteredActivities.map(activity => [
        new Date(activity.date).toLocaleDateString(),
        activity.category_name,
        `${activity.duration} min`,
        activity.notes || '-'
      ]);
      
      // Add table using autoTable
      autoTable(doc, {
        startY: 45,
        head: [['Date', 'Category', 'Duration', 'Notes']],
        body: tableData,
        theme: 'grid',
        styles: { 
          fontSize: 10,
          cellPadding: 3
        },
        headStyles: { 
          fillColor: [124, 58, 237],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        }
      });
      
      // Save the PDF
      doc.save(`levelup-activities-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error(`PDF export failed: ${error.message}`);
    }
  };

  const exportToExcel = () => {
    try {
      if (filteredActivities.length === 0) {
        toast.error('No activities to export');
        return;
      }

      // Prepare data for Excel
      const excelData = filteredActivities.map(activity => ({
        'Date': new Date(activity.date).toLocaleDateString(),
        'Category': activity.category_name,
        'Duration (minutes)': activity.duration,
        'Notes': activity.notes || '-',
        'XP Earned': activity.duration * 10,
        'Logged At': activity.created_at ? new Date(activity.created_at).toLocaleString() : '-'
      }));
      
      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // Set column widths
      worksheet['!cols'] = [
        { wch: 12 }, // Date
        { wch: 15 }, // Category
        { wch: 12 }, // Duration
        { wch: 30 }, // Notes
        { wch: 12 }, // XP
        { wch: 20 }  // Logged At
      ];
      
      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Activities');
      
      // Save file
      XLSX.writeFile(workbook, `levelup-activities-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Excel downloaded successfully!');
    } catch (error) {
      console.error('Excel export error:', error);
      toast.error(`Excel export failed: ${error.message}`);
    }
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentActivities = filteredActivities.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);

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
        <div className="flex gap-2">
          <Button
            onClick={exportToPDF}
            variant="outline"
            className="border-2 border-black shadow-brutal hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-bold"
            data-testid="export-pdf-btn"
          >
            <Download size={20} className="mr-2" />
            PDF
          </Button>
          <Button
            onClick={exportToExcel}
            variant="outline"
            className="border-2 border-black shadow-brutal hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-bold"
            data-testid="export-excel-btn"
          >
            <Download size={20} className="mr-2" />
            Excel
          </Button>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-primary text-white border-2 border-black shadow-brutal hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-bold"
            data-testid="add-activity-btn"
          >
            <Plus size={20} className="mr-2" />
            Log Activity
          </Button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-6 p-4 bg-white rounded-xl border-2 border-black shadow-brutal"
      >
        <div className="flex items-center gap-2 mb-3">
          <Filter size={20} />
          <h3 className="font-bold">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="font-bold mb-2 block">Category</Label>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="border-2 border-black">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="font-bold mb-2 block">Date</Label>
            <Input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="border-2 border-black"
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={() => { setFilterCategory('all'); setFilterDate(''); }}
              variant="outline"
              className="w-full border-2 border-black shadow-brutal hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-bold"
            >
              Clear Filters
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-3">
          Showing {filteredActivities.length} of {activities.length} activities
        </p>
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
        {currentActivities.length > 0 ? (
          <>
            {currentActivities.map((activity, index) => {
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
                          <span className="mx-2">•</span>
                          <span className="text-primary font-bold">+{activity.duration * 10} XP</span>
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
            })}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <Button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                  className="border-2 border-black shadow-brutal hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-bold"
                >
                  Previous
                </Button>
                <div className="flex items-center gap-2">
                  {[...Array(totalPages)].map((_, i) => (
                    <Button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      variant={currentPage === i + 1 ? "default" : "outline"}
                      className={`border-2 border-black shadow-brutal hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-bold ${
                        currentPage === i + 1 ? 'bg-primary text-white' : ''
                      }`}
                    >
                      {i + 1}
                    </Button>
                  ))}
                </div>
                <Button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  className="border-2 border-black shadow-brutal hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-bold"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <p className="text-2xl font-bold text-muted-foreground mb-4">No activities found</p>
            <p className="text-muted-foreground mb-6">
              {filterCategory !== 'all' || filterDate ? 'Try adjusting your filters' : 'Start logging your first activity!'}
            </p>
            {(filterCategory === 'all' && !filterDate) && (
              <Button
                onClick={() => setShowForm(true)}
                className="bg-primary text-white border-2 border-black shadow-brutal hover:shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-bold"
              >
                <Plus size={20} className="mr-2" />
                Log Your First Activity
              </Button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Activities;