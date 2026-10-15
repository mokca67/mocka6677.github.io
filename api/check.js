module.exports = (req, res) => {
  const names = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'GOOGLE_CLIENT_EMAIL', 'GOOGLE_PRIVATE_KEY'];
  const out = {};
  names.forEach((n) => (out[n] = process.env[n] ? 'ada (' + process.env[n].length + ' karakter)' : 'KOSONG'));
  res.status(200).json(out);
};
