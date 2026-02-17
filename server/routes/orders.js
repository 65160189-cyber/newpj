const express = require('express');
const multer = require('multer');
const { authenticateToken } = require('../middleware/auth');
const { getDatabase } = require('../database/init');

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

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

router.post('/import', authenticateToken, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  try {
    const XLSX = require('xlsx');
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    
    // ดึงข้อมูลจาก Sheet3 (index 2)
    const sheetIndex = 2; // Sheet3 = index 2
    if (!workbook.SheetNames[sheetIndex]) {
      return res.status(400).json({ success: false, message: 'Sheet3 not found in file' });
    }
    
    const sheetName = workbook.SheetNames[sheetIndex];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (data.length < 2) {
      return res.status(400).json({ success: false, message: 'Sheet3 is empty or invalid' });
    }

    // หา index ของคอลัมน์ที่ต้องการ
    const headers = data[0];
    const columnMapping = {
      kanbanId: -1,
      customer: -1,
      salePart: -1,
      orderNo: -1,
      deliveryDate: -1,
      qty: -1
    };

    headers.forEach((header, index) => {
      const headerText = header.toString().toLowerCase().trim();
      if (headerText.includes('kanban') || headerText.includes('id')) {
        columnMapping.kanbanId = index;
      } else if (headerText.includes('customer')) {
        columnMapping.customer = index;
      } else if (headerText.includes('sale') || headerText.includes('part')) {
        columnMapping.salePart = index;
      } else if (headerText.includes('order') || headerText.includes('no')) {
        columnMapping.orderNo = index;
      } else if (headerText.includes('delivery') || headerText.includes('date')) {
        columnMapping.deliveryDate = index;
      } else if (headerText.includes('qty') || headerText.includes('quantity')) {
        columnMapping.qty = index;
      }
    });

    // ตรวจสอบว่าหาคอลัมน์ที่ต้องการครบหรือไม่
    const missingColumns = Object.keys(columnMapping).filter(key => columnMapping[key] === -1);
    if (missingColumns.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Missing required columns: ${missingColumns.join(', ')}`,
        foundHeaders: headers
      });
    }

    const rows = data.slice(1);
    const db = getDatabase();
    let imported = 0;
    let errors = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (row.length === 0 || !row[columnMapping.kanbanId]) continue;

      try {
        const orderData = {
          orderNumber: row[columnMapping.orderNo] || `ORD${row[columnMapping.kanbanId] || Date.now()}${i}`,
          customerName: row[columnMapping.customer] || 'Unknown Customer',
          productName: row[columnMapping.salePart] || 'Unknown Product',
          quantity: parseInt(row[columnMapping.qty]) || 1,
          deliveryDate: row[columnMapping.deliveryDate] || '',
          kanbanId: row[columnMapping.kanbanId] || '',
          priority: 'medium',
          notes: `Imported from Sheet3 - Kanban ID: ${row[columnMapping.kanbanId]}`,
          status: 'pending',
          createdBy: req.user.id,
          createdAt: new Date().toISOString()
        };

        await new Promise((resolve, reject) => {
          const query = `
            INSERT INTO orders (order_number, customer_name, product_name, quantity, delivery_date, kanban_id, priority, notes, status, created_by, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;
          db.run(query, [
            orderData.orderNumber,
            orderData.customerName,
            orderData.productName,
            orderData.quantity,
            orderData.deliveryDate,
            orderData.kanbanId,
            orderData.priority,
            orderData.notes,
            orderData.status,
            orderData.createdBy,
            orderData.createdAt
          ], function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
          });
        });

        imported++;
      } catch (error) {
        errors.push(`Row ${i + 2}: ${error.message}`);
      }
    }

    db.close();

    res.json({
      success: true,
      imported,
      total: rows.length,
      errors: errors.slice(0, 10),
      message: `Successfully imported ${imported} orders from Sheet3`
    });

  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to process file: ' + error.message 
    });
  }
});

module.exports = router;
