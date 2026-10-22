const { JWT } = require('google-auth-library');

const text = (v, n) => String(v ?? '').trim().slice(0, n);

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Gunakan POST' });

  const sheetId = process.env.REFLECT_SHEET_ID;
  if (!sheetId) {
    console.error('Reflect sheet: REFLECT_SHEET_ID belum diisi');
    return res.status(500).json({ ok: false });
  }

  const b = req.body || {};
  const answers = Array.isArray(b.answers) ? b.answers.slice(0, 5).map((v) => text(v, 500)) : [];
  const nama = text(b.nama, 80);
  const kelas = text(b.kelas, 20);
  if (!nama || !kelas || answers.length !== 5 || answers.some((v) => !v)) {
    return res.status(400).json({ ok: false, error: 'Data tidak valid' });
  }
  const absen = parseInt(b.absen, 10);
  const nilai = parseInt(b.nilai, 10);

  try {
    const auth = new JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const waktu = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
    // RAW: jawaban ditulis sebagai teks biasa, jadi tidak ada rumus yang ikut berjalan
    const r = await auth.request({
      url: `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A1:append`,
      method: 'POST',
      params: { valueInputOption: 'RAW', insertDataOption: 'INSERT_ROWS' },
      data: { values: [[waktu, nama, kelas, Number.isFinite(absen) ? absen : '', Number.isFinite(nilai) ? nilai : '', ...answers]] },
    });
    return res.status(200).json({ ok: r.status === 200 });
  } catch (e) {
    console.error('Reflect sheet:', e.message);
    return res.status(200).json({ ok: false });
  }
};
