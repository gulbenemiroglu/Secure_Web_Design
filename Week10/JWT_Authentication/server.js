const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

const app = express();
const SECRET_KEY = 'my-super-secret-key-1234567890!';

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

// Statik dosyalar için middleware
app.use(express.static(__dirname));

const users = [];
const appointments = [];

// JWT Middleware
function authenticateJWT(req, res, next) {
    const cookie = req.headers.cookie;
    const token = cookie?.split('=')[1];

    if (token) {
        jwt.verify(token, SECRET_KEY, {algorithms: ['HS256']}, (err, user) => {
            if (err) {
                return res.status(403).json({message: 'Geçersiz veya süresi dolmuş token!'});
            }
            req.user = user; // Token'dan gelen kullanıcı bilgisi
            next();
        });
    } else {
        res.status(401).json({message: 'Token eksik!'});
    }
}

// Ana Sayfa
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Giriş Sayfası
app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/login.html');
});

// Kayıt Sayfası
app.get('/register', (req, res) => {
    res.sendFile(__dirname + '/register.html');
});

// Profil Sayfası
app.get('/profile', authenticateJWT, (req, res) => {
    res.sendFile(__dirname + '/profile.html');
});
// Form Sayfası
app.get('/form', authenticateJWT, (req, res) => {
    res.sendFile(__dirname + '/form.html');
});
// Randevu Listesi
app.get('/list', authenticateJWT, (req, res) => {
    res.sendFile(__dirname + '/list.html');
});

// Randevular JSON
app.get('/appointments', authenticateJWT, (req, res) => {
    const userAppointments = appointments.filter(app => app.userEmail === req.user.email);
    res.json(userAppointments);
});

// Yeni Randevu Ekleme
app.post('/addrecord', authenticateJWT, (req, res) => {
    const {name, family, rdate, time, description} = req.body;

    if (!name || !family || !rdate || !time || !description) {
        return res.status(400).json({message: 'Tüm alanlar doldurulmalıdır!'});
    }

    if (appointments.some(app => app.rdate === rdate && app.time === time)) {
        return res.status(400).json({message: 'Bu tarih ve saat için zaten bir randevu mevcut!'});
    }

    appointments.push({name, family, rdate, time, description, userEmail: req.user.email});
    res.json({message: 'Randevu başarıyla eklendi!'});
});

app.delete('/deleterecord/:index', authenticateJWT, (req, res) => {
    const index = req.params.index;
    const cookie = req.headers.cookie;
    const token = cookie?.split('=')[1];
    const user = jwt.decode(token)

    if (index >= 0 && index < appointments.length) {
        const record = appointments[index];
        if (record.userEmail !== user.email) {
            return res.status(403).json({ message: 'Sadece kendi randevularınızı silebilirsiniz!' });
        }
        appointments.splice(index, 1);
        res.json({ message: 'Randevu başarıyla silindi!' });
    } else {
        res.status(400).json({ message: 'Geçersiz randevu indeksi!' });
    }
});

// Kullanıcı Girişi
app.post('/submitlogin', (req, res) => {
    const {email, password} = req.body;

    // Kullanıcı doğrulama
    const user = users.find(user => user.email === email && user.password === password);

    if (user) {
        const token = jwt.sign(
            {email: user.email},
            SECRET_KEY,
            {algorithm: 'HS256', expiresIn: '1h'}
        );

        res.cookie('token', token, {httpOnly: true}).json({message: 'Giriş başarılı!'});
    } else {
        res.status(401).json({message: 'Geçersiz e-posta veya şifre!'});
    }
});

// Kullanıcı Kaydı
app.post('/submitregister', (req, res) => {
    const {fname, lname, email, password} = req.body;

    if (users.some(user => user.email === email)) {
        return res.status(400).json({message: 'Bu e-posta adresi zaten kayıtlı!'});
    }

    users.push({fname, lname, email, password});
    res.json({message: 'Kayıt başarılı!'});
});

// Sunucuyu Başlat
const PORT = 8081;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));