import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { orderService } from '../services/orderService';
import { Plus, Search, Filter, Eye, Edit, Trash2, Upload, FileSpreadsheet } from 'lucide-react';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [orderHistory, setOrderHistory] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const fileInputRef = useRef(null);
  const { socket } = useSocket();

  const [formData, setFormData] = useState({
    orderNumber: '',
    customerName: '',
    productName: '',
    quantity: '',
    priority: 'medium'
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('order-updated', handleOrderUpdate);
      return () => {
        socket.off('order-updated', handleOrderUpdate);
      };
    }
  }, [socket]);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter]);

  const handleOrderUpdate = (data) => {
    fetchOrders();
  };

  const fetchOrders = async () => {
    try {
      const response = await orderService.getAllOrders();
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.product_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    try {
      await orderService.createOrder(formData);
      setShowCreateModal(false);
      setFormData({
        orderNumber: '',
        customerName: '',
        productName: '',
        quantity: '',
        priority: 'medium'
      });
      fetchOrders();
    } catch (error) {
      console.error('Failed to create order:', error);
    }
  };

  const handleUpdateOrder = async (e) => {
    e.preventDefault();
    try {
      await orderService.updateOrder(selectedOrder.id, {
        status: selectedOrder.status,
        assignedTo: selectedOrder.assigned_to
      });
      setShowEditModal(false);
      fetchOrders();
    } catch (error) {
      console.error('Failed to update order:', error);
    }
  };

  const handleViewHistory = async (orderId) => {
    try {
      const response = await orderService.getOrderHistory(orderId);
      setOrderHistory(response.data);
      setShowHistoryModal(true);
    } catch (error) {
      console.error('Failed to fetch order history:', error);
    }
  };

  const handleEditOrder = (order) => {
    setSelectedOrder(order);
    setShowEditModal(true);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: 'status-pending',
      'in_progress': 'status-in-progress',
      completed: 'status-completed',
      cancelled: 'status-cancelled'
    };
    return statusMap[status] || 'status-pending';
  };

  const getPriorityBadge = (priority) => {
    const priorityMap = {
      high: 'priority-high',
      medium: 'priority-medium',
      low: 'priority-low'
    };
    return priorityMap[priority] || 'priority-medium';
  };

  const statusLabels = {
    pending: 'รอดำเนินการ',
    in_progress: 'กำลังดำเนินการ',
    completed: 'เสร็จสิ้น',
    cancelled: 'ยกเลิก'
  };

  const priorityLabels = {
    high: 'สูง',
    medium: 'ปานกลาง',
    low: 'ต่ำ'
  };

  const handleFileImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImporting(true);
    setImportProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await orderService.importOrders(formData);
      
      if (response.data.success) {
        alert(`นำเข้าข้อมูลสำเร็จ! ${response.data.imported} รายการ`);
        fetchOrders();
      } else {
        alert('นำเข้าข้อมูลล้มเหลว: ' + response.data.message);
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('นำเข้าข้อมูลล้มเหลว');
    } finally {
      setImporting(false);
      setImportProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const downloadTemplate = () => {
    const template = [
      ['KanbanID', 'Customer', 'Sale Part', 'Order No1', 'Delivery Date', 'Qty'],
      ['KB001', 'บริษัท A', 'สินค้า X', 'ORD001', '2024-01-15', '100'],
      ['KB002', 'บริษัท B', 'สินค้า Y', 'ORD002', '2024-01-20', '50']
    ];
    
    const csvContent = template.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'order_template_sheet3.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">กำลังโหลดข้อมูล...</div>
      </div>
    );
  }

  return (
    <div className="tablet-responsive">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">จัดการคำสั่งซื้อ</h1>
        <p className="text-gray-600">จัดการและติดตามคำสั่งซื้อทั้งหมด</p>
      </div>

      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="ค้นหาคำสั่งซื้อ..."
                className="input-field pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="input-field max-w-xs"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">ทุกสถานะ</option>
              <option value="pending">รอดำเนินการ</option>
              <option value="in_progress">กำลังดำเนินการ</option>
              <option value="completed">เสร็จสิ้น</option>
              <option value="cancelled">ยกเลิก</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={downloadTemplate}
              className="btn-secondary flex items-center"
              title="ดาวน์โหลดเทมเพลต"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              เทมเพลต
            </button>
            <button
              onClick={handleImportClick}
              disabled={importing}
              className="btn-success flex items-center"
              title="นำเข้าไฟล์ Excel/CSV"
            >
              <Upload className="w-4 h-4 mr-2" />
              {importing ? 'กำลังนำเข้า...' : 'นำเข้า'}
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              สร้างคำสั่งซื้อ
            </button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileImport}
          className="hidden"
        />

        {importing && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">กำลังนำเข้าข้อมูล...</span>
              <span className="text-sm text-gray-600">{importProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${importProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>เลขที่คำสั่งซื้อ</th>
                <th>ลูกค้า</th>
                <th>สินค้า</th>
                <th>จำนวน</th>
                <th>สถานะ</th>
                <th>ความสำคัญ</th>
                <th>ผู้รับผิดชอบ</th>
                <th>วันที่สร้าง</th>
                <th>การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td className="font-medium">{order.order_number}</td>
                  <td>{order.customer_name}</td>
                  <td>{order.product_name}</td>
                  <td>{order.quantity}</td>
                  <td>
                    <span className={getStatusBadge(order.status)}>
                      {statusLabels[order.status] || order.status}
                    </span>
                  </td>
                  <td>
                    <span className={getPriorityBadge(order.priority)}>
                      {priorityLabels[order.priority] || order.priority}
                    </span>
                  </td>
                  <td>{order.assigned_name || '-'}</td>
                  <td>{new Date(order.created_at).toLocaleDateString('th-TH')}</td>
                  <td>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewHistory(order.id)}
                        className="text-blue-600 hover:text-blue-800"
                        title="ดูประวัติ"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditOrder(order)}
                        className="text-green-600 hover:text-green-800"
                        title="แก้ไข"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredOrders.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              ไม่พบคำสั่งซื้อที่ตรงกับเงื่อนไข
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">สร้างคำสั่งซื้อใหม่</h2>
            <form onSubmit={handleCreateOrder}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    เลขที่คำสั่งซื้อ
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={formData.orderNumber}
                    onChange={(e) => setFormData({...formData, orderNumber: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่อลูกค้า
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={formData.customerName}
                    onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่อสินค้า
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={formData.productName}
                    onChange={(e) => setFormData({...formData, productName: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    จำนวน
                  </label>
                  <input
                    type="number"
                    required
                    className="input-field"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ความสำคัญ
                  </label>
                  <select
                    className="input-field"
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  >
                    <option value="low">ต่ำ</option>
                    <option value="medium">ปานกลาง</option>
                    <option value="high">สูง</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary"
                >
                  ยกเลิก
                </button>
                <button type="submit" className="btn-primary">
                  สร้างคำสั่งซื้อ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">แก้ไขคำสั่งซื้อ</h2>
            <form onSubmit={handleUpdateOrder}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    สถานะ
                  </label>
                  <select
                    className="input-field"
                    value={selectedOrder.status}
                    onChange={(e) => setSelectedOrder({...selectedOrder, status: e.target.value})}
                  >
                    <option value="pending">รอดำเนินการ</option>
                    <option value="in_progress">กำลังดำเนินการ</option>
                    <option value="completed">เสร็จสิ้น</option>
                    <option value="cancelled">ยกเลิก</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="btn-secondary"
                >
                  ยกเลิก
                </button>
                <button type="submit" className="btn-primary">
                  บันทึกการแก้ไข
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-96 overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">ประวัติการเปลี่ยนแปลง</h2>
            <div className="space-y-3">
              {orderHistory.map((history) => (
                <div key={history.id} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{statusLabels[history.status] || history.status}</p>
                      <p className="text-sm text-gray-600">{history.notes}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">{history.changed_by_name}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(history.created_at).toLocaleString('th-TH')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="btn-secondary"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
