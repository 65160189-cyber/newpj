import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { dashboardService } from '../services/dashboardService';
import { 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Users, 
  Boxes,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const DashboardFixed = () => {
  const [stats, setStats] = useState({});
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { connected } = useSocket();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, ordersRes, lowStockRes, chartRes] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getRecentOrders(),
        dashboardService.getLowStockItems(),
        dashboardService.getOrderStatusChart()
      ]);

      setStats(statsRes.data);
      setRecentOrders(ordersRes.data);
      setLowStockItems(lowStockRes.data);
      setChartData(chartRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'คำสั่งซื้อทั้งหมด',
      value: stats.totalOrders || 0,
      icon: Package,
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600',
      borderColor: 'border-l-blue-500',
      change: '+12%'
    },
    {
      title: 'รอดำเนินการ',
      value: stats.pendingOrders || 0,
      icon: Clock,
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-600',
      borderColor: 'border-l-yellow-500',
      change: '+5%'
    },
    {
      title: 'กำลังดำเนินการ',
      value: stats.inProgressOrders || 0,
      icon: TrendingUp,
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600',
      borderColor: 'border-l-blue-500',
      change: '+8%'
    },
    {
      title: 'เสร็จสิ้น',
      value: stats.completedOrders || 0,
      icon: CheckCircle,
      bgColor: 'bg-green-100',
      textColor: 'text-green-600',
      borderColor: 'border-l-green-500',
      change: '+15%'
    },
    {
      title: 'สินค้าในคลัง',
      value: stats.totalInventoryItems || 0,
      icon: Boxes,
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600',
      borderColor: 'border-l-blue-500',
      change: '+3%'
    },
    {
      title: 'สินค้าใกล้หมด',
      value: stats.lowStockItems || 0,
      icon: AlertTriangle,
      bgColor: 'bg-red-100',
      textColor: 'text-red-600',
      borderColor: 'border-l-red-500',
      change: '-2%'
    }
  ];

  const COLORS = {
    pending: '#f59e0b',
    in_progress: '#3b82f6',
    completed: '#22c55e',
    cancelled: '#ef4444'
  };

  const statusLabels = {
    pending: 'รอดำเนินการ',
    in_progress: 'กำลังดำเนินการ',
    completed: 'เสร็จสิ้น',
    cancelled: 'ยกเลิก'
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
        <h1 className="text-2xl font-bold text-gray-900">แดชบอร์ด</h1>
        <p className="text-gray-600">ภาพรวมการทำงานของโรงงาน</p>
        {connected && (
          <div className="mt-2 inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
            เชื่อมต่อแบบ Real-time
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className={`stat-card ${card.borderColor}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{card.change}</p>
                </div>
                <div className={`p-3 rounded-full ${card.bgColor}`}>
                  <Icon className={`w-6 h-6 ${card.textColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">สถานะคำสั่งซื้อ</h2>
            <BarChart3 className="w-5 h-5 text-gray-500" />
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${statusLabels[entry.status]}: ${entry.count}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.status]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">สินค้าใกล้หมด</h2>
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div className="space-y-3">
            {lowStockItems.length === 0 ? (
              <p className="text-gray-500 text-center py-4">ไม่มีสินค้าใกล้หมด</p>
            ) : (
              lowStockItems.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-600">{item.quantity} {item.unit}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-red-600">ขั้นต่ำ: {item.min_stock_level}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">คำสั่งซื้อล่าสุด</h2>
          <Package className="w-5 h-5 text-gray-500" />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  เลขที่คำสั่งซื้อ
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ลูกค้า
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  สินค้า
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  จำนวน
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  สถานะ
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ผู้รับผิดชอบ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {order.order_number}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {order.customer_name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {order.product_name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {order.quantity}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`status-${order.status}`}>
                      {statusLabels[order.status] || order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {order.assigned_name || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {recentOrders.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              ไม่มีคำสั่งซื้อในขณะนี้
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardFixed;
