// backend/controllers/submissionController.ts
export async function createSubmission(req, res) {
  const { name, email, phone, title, content } = req.body;
  const category_id = 7; // Ардын элч
  try {
    await db.execute(
      `INSERT INTO submissions (category_id, name, email, phone, title, content) VALUES (?, ?, ?, ?, ?, ?)`,
      [category_id, name, email, phone, title, content]
    );
    res.status(201).json({ message: 'Амжилттай илгээв' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Серверийн алдаа гарлаа' });
  }
}
