// routes/newsletterRoutes.js

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const nodemailer = require('nodemailer');

// SMTP transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// POST /api/newsletter/subscribe
router.post('/subscribe', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'И-мэйл хаяг буруу байна.'
      });
    }

    // Check if already subscribed
    const [existing] = await db.query(
      'SELECT id, is_active FROM newsletter_subscribers WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      if (existing[0].is_active) {
        return res.status(400).json({
          success: false,
          message: 'Энэ и-мэйл аль хэдийн бүртгэгдсэн байна.'
        });
      } else {
        // Reactivate
        await db.query(
          'UPDATE newsletter_subscribers SET is_active = 1, subscribed_at = NOW() WHERE id = ?',
          [existing[0].id]
        );
      }
    } else {
      // Insert new subscriber
      await db.query(
        'INSERT INTO newsletter_subscribers (email) VALUES (?)',
        [email]
      );
    }

    // ✅ Welcome email илгээх
    await transporter.sendMail({
      from: '"ELCH News" <news@elch.mn>',
      to: email,
      subject: 'ELCH News - Бүртгэл амжилттай!',
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <div style="background: #FF3336; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">ELCH NEWS</h1>
          </div>
          
          <div style="padding: 30px; background: #fff;">
            <h2 style="color: #333;">Баярлалаа! 🎉</h2>
            <p style="color: #666; line-height: 1.6;">
              Та ELCH News-ийн мэдээллийн жагсаалтад амжилттай бүртгэгдлээ.
            </p>
            <p style="color: #666; line-height: 1.6;">
              Одооноос эхлэн 7 хоног тутам шинэ мэдээ, нийтлэлүүдийн тойм таны и-мэйл рүү ирэх болно.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://elch.mn" style="background: #FF3336; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">
                Мэдээ унших
              </a>
            </div>
          </div>
          
          <div style="background: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
            <p>Бүртгэлээ цуцлах бол <a href="https://elch.mn/api/newsletter/unsubscribe/${encodeURIComponent(email)}">энд дарна уу</a></p>
          </div>
        </div>
      `
    });

    res.json({
      success: true,
      message: 'Амжилттай бүртгэгдлээ!'
    });
  } catch (error) {
    console.error('Newsletter subscribe error:', error);
    res.status(500).json({
      success: false,
      message: 'Бүртгэхэд алдаа гарлаа.'
    });
  }
});

// GET /api/newsletter/unsubscribe/:email
router.get('/unsubscribe/:email', async (req, res) => {
  try {
    const { email } = req.params;

    await db.query(
      'UPDATE newsletter_subscribers SET is_active = 0, unsubscribed_at = NOW() WHERE email = ?',
      [decodeURIComponent(email)]
    );

    res.send(`
      <html>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1>Бүртгэл цуцлагдлаа</h1>
          <p>${decodeURIComponent(email)} хаягаар мэдээлэл илгээхгүй.</p>
          <a href="https://elch.mn">Нүүр хуудас руу буцах</a>
        </body>
      </html>
    `);
  } catch (error) {
    res.status(500).send('Алдаа гарлаа');
  }
});

module.exports = router;