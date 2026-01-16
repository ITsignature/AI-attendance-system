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
import { Plus, Wallet, Trash2, Pencil } from 'lucide-react';

export default function Advances() {
  const [advances, setAdvances] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAdvance, setEditingAdvance] = useState(null);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    employee_id: '',
    amount: 0,
    reason: '',
    repayment_months: 1,
  });

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setUser(userData);
    fetchAdvances();
    fetchEmployees();
  }, []);

  const fetchAdvances = async () => {
    try {
      const response = await api.get('/advances');
      setAdvances(response.data);
    } catch (error) {
      toast.error('Failed to fetch advances');
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
      if (editingAdvance) {
        await api.put(`/advances/${editingAdvance.id}`, formData);
        toast.success('Advance updated successfully');
      } else {
        await api.post('/advances', formData);
        toast.success('Advance applied successfully');
      }
      setDialogOpen(false);
      resetForm();
      fetchAdvances();
    } catch (error) {
      toast.error(error.response?.data?.detail || `Failed to ${editingAdvance ? 'update' : 'apply'} advance`);
    }
  };

  const handleEdit = (advance) => {
    setEditingAdvance(advance);
    setFormData({
      employee_id: advance.employee_id,
      amount: advance.amount,
      reason: advance.reason,
      repayment_months: advance.repayment_months,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (advanceId) => {
    if (!window.confirm('Are you sure you want to delete this advance?')) return;
    try {
      await api.delete(`/advances/${advanceId}`);
      toast.success('Advance deleted successfully');
      fetchAdvances();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete advance');
    }
  };

  const resetForm = () => {
    setFormData({
      employee_id: '',
      amount: 0,
      reason: '',
      repayment_months: 1,
    });
    setEditingAdvance(null);
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
  const canApplyAdvance = isAdmin;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900" style={{ fontFamily: 'Work Sans, sans-serif' }} data-testid="advances-title">
            Advance Management
          </h1>
          {canApplyAdvance && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  data-testid="request-advance-button"
                  onClick={resetForm}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Request Advance
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle style={{ fontFamily: 'Work Sans, sans-serif' }}>
                    {editingAdvance ? 'Edit Advance' : 'Request Advance for Employee'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingAdvance ? 'Update advance details' : 'Select an employee and request advance on their behalf'}
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
                    <label className="text-sm font-medium">Amount (Rs) *</label>
                    <Input
                      data-testid="amount-input"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                      placeholder="Enter amount"
                      required
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Repayment Months *</label>
                    <Input
                      data-testid="repayment-months-input"
                      type="number"
                      value={formData.repayment_months}
                      onChange={(e) => setFormData({ ...formData, repayment_months: parseInt(e.target.value) || 1 })}
                      placeholder="Number of months"
                      required
                      min="1"
                      max="12"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Reason *</label>
                    <Textarea
                      data-testid="reason-textarea"
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      placeholder="Please provide a reason for the advance"
                      rows={4}
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      data-testid="submit-advance-button"
                      type="submit"
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    >
                      {editingAdvance ? 'Update Advance' : 'Request Advance'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Advances List */}
        <div className="space-y-4" data-testid="advances-list">
          {advances.map((advance) => (
            <Card key={advance.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900" style={{ fontFamily: 'Work Sans, sans-serif' }}>
                          {advance.employee_name}
                        </h3>
                        <p className="text-xl font-bold text-blue-600 mt-1">
                          Rs. {advance.amount.toLocaleString()}
                        </p>
                      </div>
                      <span className="text-xs px-3 py-1 rounded-full whitespace-nowrap bg-blue-100 text-blue-700">
                        Applied
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-600">Repayment Period</p>
                        <p className="font-medium text-sm">
                          {advance.repayment_months} {advance.repayment_months === 1 ? 'month' : 'months'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Requested On</p>
                        <p className="font-medium text-sm">{new Date(advance.request_date).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-600 mb-1">Reason</p>
                      <p className="text-sm text-gray-700">{advance.reason}</p>
                    </div>

                    {advance.applied_by && (
                      <p className="text-xs text-gray-500">Applied by: {advance.applied_by}</p>
                    )}
                  </div>

                  {canApplyAdvance && (
                    <div className="flex lg:flex-col gap-2">
                      <Button
                        data-testid={`edit-advance-${advance.id}`}
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(advance)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Pencil className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        data-testid={`delete-advance-${advance.id}`}
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(advance.id)}
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

        {advances.length === 0 && (
          <div className="text-center py-12">
            <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No advances found</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
