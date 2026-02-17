import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { inventoryService } from '../services/inventoryService';
import { Plus, Search, Edit, Trash2, AlertTriangle, Package } from 'lucide-react';

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const { socket } = useSocket();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    quantity: '',
    unit: 'pieces',
    minStockLevel: '10'
  });

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('inventory-updated', handleInventoryUpdate);
      return () => {
        socket.off('inventory-updated', handleInventoryUpdate);
      };
    }
  }, [socket]);

  useEffect(() => {
    filterItems();
  }, [items, searchTerm]);

  const handleInventoryUpdate = (data) => {
    fetchItems();
  };

  const fetchItems = async () => {
    try {
      const response = await inventoryService.getAllItems();
      setItems(response.data);
    } catch (error) {
      console.error('Failed to fetch inventory items:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = items;

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredItems(filtered);
  };

  const handleCreateItem = async (e) => {
    e.preventDefault();
    try {
      await inventoryService.createItem(formData);
      setShowCreateModal(false);
      setFormData({
        name: '',
        description: '',
        quantity: '',
        unit: 'pieces',
        minStockLevel: '10'
      });
      fetchItems();
    } catch (error) {
      console.error('Failed to create inventory item:', error);
    }
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    try {
      await inventoryService.updateItem(selectedItem.id, formData);
      setShowEditModal(false);
      fetchItems();
    } catch (error) {
      console.error('Failed to update inventory item:', error);
    }
  };

  const handleDeleteItem = async (id) => {
    if (window.confirm('คุณแน่ใจว่าต้องการลบรายการนี้?')) {
      try {
        await inventoryService.deleteItem(id);
        fetchItems();
      } catch (error) {
        console.error('Failed to delete inventory item:', error);
      }
    }
  };

  const handleEditItem = (item) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      quantity: item.quantity,
      unit: item.unit,
      minStockLevel: item.min_stock_level
    });
    setShowEditModal(true);
  };

  const getStockStatus = (item) => {
    if (item.quantity <= item.min_stock_level) {
      return {
        status: 'low',
        badge: 'bg-red-100 text-red-800',
        icon: AlertTriangle,
        text: 'ใกล้หมด'
      };
    }
    if (item.quantity <= item.min_stock_level * 1.5) {
      return {
        status: 'medium',
        badge: 'bg-yellow-100 text-yellow-800',
        icon: Package,
        text: 'ปกติ'
      };
    }
    return {
      status: 'high',
      badge: 'bg-green-100 text-green-800',
      icon: Package,
      text: 'เพียงพอ'
    };
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
        <h1 className="text-2xl font-bold text-gray-900">จัดการสินค้าคงคลัง</h1>
        <p className="text-gray-600">จัดการและติดตามสินค้าคงคลังทั้งหมด</p>
      </div>

      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="ค้นหาสินค้า..."
              className="input-field pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            เพิ่มสินค้า
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
          {filteredItems.map((item) => {
            const stockStatus = getStockStatus(item);
            const StatusIcon = stockStatus.icon;
            
            return (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    {item.description && (
                      <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                    )}
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${stockStatus.badge}`}>
                    <StatusIcon className="w-3 h-3 inline mr-1" />
                    {stockStatus.text}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">จำนวนคงเหลือ:</span>
                    <span className="font-medium text-lg">{item.quantity}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">หน่วย:</span>
                    <span className="text-sm">{item.unit}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">ขั้นต่ำ:</span>
                    <span className="text-sm">{item.min_stock_level}</span>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2 mt-4 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => handleEditItem(item)}
                    className="text-blue-600 hover:text-blue-800 p-1"
                    title="แก้ไข"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="text-red-600 hover:text-red-800 p-1"
                    title="ลบ"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? 'ไม่พบสินค้าที่ตรงกับเงื่อนไข' : 'ไม่มีสินค้าในคลังในขณะนี้'}
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">เพิ่มสินค้าใหม่</h2>
            <form onSubmit={handleCreateItem}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่อสินค้า *
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    รายละเอียด
                  </label>
                  <textarea
                    className="input-field"
                    rows="3"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    จำนวน *
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
                    หน่วย *
                  </label>
                  <select
                    className="input-field"
                    value={formData.unit}
                    onChange={(e) => setFormData({...formData, unit: e.target.value})}
                  >
                    <option value="pieces">ชิ้น</option>
                    <option value="kg">กิโลกรัม</option>
                    <option value="liter">ลิตร</option>
                    <option value="meter">เมตร</option>
                    <option value="box">กล่อง</option>
                    <option value="set">ชุด</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ระดับสต็อกขั้นต่ำ *
                  </label>
                  <input
                    type="number"
                    required
                    className="input-field"
                    value={formData.minStockLevel}
                    onChange={(e) => setFormData({...formData, minStockLevel: e.target.value})}
                  />
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
                  เพิ่มสินค้า
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">แก้ไขสินค้า</h2>
            <form onSubmit={handleUpdateItem}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่อสินค้า *
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    รายละเอียด
                  </label>
                  <textarea
                    className="input-field"
                    rows="3"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    จำนวน *
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
                    หน่วย *
                  </label>
                  <select
                    className="input-field"
                    value={formData.unit}
                    onChange={(e) => setFormData({...formData, unit: e.target.value})}
                  >
                    <option value="pieces">ชิ้น</option>
                    <option value="kg">กิโลกรัม</option>
                    <option value="liter">ลิตร</option>
                    <option value="meter">เมตร</option>
                    <option value="box">กล่อง</option>
                    <option value="set">ชุด</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ระดับสต็อกขั้นต่ำ *
                  </label>
                  <input
                    type="number"
                    required
                    className="input-field"
                    value={formData.minStockLevel}
                    onChange={(e) => setFormData({...formData, minStockLevel: e.target.value})}
                  />
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
    </div>
  );
};

export default Inventory;
