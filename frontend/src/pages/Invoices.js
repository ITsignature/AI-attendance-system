import { useState, useEffect } from 'react';
import { api } from '../App';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { Plus, FileText, Eye, Edit, DollarSign, Trash2, Filter, Archive, Download } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function Invoices() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const showDeleted = searchParams.get('view') === 'deleted';

  const [invoices, setInvoices] = useState([]);
  const [deletedCount, setDeletedCount] = useState(0);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState(null);
  
  // Inline creation states
  const [addCustomerDialogOpen, setAddCustomerDialogOpen] = useState(false);
  const [addProductDialogOpen, setAddProductDialogOpen] = useState(false);
  const [productFormKey, setProductFormKey] = useState(0);
  const [addCategoryDialogOpen, setAddCategoryDialogOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCustomerData, setNewCustomerData] = useState({
    name: '', company_name: '', email: '', phone: '', whatsapp: '', city: '', address: '', tin: '',
    bank_name: '', bank_branch: '', bank_account_number: '', bank_account_holder_name: ''
  });
  const [newProductData, setNewProductData] = useState({
    name: '', description: '', price: '', unit: 'pcs', stock_quantity: '', category_id: ''
  });
  
  const [invoiceForm, setInvoiceForm] = useState({
    customer_id: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: getDefaultDueDate(),
    date_of_delivery: new Date().toISOString().split('T')[0],
    place_of_supply: '',
    payment_mode: 'cash',
    notes: '',
    items: [{ product_id: '', product_name: '', description: '', quantity: '', unit_price: '' }]
  });

  // Helper function to get default due date (1 month from today)
  function getDefaultDueDate() {
    const today = new Date();
    const nextMonth = new Date(today.setMonth(today.getMonth() + 1));
    return nextMonth.toISOString().split('T')[0];
  }

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    notes: ''
  });

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setUser(userData);
    fetchInvoices();
    fetchCustomers();
    fetchProducts();
    fetchCategories();
    fetchCompany();
    if (!showDeleted) {
      fetchDeletedCount();
    }
  }, [showDeleted]);

  const fetchInvoices = async () => {
    try {
      const response = await api.get(`/invoices?include_deleted=${showDeleted}`);
      // When viewing deleted, filter to show only deleted items
      const filteredData = showDeleted 
        ? response.data.filter(i => i.deleted === true)
        : response.data;
      setInvoices(filteredData);
    } catch (error) {
      toast.error('Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  const fetchDeletedCount = async () => {
    try {
      const response = await api.get('/invoices?include_deleted=true');
      const deleted = response.data.filter(i => i.deleted === true);
      setDeletedCount(deleted.length);
    } catch (error) {
      console.error('Failed to fetch deleted count');
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customers');
      setCustomers(response.data);
    } catch (error) {
      console.error('Failed to fetch customers');
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to fetch products');
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/product-categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories');
    }
  };

  const fetchCompany = async () => {
    try {
      const response = await api.get('/company/info');
      setCompany(response.data);
    } catch (error) {
      console.error('Failed to fetch company');
    }
  };

  // Inline category creation
  const handleAddNewCategory = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/product-categories', { name: newCategoryName });
      toast.success('Category added successfully', { style: { background: '#10b981', color: 'white' } });
      setAddCategoryDialogOpen(false);
      setNewCategoryName('');
      await fetchCategories();
      // Auto-select the new category
      setNewProductData({ ...newProductData, category_id: response.data.id });
    } catch (error) {
      toast.error('Failed to add category', { style: { background: '#ef4444', color: 'white' } });
    }
  };

  // Inline customer creation
  const handleAddNewCustomer = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/customers', newCustomerData);
      toast.success('Customer added successfully', { style: { background: '#10b981', color: 'white' } });
      setAddCustomerDialogOpen(false);
      setNewCustomerData({ name: '', company_name: '', email: '', phone: '', whatsapp: '', city: '', address: '', tin: '', bank_name: '', bank_branch: '', bank_account_number: '', bank_account_holder_name: '' });
      await fetchCustomers();
      // Auto-select the new customer
      setInvoiceForm({ ...invoiceForm, customer_id: response.data.id });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add customer', { style: { background: '#ef4444', color: 'white' } });
    }
  };

  // Inline product creation
  const handleAddNewProduct = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/products', newProductData);
      toast.success('Product added successfully', { style: { background: '#10b981', color: 'white' } });
      setAddProductDialogOpen(false);
      setNewProductData({ name: '', description: '', price: '', unit: 'pcs', stock_quantity: '', category_id: '' });
      await fetchProducts();
      // Return the new product to be added to the invoice
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add product', { style: { background: '#ef4444', color: 'white' } });
    }
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    try {
      await api.post('/invoices', invoiceForm);
      toast.success('Invoice created successfully', { style: { background: '#10b981', color: 'white' } });
      setCreateDialogOpen(false);
      resetInvoiceForm();
      fetchInvoices();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create invoice', { style: { background: '#ef4444', color: 'white' } });
    }
  };

  const handleEditInvoice = (invoice) => {
    setEditingInvoice(invoice);
    setEditDialogOpen(true);
  };

  const handleUpdateInvoice = async (e) => {
    e.preventDefault();
    try {
      const updateData = {
        date_of_delivery: editingInvoice.date_of_delivery,
        place_of_supply: editingInvoice.place_of_supply,
        payment_mode: editingInvoice.payment_mode,
        total_in_words: editingInvoice.total_in_words
      };
      await api.put(`/invoices/${editingInvoice.id}`, updateData);
      toast.success('Invoice updated successfully', { style: { background: '#10b981', color: 'white' } });
      setEditDialogOpen(false);
      setEditingInvoice(null);
      fetchInvoices();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update invoice', { style: { background: '#ef4444', color: 'white' } });
    }
  };

  const handleViewInvoice = async (invoiceId) => {
    try {
      const response = await api.get(`/invoices/${invoiceId}`);
      setSelectedInvoice(response.data);
      setViewDialogOpen(true);
    } catch (error) {
      toast.error('Failed to load invoice details');
    }
  };

  const handleDownloadInvoicePDF = async () => {
    try {
      const element = document.getElementById('invoice-pdf-content');
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Invoice-${selectedInvoice.invoice_number}.pdf`);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      toast.error('Failed to generate PDF');
    }
  };

  const handleDeleteInvoice = async (invoiceId) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;
    try {
      await api.delete(`/invoices/${invoiceId}`);
      toast.success('Invoice deleted successfully', {
        style: { background: '#10b981', color: 'white' }
      });
      fetchInvoices();
    } catch (error) {
      toast.error('Failed to delete invoice', {
        style: { background: '#ef4444', color: 'white' }
      });
    }
  };

  const handleRestoreInvoice = async (invoiceId) => {
    if (!window.confirm('Are you sure you want to restore this invoice?')) return;
    try {
      await api.put(`/invoices/${invoiceId}/restore`);
      toast.success('Invoice restored successfully', {
        style: { background: '#10b981', color: 'white' }
      });
      setInvoices(invoices.filter(i => i.id !== invoiceId));
      setDeletedCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      toast.error('Failed to restore invoice', {
        style: { background: '#ef4444', color: 'white' }
      });
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/invoices/${selectedInvoice.id}/payments`, {
        ...paymentForm,
        amount: parseFloat(paymentForm.amount)
      });
      toast.success('Payment added successfully', {
        style: { background: '#10b981', color: 'white' }
      });
      setPaymentDialogOpen(false);
      resetPaymentForm();
      fetchInvoices();
      if (viewDialogOpen) {
        handleViewInvoice(selectedInvoice.id);
      }
    } catch (error) {
      toast.error('Failed to add payment');
    }
  };

  const addInvoiceItem = () => {
    setInvoiceForm({
      ...invoiceForm,
      items: [...invoiceForm.items, { product_id: '', product_name: '', description: '', quantity: '', unit_price: '' }]
    });
  };

  const removeInvoiceItem = (index) => {
    const newItems = invoiceForm.items.filter((_, i) => i !== index);
    setInvoiceForm({ ...invoiceForm, items: newItems });
  };

  const updateInvoiceItem = (index, field, value) => {
    const newItems = [...invoiceForm.items];
    newItems[index][field] = value;
    
    if (field === 'product_id' && value) {
      const product = products.find(p => p.id === value);
      if (product) {
        newItems[index].product_name = product.name;
        newItems[index].unit_price = product.price;
      }
    }
    
    setInvoiceForm({ ...invoiceForm, items: newItems });
  };

  const resetInvoiceForm = () => {
    setInvoiceForm({
      customer_id: '',
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: getDefaultDueDate(),
      date_of_delivery: new Date().toISOString().split('T')[0],
      place_of_supply: '',
      payment_mode: 'cash',
      notes: '',
      items: [{ product_id: '', product_name: '', description: '', quantity: '', unit_price: '' }]
    });
  };

  const resetPaymentForm = () => {
    setPaymentForm({
      amount: '',
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'cash',
      notes: ''
    });
  };

  const calculateTotal = (items) => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-700';
      case 'partial': return 'bg-yellow-100 text-yellow-700';
      case 'unpaid': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    const matchesSearch = invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.name || 'Unknown';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Work Sans, sans-serif' }}>
            {showDeleted ? 'Deleted Invoices' : 'Invoices'}
          </h1>
          <div className="flex gap-2">
            {(deletedCount > 0 || showDeleted) && (
              <Button
                variant={showDeleted ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  if (showDeleted) {
                    setSearchParams({});
                  } else {
                    setSearchParams({ view: 'deleted' });
                  }
                }}
                title={showDeleted ? "View Active Invoices" : `View Deleted Invoices (${deletedCount})`}
              >
                <Archive className="w-4 h-4" />
              </Button>
            )}
            {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'accountant') && (
              <Button onClick={() => setCreateDialogOpen(true)} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create Invoice
              </Button>
            )}
          </div>
        </div>

        {invoices.length >= 5 && (
          <div className="flex gap-4">
            <Input
              placeholder="Search by invoice number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          {filteredInvoices.map((invoice) => (
            <Card key={invoice.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <h3 className="font-bold text-lg">{invoice.invoice_number}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(invoice.status)}`}>
                        {invoice.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Customer</p>
                        <p className="font-semibold">{getCustomerName(invoice.customer_id)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Date</p>
                        <p className="font-semibold">{invoice.invoice_date}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Total</p>
                        <p className="font-semibold text-green-600">Rs {invoice.total.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Balance</p>
                        <p className="font-semibold text-red-600">Rs {(invoice.total - invoice.amount_paid).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {showDeleted ? (
                      <>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleRestoreInvoice(invoice.id)}
                        >
                          Restore
                        </Button>
                        <div className="text-xs text-gray-500 flex flex-col items-end">
                          <span>Deleted: {invoice.deleted_at ? new Date(invoice.deleted_at).toLocaleDateString() : ''}</span>
                          {invoice.deleted_by && <span>By: {invoice.deleted_by}</span>}
                        </div>
                      </>
                    ) : (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleViewInvoice(invoice.id)}>
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'accountant') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditInvoice(invoice)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        )}
                        {invoice.status !== 'paid' && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedInvoice(invoice);
                              setPaymentForm({ ...paymentForm, amount: (invoice.total - invoice.amount_paid).toString() });
                              setPaymentDialogOpen(true);
                            }}
                          >
                            Add Payment
                          </Button>
                        )}
                        {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'accountant') && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteInvoice(invoice.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredInvoices.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center text-gray-500">
              {searchTerm || statusFilter !== 'all' ? 'No invoices found matching your filters' : 'No invoices yet. Click "Create Invoice" to get started.'}
            </CardContent>
          </Card>
        )}

        {/* Create Invoice Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) resetInvoiceForm();
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Invoice</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-12">
                  <Select 
                    value={invoiceForm.customer_id} 
                    onValueChange={(value) => {
                      if (value === 'add_new') {
                        setAddCustomerDialogOpen(true);
                      } else {
                        setInvoiceForm({ ...invoiceForm, customer_id: value });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Customer *" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="add_new" className="text-blue-600 font-semibold">
                        + Add New Customer
                      </SelectItem>
                      {customers.map(customer => (
                        <SelectItem key={customer.id} value={customer.id}>{customer.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-6">
                  <label className="block text-xs font-medium mb-1">Invoice Date *</label>
                  <Input
                    type="date"
                    value={invoiceForm.invoice_date}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, invoice_date: e.target.value })}
                    required
                  />
                </div>
                <div className="col-span-6">
                  <label className="block text-xs font-medium mb-1">Due Date</label>
                  <Input
                    type="date"
                    value={invoiceForm.due_date}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-6">
                  <label className="block text-xs font-medium mb-1">Date of Delivery *</label>
                  <Input
                    type="date"
                    value={invoiceForm.date_of_delivery}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, date_of_delivery: e.target.value })}
                    required
                  />
                </div>
                <div className="col-span-6">
                  <label className="block text-xs font-medium mb-1">Place of Supply *</label>
                  <Input
                    value={invoiceForm.place_of_supply}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, place_of_supply: e.target.value })}
                    placeholder="e.g., Colombo"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-6">
                  <label className="block text-xs font-medium mb-1">Payment Mode *</label>
                  <Select
                    value={invoiceForm.payment_mode}
                    onValueChange={(value) => setInvoiceForm({ ...invoiceForm, payment_mode: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="credit">Credit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Invoice Items</h3>
                  <Button type="button" size="sm" onClick={addInvoiceItem}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Item
                  </Button>
                </div>

                {invoiceForm.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 mb-3 items-center">
                    <div className="col-span-3">
                      <Select
                        value={item.product_id || "custom"}
                        onValueChange={(value) => {
                          if (value === "add_new") {
                            setAddProductDialogOpen(true);
                          } else {
                            updateInvoiceItem(index, 'product_id', value === "custom" ? "" : value);
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Product" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="add_new" className="text-blue-600 font-semibold">
                            + Add New Product
                          </SelectItem>
                          <SelectItem value="custom">Custom Item</SelectItem>
                          {products.map(product => (
                            <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-3">
                      <Input
                        value={item.product_name}
                        onChange={(e) => updateInvoiceItem(index, 'product_name', e.target.value)}
                        placeholder="Name *"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        step="0.01"
                        value={item.quantity === '' ? undefined : item.quantity}
                        onChange={(e) => updateInvoiceItem(index, 'quantity', e.target.value)}
                        placeholder="Qty *"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        step="0.01"
                        value={item.unit_price === '' ? undefined : item.unit_price}
                        onChange={(e) => updateInvoiceItem(index, 'unit_price', e.target.value)}
                        placeholder="Price *"
                        required
                      />
                    </div>
                    <div className="col-span-1">
                      <p className="text-sm font-semibold text-center">Rs {((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0)).toFixed(2)}</p>
                    </div>
                    <div className="col-span-1">
                      {invoiceForm.items.length > 1 && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="text-red-600"
                          onClick={() => removeInvoiceItem(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-end">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Subtotal</p>
                      <p className="text-2xl font-bold text-green-600">Rs {calculateTotal(invoiceForm.items).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <Textarea
                  value={invoiceForm.notes}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Invoice</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Invoice Dialog */}
        {selectedInvoice && (
          <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle>Invoice Details</DialogTitle>
                  <Button
                    size="sm"
                    onClick={handleDownloadInvoicePDF}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </Button>
                </div>
              </DialogHeader>
              <div id="invoice-pdf-content" className="space-y-4 p-4 bg-white">
                {/* Title */}
                <div className="text-center border-b-2 pb-2 mb-4">
                  <h1 className="text-3xl font-bold">TAX INVOICE</h1>
                </div>

                {/* Supplier and Purchaser Details */}
                <div className="grid grid-cols-2 gap-6 mb-4">
                  {/* Supplier (Company) - Left */}
                  <div className="border-2 p-4 rounded bg-blue-50">
                    <div className="text-sm space-y-2">
                      <div>
                        <span className="font-bold text-xs text-gray-700">Supplier's TIN:</span>
                        <p className="text-sm">{company?.tin || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="font-bold text-xs text-gray-700">Supplier's Name:</span>
                        <p className="text-sm font-semibold">{company?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="font-bold text-xs text-gray-700">Address:</span>
                        <p className="text-sm">{company?.invoice_address || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="font-bold text-xs text-gray-700">Telephone No:</span>
                        <p className="text-sm">{company?.invoice_mobile || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Purchaser (Customer) - Right */}
                  <div className="border-2 p-4 rounded bg-green-50">
                    <div className="text-sm space-y-2">
                      <div>
                        <span className="font-bold text-xs text-gray-700">Purchaser's TIN:</span>
                        <p className="text-sm">{selectedInvoice.customer?.tin || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="font-bold text-xs text-gray-700">Purchaser's Name:</span>
                        <p className="text-sm font-semibold">{selectedInvoice.customer?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="font-bold text-xs text-gray-700">Address:</span>
                        <p className="text-sm">{selectedInvoice.customer?.address || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="font-bold text-xs text-gray-700">Telephone No:</span>
                        <p className="text-sm">{selectedInvoice.customer?.phone || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Invoice Details */}
                <div className="grid grid-cols-3 gap-4 border p-3 rounded bg-gray-50 mb-4">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Invoice Number</p>
                    <p className="font-bold">{selectedInvoice.invoice_number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Date of Invoice</p>
                    <p className="font-semibold">{selectedInvoice.invoice_date}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Date of Delivery</p>
                    <p className="font-semibold">{selectedInvoice.date_of_delivery || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Place of Supply</p>
                    <p className="font-semibold">{selectedInvoice.place_of_supply || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Payment Mode</p>
                    <p className="font-semibold capitalize">{selectedInvoice.payment_mode?.replace('_', ' ') || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Status</p>
                    <div>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getStatusColor(selectedInvoice.status)}`}>
                        {selectedInvoice.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3 text-sm">DESCRIPTION OF GOODS / SERVICES</h3>
                  <table className="w-full border">
                    <thead className="bg-gray-100 border-b-2">
                      <tr>
                        <th className="text-left p-2 text-sm border-r">Description</th>
                        <th className="text-right p-2 text-sm border-r">Quantity</th>
                        <th className="text-right p-2 text-sm border-r">Unit Price (Rs)</th>
                        <th className="text-right p-2 text-sm">Value (Rs)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.items.map((item, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2 border-r">{item.product_name}</td>
                          <td className="text-right p-2 border-r">{item.quantity}</td>
                          <td className="text-right p-2 border-r">{item.unit_price.toLocaleString()}</td>
                          <td className="text-right p-2">{item.total.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr className="border-t-2">
                        <td colSpan="3" className="text-right p-2 font-semibold border-r">Value of Supply (Net - Excluding VAT)</td>
                        <td className="text-right p-2 font-semibold">Rs {(selectedInvoice.subtotal || 0).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td colSpan="3" className="text-right p-2 border-r">VAT Charged ({selectedInvoice.vat_rate || 18}%)</td>
                        <td className="text-right p-2">Rs {(selectedInvoice.vat_amount || 0).toLocaleString()}</td>
                      </tr>
                      <tr className="font-bold border-t-2 bg-gray-200">
                        <td colSpan="3" className="text-right p-2 border-r">TOTAL (Including VAT)</td>
                        <td className="text-right p-2 text-lg">Rs {selectedInvoice.total.toLocaleString()}</td>
                      </tr>
                      {selectedInvoice.total_in_words && (
                        <tr>
                          <td colSpan="4" className="text-left p-2 italic text-sm">
                            <span className="font-semibold">Amount in Words:</span> {selectedInvoice.total_in_words}
                          </td>
                        </tr>
                      )}
                      <tr className="border-t">
                        <td colSpan="3" className="text-right p-2 border-r">Amount Paid</td>
                        <td className="text-right p-2">Rs {selectedInvoice.amount_paid.toLocaleString()}</td>
                      </tr>
                      <tr className="font-bold">
                        <td colSpan="3" className="text-right p-2 border-r">Balance Due</td>
                        <td className="text-right p-2 text-red-600">Rs {(selectedInvoice.total - selectedInvoice.amount_paid).toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {selectedInvoice.payments && selectedInvoice.payments.length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-2">Payment History</h3>
                    <div className="space-y-2">
                      {selectedInvoice.payments.map((payment, index) => (
                        <div key={index} className="flex justify-between p-3 bg-gray-50 rounded">
                          <div>
                            <p className="font-semibold">Rs {payment.amount.toFixed(2)}</p>
                            <p className="text-sm text-gray-600">{payment.payment_method} - {payment.payment_date}</p>
                          </div>
                          {payment.notes && <p className="text-sm text-gray-600">{payment.notes}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer Note - Gazette Requirement */}
                <div className="border-t pt-4 mt-4">
                  <p className="text-xs text-gray-600 text-center italic">
                    This invoice must be retained for a period of five years as per VAT regulations.
                  </p>
                  {company?.name && (
                    <p className="text-xs text-gray-500 text-center mt-2">
                      Generated by {company.name}
                    </p>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Add Payment Dialog */}
        {selectedInvoice && (
          <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Payment - {selectedInvoice.invoice_number}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddPayment} className="space-y-4">
                <div>
                  <Input
                    type="number"
                    step="0.01"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    placeholder="Amount (Rs) *"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Outstanding: Rs {(selectedInvoice.total - selectedInvoice.amount_paid).toFixed(2)}</p>
                </div>
                <div>
                  <Input
                    type="date"
                    value={paymentForm.payment_date}
                    onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                    placeholder="Payment Date *"
                    required
                  />
                </div>
                <div>
                  <Select value={paymentForm.payment_method} onValueChange={(value) => setPaymentForm({ ...paymentForm, payment_method: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Payment Method *" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Textarea
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                    placeholder="Payment Notes (Optional)"
                    rows={2}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setPaymentDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Add Payment</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}

        {/* Add Customer Dialog (Inline) */}
        <Dialog open={addCustomerDialogOpen} onOpenChange={setAddCustomerDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddNewCustomer} className="space-y-4">
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-6">
                  <label className="block text-sm font-medium mb-1">Customer Name *</label>
                  <Input
                    value={newCustomerData.name}
                    onChange={(e) => setNewCustomerData({ ...newCustomerData, name: e.target.value })}
                    placeholder="Enter customer name"
                    required
                  />
                </div>
                <div className="col-span-6">
                  <label className="block text-sm font-medium mb-1">Company Name</label>
                  <Input
                    value={newCustomerData.company_name}
                    onChange={(e) => setNewCustomerData({ ...newCustomerData, company_name: e.target.value })}
                    placeholder="Enter company name"
                  />
                </div>
              </div>
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-6">
                  <label className="block text-sm font-medium mb-1">TIN (Tax ID)</label>
                  <Input
                    value={newCustomerData.tin}
                    onChange={(e) => setNewCustomerData({ ...newCustomerData, tin: e.target.value })}
                    placeholder="Tax Identification Number"
                  />
                </div>
                <div className="col-span-6">
                  <label className="block text-sm font-medium mb-1">City</label>
                  <Input
                    value={newCustomerData.city}
                    onChange={(e) => setNewCustomerData({ ...newCustomerData, city: e.target.value })}
                    placeholder="Enter city"
                  />
                </div>
              </div>
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-6">
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <Input
                    value={newCustomerData.phone}
                    onChange={(e) => setNewCustomerData({ ...newCustomerData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    placeholder="10-digit phone"
                    maxLength={10}
                  />
                </div>
                <div className="col-span-6">
                  <label className="block text-sm font-medium mb-1">WhatsApp</label>
                  <Input
                    value={newCustomerData.whatsapp}
                    onChange={(e) => setNewCustomerData({ ...newCustomerData, whatsapp: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    placeholder="10-digit WhatsApp"
                    maxLength={10}
                  />
                </div>
              </div>
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-12">
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <Input
                    type="email"
                    value={newCustomerData.email}
                    onChange={(e) => setNewCustomerData({ ...newCustomerData, email: e.target.value })}
                    placeholder="customer@example.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <Textarea
                  value={newCustomerData.address}
                  onChange={(e) => setNewCustomerData({ ...newCustomerData, address: e.target.value })}
                  placeholder="Enter full address"
                  rows={2}
                />
              </div>

              {/* Bank Details Section */}
              <div className="border-t pt-4 mt-2">
                <h3 className="text-sm font-semibold mb-3 text-gray-700">Bank Details (Optional)</h3>
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-6">
                    <label className="block text-sm font-medium mb-1">Bank Name</label>
                    <Input
                      value={newCustomerData.bank_name}
                      onChange={(e) => setNewCustomerData({ ...newCustomerData, bank_name: e.target.value })}
                      placeholder="Enter bank name"
                    />
                  </div>
                  <div className="col-span-6">
                    <label className="block text-sm font-medium mb-1">Branch</label>
                    <Input
                      value={newCustomerData.bank_branch}
                      onChange={(e) => setNewCustomerData({ ...newCustomerData, bank_branch: e.target.value })}
                      placeholder="Enter branch"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-12 gap-4 mt-4">
                  <div className="col-span-6">
                    <label className="block text-sm font-medium mb-1">Account Number</label>
                    <Input
                      value={newCustomerData.bank_account_number}
                      onChange={(e) => setNewCustomerData({ ...newCustomerData, bank_account_number: e.target.value.replace(/\D/g, '') })}
                      placeholder="Enter account number"
                    />
                  </div>
                  <div className="col-span-6">
                    <label className="block text-sm font-medium mb-1">Account Holder Name</label>
                    <Input
                      value={newCustomerData.bank_account_holder_name}
                      onChange={(e) => setNewCustomerData({ ...newCustomerData, bank_account_holder_name: e.target.value })}
                      placeholder="Enter account holder name"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setAddCustomerDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Add Customer</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Add Product Dialog (Inline) */}
        <Dialog open={addProductDialogOpen} onOpenChange={(open) => {
          setAddProductDialogOpen(open);
          if (!open) {
            // Reset form when closing
            setNewProductData({ name: '', description: '', price: '', unit: 'pcs', stock_quantity: '', category_id: '' });
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddNewProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Product Name *</label>
                <Input
                  value={newProductData.name}
                  onChange={(e) => setNewProductData({ ...newProductData, name: e.target.value })}
                  placeholder="Enter product name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <Select 
                  value={newProductData.category_id || "none"} 
                  onValueChange={(value) => {
                    if (value === 'add_new') {
                      setAddCategoryDialogOpen(true);
                    } else {
                      setNewProductData({ ...newProductData, category_id: value === "none" ? "" : value });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add_new" className="text-blue-600 font-semibold">
                      + Add New Category
                    </SelectItem>
                    <SelectItem value="none">None</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Textarea
                  value={newProductData.description}
                  onChange={(e) => setNewProductData({ ...newProductData, description: e.target.value })}
                  placeholder="Enter product description"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Price (Rs) *</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newProductData.price}
                    onChange={(e) => setNewProductData({ ...newProductData, price: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Unit *</label>
                  <Select value={newProductData.unit} onValueChange={(value) => setNewProductData({ ...newProductData, unit: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pcs">Pieces</SelectItem>
                      <SelectItem value="kg">Kilograms</SelectItem>
                      <SelectItem value="hrs">Hours</SelectItem>
                      <SelectItem value="box">Box</SelectItem>
                      <SelectItem value="set">Set</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Stock *</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newProductData.stock_quantity === '' ? undefined : newProductData.stock_quantity}
                    onChange={(e) => setNewProductData({ ...newProductData, stock_quantity: e.target.value })}
                    placeholder="Enter stock quantity"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setAddProductDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Add Product</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Add Category Dialog (Inline) */}
        <Dialog open={addCategoryDialogOpen} onOpenChange={setAddCategoryDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Category</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddNewCategory} className="space-y-4">
              <div>
                <Input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Category Name *"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setAddCategoryDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Add Category</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Invoice Dialog */}
        {editingInvoice && (
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Invoice - {editingInvoice.invoice_number}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUpdateInvoice} className="space-y-4">
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-6">
                    <label className="block text-xs font-medium mb-1">Date of Delivery *</label>
                    <Input
                      type="date"
                      value={editingInvoice.date_of_delivery || ''}
                      onChange={(e) => setEditingInvoice({ ...editingInvoice, date_of_delivery: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-span-6">
                    <label className="block text-xs font-medium mb-1">Place of Supply *</label>
                    <Input
                      value={editingInvoice.place_of_supply || ''}
                      onChange={(e) => setEditingInvoice({ ...editingInvoice, place_of_supply: e.target.value })}
                      placeholder="e.g., Colombo"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-6">
                    <label className="block text-xs font-medium mb-1">Payment Mode *</label>
                    <Select
                      value={editingInvoice.payment_mode || 'cash'}
                      onValueChange={(value) => setEditingInvoice({ ...editingInvoice, payment_mode: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="credit">Credit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-6">
                    <label className="block text-xs font-medium mb-1">Total in Words</label>
                    <Input
                      value={editingInvoice.total_in_words || ''}
                      onChange={(e) => setEditingInvoice({ ...editingInvoice, total_in_words: e.target.value })}
                      placeholder="e.g., Five Thousand Rupees Only"
                    />
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <p className="text-sm text-gray-600 mb-2">Invoice Summary:</p>
                  <div className="grid grid-cols-3 gap-4 bg-gray-50 p-3 rounded">
                    <div>
                      <p className="text-xs text-gray-600">Subtotal (Net)</p>
                      <p className="font-semibold">Rs {(editingInvoice.subtotal || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">VAT ({editingInvoice.vat_rate || 18}%)</p>
                      <p className="font-semibold">Rs {(editingInvoice.vat_amount || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Total (Inc. VAT)</p>
                      <p className="font-semibold text-green-600">Rs {(editingInvoice.total || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    Update Invoice
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </Layout>
  );
}
