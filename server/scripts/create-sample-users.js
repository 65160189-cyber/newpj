const bcrypt = require('bcryptjs');
const { getDatabase } = require('../database/init');

async function createSampleUsers() {
  const db = getDatabase();
  
  const users = [
    {
      username: 'admin',
      password: 'admin123',
      fullName: 'ผู้ดูแลระบบ',
      role: 'admin'
    },
    {
      username: 'worker',
      password: 'worker123',
      fullName: 'พนักงานทั่วไป',
      role: 'worker'
    },
    {
      username: 'manager',
      password: 'manager123',
      fullName: 'ผู้จัดการ',
      role: 'manager'
    }
  ];

  try {
    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      
      db.run(
        'INSERT OR IGNORE INTO users (username, password, full_name, role) VALUES (?, ?, ?, ?)',
        [user.username, hashedPassword, user.fullName, user.role],
        function(err) {
          if (err) {
            console.error(`Error creating user ${user.username}:`, err);
          } else if (this.changes > 0) {
            console.log(`✅ User ${user.username} created successfully`);
          } else {
            console.log(`⚠️  User ${user.username} already exists`);
          }
        }
      );
    }
    
    console.log('\n🎉 Sample users created/verified successfully!');
    console.log('\nLogin credentials:');
    console.log('Admin: admin / admin123');
    console.log('Worker: worker / worker123');
    console.log('Manager: manager / manager123');
    
  } catch (error) {
    console.error('Error creating sample users:', error);
  } finally {
    db.close();
  }
}

createSampleUsers();
