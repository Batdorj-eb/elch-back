// cron/weeklyNewsletter.js

const cron = require('node-cron');
const nodemailer = require('nodemailer');
const db = require('../config/database');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function sendWeeklyNewsletter() {
  try {
    // Get active subscribers
    const [subscribers] = await db.query(
      'SELECT email FROM newsletter_subscribers WHERE is_active = 1'
    );

    if (subscribers.length === 0) {
      console.log('No subscribers found');
      return;
    }

    // Get last 7 days articles
    const [articles] = await db.query(`
      SELECT title, slug, excerpt, featured_image 
      FROM articles 
      WHERE status = 'published' 
        AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      ORDER BY created_at DESC
      LIMIT 10
    `);

    if (articles.length === 0) {
      console.log('No new articles this week');
      return;
    }

    // Build email HTML
    const articlesHtml = articles.map(a => `
      <div style="margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 15px;">
        <a href="https://elch.mn/articles/${a.slug}" style="text-decoration: none; color: #333;">
          <h3 style="margin: 0 0 8px 0; color: #FF3336;">${a.title}</h3>
        </a>
        <p style="margin: 0; color: #666; font-size: 14px;">${a.excerpt || ''}</p>
      </div>
    `).join('');

    const emailHtml = `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <div style="background: #FF3336; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">ELCH NEWS</h1>
          <p style="color: white; margin: 5px 0 0 0;">7 хоногийн мэдээ</p>
        </div>
        
        <div style="padding: 20px;">
          <h2 style="color: #333;">Энэ 7 хоногийн онцлох мэдээнүүд</h2>
          ${articlesHtml}
        </div>
        
        <div style="background: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          <p>Бүртгэлээ цуцлах бол <a href="https://elch.mn/api/newsletter/unsubscribe/{{email}}">энд дарна уу</a></p>
        </div>
      </div>
    `;

    // Send to each subscriber
    for (const subscriber of subscribers) {
      const personalizedHtml = emailHtml.replace('{{email}}', encodeURIComponent(subscriber.email));
      
      await transporter.sendMail({
        from: '"ELCH News" <news@elch.mn>',
        to: subscriber.email,
        subject: `ELCH News - ${new Date().toLocaleDateString('mn-MN')} 7 хоногийн мэдээ`,
        html: personalizedHtml
      });

      // Update last_email_sent
      await db.query(
        'UPDATE newsletter_subscribers SET last_email_sent = NOW() WHERE email = ?',
        [subscriber.email]
      );
    }

    console.log(`✅ Newsletter sent to ${subscribers.length} subscribers`);
  } catch (error) {
    console.error('❌ Newsletter error:', error);
  }
}

// Run every Monday at 9:00 AM
cron.schedule('0 9 * * 1', () => {
  console.log('📧 Running weekly newsletter...');
  sendWeeklyNewsletter();
});

module.exports = { sendWeeklyNewsletter };