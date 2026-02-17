const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getDatabase } = require('../database/init');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  const db = getDatabase();
  
  const query = `
    SELECT i.*, u.full_name as updated_by_name
    FROM inventory i
    LEFT JOIN users u ON i.updated_by = u.id
    ORDER BY i.name ASC
  `;
  
  db.all(query, [], (err, items) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch inventory' });
    }
    res.json(items);
  });
  
  db.close();
});

router.post('/', authenticateToken, (req, res) => {
  const { name, description, quantity, unit = 'pieces', minStockLevel = 10 } = req.body;
  const updatedBy = req.user.id;
  
  if (!name || quantity === undefined) {
    return res.status(400).json({ error: 'Name and quantity are required' });
  }
  
  const db = getDatabase();
  
  db.run(
    'INSERT INTO inventory (name, description, quantity, unit, min_stock_level, updated_by) VALUES (?, ?, ?, ?, ?, ?)',
    [name, description, quantity, unit, minStockLevel, updatedBy],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Item name already exists' });
        }
        return res.status(500).json({ error: 'Failed to create inventory item' });
      }
      
      const io = req.app.get('socketio');
      io.to('dashboard').emit('inventory-updated', { action: 'created', itemId: this.lastID });
      
      res.status(201).json({
        message: 'Inventory item created successfully',
        itemId: this.lastID
      });
    }
  );
  
  db.close();
});

router.put('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { name, description, quantity, unit, minStockLevel } = req.body;
  const updatedBy = req.user.id;
  
  const db = getDatabase();
  
  db.run(
    'UPDATE inventory SET name = ?, description = ?, quantity = ?, unit = ?, min_stock_level = ?, last_updated = CURRENT_TIMESTAMP, updated_by = ? WHERE id = ?',
    [name, description, quantity, unit, minStockLevel, updatedBy, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update inventory item' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Inventory item not found' });
      }
      
      const io = req.app.get('socketio');
      io.to('dashboard').emit('inventory-updated', { action: 'updated', itemId: id });
      
      res.json({ message: 'Inventory item updated successfully' });
    }
  );
  
  db.close();
});

router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  const db = getDatabase();
  
  db.run('DELETE FROM inventory WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete inventory item' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    
    const io = req.app.get('socketio');
    io.to('dashboard').emit('inventory-updated', { action: 'deleted', itemId: id });
    
    res.json({ message: 'Inventory item deleted successfully' });
  });
  
  db.close();
});

router.get('/low-stock', authenticateToken, (req, res) => {
  const db = getDatabase();
  
  const query = `
    SELECT i.*, u.full_name as updated_by_name
    FROM inventory i
    LEFT JOIN users u ON i.updated_by = u.id
    WHERE i.quantity <= i.min_stock_level
    ORDER BY i.quantity ASC
  `;
  
  db.all(query, [], (err, items) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch low stock items' });
    }
    res.json(items);
  });
  
  db.close();
});

module.exports = router;
