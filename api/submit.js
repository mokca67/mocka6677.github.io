const { JWT } = require('google-auth-library');

const SHEET_ID = process.env.SHEET_ID || '1BZxW6Moo8wTFolMnYEoyi_Zm89RKGbCYZaTSAbCWIjU';
const text = (v, n) => String(v ?? '').trim().slice(0, n);

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Gunakan POST' });

  const b = req.body || {};
  const row = {
    nama: text(b.nama, 80),
    kelas: text(b.kelas, 20),
    absen: parseInt(b.absen, 10) || null,
    benar: parseInt(b.benar, 10),
    total: parseInt(b.total, 10),
    nilai: Math.round(Number(b.nilai)),
    attempt: Math.max(1, parseInt(b.attempt, 10) || 1),
  };
  if (!row.nama || !row.kelas || !(row.total > 0) || !(row.benar >= 0 && row.benar <= row.total) || !(row.nilai >= 0 && row.nilai <= 100)) {
    return res.status(400).json({ error: 'Data tidak valid' });
  }

  // todo = bagian mana yang masih perlu disimpan (supaya tombol "Simpan ulang" tidak membuat data ganda)
  const todo = b.todo || { db: true, sheet: true };
  const out = { db: !todo.db, sheet: !todo.sheet };
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  await Promise.all([
    todo.db && (async () => {
      const r = await fetch(`${process.env.SUPABASE_URL}/rest/v1/scores`, {
        method: 'POST',
        headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify(row),
      });
      out.db = r.ok;
      if (!r.ok) console.error('Supabase:', await r.text());
    })().catch((e) => console.error('Supabase:', e.message)),

    todo.sheet && (async () => {
      const auth = new JWT({
        email: process.env.GOOGLE_CLIENT_EMAIL,
        key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
      const waktu = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
      const r = await auth.request({
        url: `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/A1:append`,
        method: 'POST',
        params: { valueInputOption: 'USER_ENTERED', insertDataOption: 'INSERT_ROWS' },
        data: { values: [[waktu, row.nama, row.kelas, row.absen, row.benar, row.total, row.nilai, row.attempt]] },
      });
      out.sheet = r.status === 200;
    })().catch((e) => console.error('Sheets:', e.message)),
  ]);

  res.status(200).json(out);
};
