const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getDatabase } = require('../database/init');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  const db = getDatabase();
  
  const query = `
    SELECT o.*, u.full_name as assigned_name, c.full_name as created_name
    FROM orders o
    LEFT JOIN users u ON o.assigned_to = u.id
    LEFT JOIN users c ON o.created_by = c.id
    ORDER BY o.created_at DESC
  `;
  
  db.all(query, [], (err, orders) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch orders' });
    }
    res.json(orders);
  });
  
  db.close();
});

router.post('/', authenticateToken, (req, res) => {
  const { orderNumber, customerName, productName, quantity, priority = 'medium' } = req.body;
  const createdBy = req.user.id;
  
  if (!orderNumber || !customerName || !productName || !quantity) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  
  const db = getDatabase();
  
  db.run(
    'INSERT INTO orders (order_number, customer_name, product_name, quantity, priority, created_by) VALUES (?, ?, ?, ?, ?, ?)',
    [orderNumber, customerName, productName, quantity, priority, createdBy],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Order number already exists' });
        }
        return res.status(500).json({ error: 'Failed to create order' });
      }
      
      db.run(
        'INSERT INTO order_history (order_id, status, changed_by, notes) VALUES (?, ?, ?, ?)',
        [this.lastID, 'pending', createdBy, 'Order created'],
        (err) => {
          if (err) {
            console.error('Failed to create order history:', err);
          }
        }
      );
      
      const io = req.app.get('socketio');
      io.to('dashboard').emit('order-updated', { action: 'created', orderId: this.lastID });
      
      res.status(201).json({
        message: 'Order created successfully',
        orderId: this.lastID
      });
    }
  );
  
  db.close();
});

router.put('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { status, assignedTo } = req.body;
  const changedBy = req.user.id;
  
  const db = getDatabase();
  
  let updateFields = [];
  let updateValues = [];
  
  if (status !== undefined) {
    updateFields.push('status = ?');
    updateValues.push(status);
  }
  
  if (assignedTo !== undefined) {
    updateFields.push('assigned_to = ?');
    updateValues.push(assignedTo);
  }
  
  if (updateFields.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }
  
  updateFields.push('updated_at = CURRENT_TIMESTAMP');
  updateValues.push(id);
  
  db.run(
    `UPDATE orders SET ${updateFields.join(', ')} WHERE id = ?`,
    updateValues,
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update order' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }
      
      if (status) {
        db.run(
          'INSERT INTO order_history (order_id, status, changed_by) VALUES (?, ?, ?)',
          [id, status, changedBy],
          (err) => {
            if (err) {
              console.error('Failed to create order history:', err);
            }
          }
        );
      }
      
      const io = req.app.get('socketio');
      io.to('dashboard').emit('order-updated', { action: 'updated', orderId: id });
      
      res.json({ message: 'Order updated successfully' });
    }
  );
  
  db.close();
});

router.get('/:id/history', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  const db = getDatabase();
  
  const query = `
    SELECT oh.*, u.full_name as changed_by_name
    FROM order_history oh
    LEFT JOIN users u ON oh.changed_by = u.id
    WHERE oh.order_id = ?
    ORDER BY oh.created_at DESC
  `;
  
  db.all(query, [id], (err, history) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch order history' });
    }
    res.json(history);
  });
  
  db.close();
});

module.exports = router;
