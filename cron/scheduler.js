// scheduler.js - Scheduled posts автоматаар нийтлэх
const cron = require('node-cron');
const db = require('../config/database');

cron.schedule('* * * * *', async () => {
  try {
    const now = new Date();
    
    const [articles] = await db.query(`
      UPDATE articles 
      SET status = 'published' 
      WHERE status = 'scheduled' 
        AND published_at IS NOT NULL 
        AND published_at <= ?
    `, [now]);

    if (articles.affectedRows > 0) {
      console.log(`✅ [Scheduler] ${articles.affectedRows} мэдээ автоматаар нийтлэгдлээ`);
    }
  } catch (error) {
    console.error('❌ [Scheduler] Алдаа:', error);
  }
});

console.log('⏰ Scheduler ажиллаж эхэллээ...');

module.exports = cron;