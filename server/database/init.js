const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../database/factory.db');

function getDatabase() {
  return new sqlite3.Database(dbPath);
}

async function initDatabase() {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    
    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          full_name TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'worker',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      db.run(`
        CREATE TABLE IF NOT EXISTS inventory (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          quantity INTEGER NOT NULL DEFAULT 0,
          unit TEXT NOT NULL DEFAULT 'pieces',
          min_stock_level INTEGER DEFAULT 10,
          last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_by INTEGER,
          FOREIGN KEY (updated_by) REFERENCES users (id)
        )
      `);
      
      db.run(`
        CREATE TABLE IF NOT EXISTS orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_number TEXT UNIQUE NOT NULL,
          customer_name TEXT NOT NULL,
          product_name TEXT NOT NULL,
          quantity INTEGER NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          priority TEXT DEFAULT 'medium',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          assigned_to INTEGER,
          created_by INTEGER,
          FOREIGN KEY (assigned_to) REFERENCES users (id),
          FOREIGN KEY (created_by) REFERENCES users (id)
        )
      `);
      
      db.run(`
        CREATE TABLE IF NOT EXISTS order_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_id INTEGER NOT NULL,
          status TEXT NOT NULL,
          changed_by INTEGER,
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (order_id) REFERENCES orders (id),
          FOREIGN KEY (changed_by) REFERENCES users (id)
        )
      `, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('Database tables created successfully');
          resolve();
        }
      });
    });
    
    db.close();
  });
}

module.exports = { getDatabase, initDatabase };
