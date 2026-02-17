const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getDatabase } = require('../database/init');

const router = express.Router();

router.get('/stats', authenticateToken, (req, res) => {
  const db = getDatabase();
  
  const stats = {};
  
  db.get('SELECT COUNT(*) as total FROM orders', [], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch order stats' });
    }
    stats.totalOrders = row.total;
  });
  
  db.get('SELECT COUNT(*) as pending FROM orders WHERE status = "pending"', [], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch pending orders' });
    }
    stats.pendingOrders = row.pending;
  });
  
  db.get('SELECT COUNT(*) as inProgress FROM orders WHERE status = "in_progress"', [], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch in-progress orders' });
    }
    stats.inProgressOrders = row.inProgress;
  });
  
  db.get('SELECT COUNT(*) as completed FROM orders WHERE status = "completed"', [], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch completed orders' });
    }
    stats.completedOrders = row.completed;
  });
  
  db.get('SELECT COUNT(*) as total FROM inventory', [], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch inventory stats' });
    }
    stats.totalInventoryItems = row.total;
  });
  
  db.get('SELECT COUNT(*) as lowStock FROM inventory WHERE quantity <= min_stock_level', [], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch low stock stats' });
    }
    stats.lowStockItems = row.lowStock;
  });
  
  db.get('SELECT COUNT(*) as total FROM users', [], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch user stats' });
    }
    stats.totalUsers = row.total;
    
    setTimeout(() => {
      res.json(stats);
    }, 100);
  });
  
  db.close();
});

router.get('/recent-orders', authenticateToken, (req, res) => {
  const db = getDatabase();
  
  const query = `
    SELECT o.*, u.full_name as assigned_name
    FROM orders o
    LEFT JOIN users u ON o.assigned_to = u.id
    ORDER BY o.created_at DESC
    LIMIT 10
  `;
  
  db.all(query, [], (err, orders) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch recent orders' });
    }
    res.json(orders);
  });
  
  db.close();
});

router.get('/low-stock-items', authenticateToken, (req, res) => {
  const db = getDatabase();
  
  const query = `
    SELECT i.*, u.full_name as updated_by_name
    FROM inventory i
    LEFT JOIN users u ON i.updated_by = u.id
    WHERE i.quantity <= i.min_stock_level
    ORDER BY i.quantity ASC
    LIMIT 10
  `;
  
  db.all(query, [], (err, items) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch low stock items' });
    }
    res.json(items);
  });
  
  db.close();
});

router.get('/order-status-chart', authenticateToken, (req, res) => {
  const db = getDatabase();
  
  const query = `
    SELECT 
      status,
      COUNT(*) as count
    FROM orders
    GROUP BY status
  `;
  
  db.all(query, [], (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch order status chart data' });
    }
    res.json(data);
  });
  
  db.close();
});

module.exports = router;
