import { useState, useEffect } from 'react';
import { api } from '../App';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent } from '../components/ui/card';
import { toast } from 'sonner';
import { Plus, Calendar, Trash2, Pencil } from 'lucide-react';

export default function Leaves() {
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLeave, setEditingLeave] = useState(null);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    employee_id: '',
    leave_type: 'annual',
    from_date: new Date().toISOString().split('T')[0],
    to_date: new Date().toISOString().split('T')[0],
    reason: '',
  });

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setUser(userData);
    fetchLeaves();
    fetchEmployees();
  }, []);

  const fetchLeaves = async () => {
    try {
      const response = await api.get('/leaves');
      setLeaves(response.data);
    } catch (error) {
      toast.error('Failed to fetch leaves');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/employees');
      setEmployees(response.data);
    } catch (error) {
      console.error('Failed to fetch employees');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingLeave) {
        await api.put(`/leaves/${editingLeave.id}`, formData);
        toast.success('Leave updated successfully');
      } else {
        await api.post('/leaves', formData);
        toast.success('Leave applied successfully');
      }
      setDialogOpen(false);
      resetForm();
      fetchLeaves();
    } catch (error) {
      toast.error(error.response?.data?.detail || `Failed to ${editingLeave ? 'update' : 'apply'} leave`);
    }
  };

  const handleEdit = (leave) => {
    setEditingLeave(leave);
    setFormData({
      employee_id: leave.employee_id,
      leave_type: leave.leave_type,
      from_date: leave.from_date,
      to_date: leave.to_date,
      reason: leave.reason,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (leaveId) => {
    if (!window.confirm('Are you sure you want to delete this leave?')) return;
    try {
      await api.delete(`/leaves/${leaveId}`);
      toast.success('Leave deleted successfully');
      fetchLeaves();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete leave');
    }
  };

  const resetForm = () => {
    setFormData({
      employee_id: '',
      leave_type: 'annual',
      from_date: new Date().toISOString().split('T')[0],
      to_date: new Date().toISOString().split('T')[0],
      reason: '',
    });
    setEditingLeave(null);
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'accountant';

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  // Only show button for admin, manager, accountant
  const canApplyLeave = isAdmin;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900" style={{ fontFamily: 'Work Sans, sans-serif' }} data-testid="leaves-title">
            Leave Management
          </h1>
          {canApplyLeave && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  data-testid="apply-leave-button"
                  onClick={resetForm}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Apply Leave
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle style={{ fontFamily: 'Work Sans, sans-serif' }}>
                    {editingLeave ? 'Edit Leave' : 'Apply Leave for Employee'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingLeave ? 'Update leave details' : 'Select an employee and apply leave on their behalf'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Employee *</label>
                    <Select value={formData.employee_id} onValueChange={(value) => setFormData({ ...formData, employee_id: value })}>
                      <SelectTrigger data-testid="employee-select">
                        <SelectValue placeholder="Select Employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map(emp => (
                          <SelectItem key={emp.id} value={emp.id}>{emp.name} ({emp.employee_id || 'No ID'})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Leave Type *</label>
                    <Select value={formData.leave_type} onValueChange={(value) => setFormData({ ...formData, leave_type: value })}>
                      <SelectTrigger data-testid="leave-type-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="annual">Annual Leave</SelectItem>
                        <SelectItem value="casual">Casual Leave</SelectItem>
                        <SelectItem value="sick">Sick Leave</SelectItem>
                        <SelectItem value="no_pay">No Pay Leave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">From Date *</label>
                      <Input
                        data-testid="from-date-input"
                        type="date"
                        value={formData.from_date}
                        onChange={(e) => setFormData({ ...formData, from_date: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">To Date *</label>
                      <Input
                        data-testid="to-date-input"
                        type="date"
                        value={formData.to_date}
                        onChange={(e) => setFormData({ ...formData, to_date: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Reason *</label>
                    <Textarea
                      data-testid="reason-textarea"
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      placeholder="Please provide a reason for the leave"
                      rows={4}
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      data-testid="submit-leave-button"
                      type="submit"
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    >
                      {editingLeave ? 'Update Leave' : 'Apply Leave'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Leaves List */}
        <div className="space-y-4" data-testid="leaves-list">
          {leaves.map((leave) => (
            <Card key={leave.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900" style={{ fontFamily: 'Work Sans, sans-serif' }}>
                          {leave.employee_name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {leave.leave_type.charAt(0).toUpperCase() + leave.leave_type.slice(1)} Leave
                        </p>
                      </div>
                      <span className="text-xs px-3 py-1 rounded-full whitespace-nowrap bg-blue-100 text-blue-700">
                        Applied
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-600">Duration</p>
                        <p className="font-medium text-sm">
                          {leave.from_date} to {leave.to_date}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Applied On</p>
                        <p className="font-medium text-sm">{new Date(leave.applied_date).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-600 mb-1">Reason</p>
                      <p className="text-sm text-gray-700">{leave.reason}</p>
                    </div>

                    {leave.applied_by && (
                      <p className="text-xs text-gray-500">Applied by: {leave.applied_by}</p>
                    )}
                  </div>

                  {canApplyLeave && (
                    <div className="flex lg:flex-col gap-2">
                      <Button
                        data-testid={`edit-leave-${leave.id}`}
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(leave)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Pencil className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        data-testid={`delete-leave-${leave.id}`}
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(leave.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {leaves.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No leaves found</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
