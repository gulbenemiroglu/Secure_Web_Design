const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session ayarları
app.use(session({
  secret: 'gizliAnahtar', // Güçlü bir rastgele anahtar seçin
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // HTTPS kullanıyorsanız `true` yapabilirsiniz
}));

// Örnek kullanıcı (veritabanı yerine)
const users = [{ email: 'test@example.com', password: '123456' }];

// Randevu verileri (örnek veritabanı)
let appointments = [];

// Oturum kontrol middleware
function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
}

// Statik dosyalar
app.use(express.static(path.join(__dirname, '/')));

// Routes

// Ana sayfa
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Login sayfası
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

// Login işlemi
app.post('/submitlogin', (req, res) => {
  const { email, password } = req.body;

  const user = users.find(u => u.email === email && u.password === password);
  if (user) {
    req.session.user = { email }; // Kullanıcı bilgileri session'a kaydediliyor
    return res.status(200).json({ message: 'Giriş başarılı' });
  }

  res.status(401).json({ message: 'Geçersiz e-posta veya şifre' });
});

// Profil sayfası
app.get('/profile', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'profile.html'));
});

// Kullanıcı bilgilerini al
app.get('/getUser', requireLogin, (req, res) => {
  res.json(req.session.user);
});

// Çıkış yap
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error(err);
      return res.status(500).send('Çıkış sırasında bir hata oluştu.');
    }
    res.redirect('/login');
  });
});

// Randevu ekleme sayfası
app.get('/form', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'form.html'));
});

// Yeni randevu ekle
app.post('/addrecord', requireLogin, (req, res) => {
  const { name, family, rdate, time, description } = req.body;
  appointments.push({ name, family, rdate, time, description });
  res.status(200).json({ message: 'Randevu başarıyla eklendi' });
});

// Randevuları listeleme sayfası
app.get('/list', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'list.html'));
});

// Randevuları getir
app.get('/appointments', requireLogin, (req, res) => {
  res.json(appointments);
});

// Randevuyu sil
app.delete('/deleterecord/:index', requireLogin, (req, res) => {
  const index = req.params.index;
  if (appointments[index]) {
    appointments.splice(index, 1);
    return res.status(200).json({ message: 'Randevu silindi' });
  }
  res.status(404).json({ message: 'Randevu bulunamadı' });
});

// Sunucuyu başlat
app.listen(PORT, () => {
  console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor`);
});
