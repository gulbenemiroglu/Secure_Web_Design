const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');

const app = express();


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(
    session({
        secret: 'my-secret-key',
        resave: false,
        saveUninitialized: true,
    })
);

const users = []; // Kullanıcıların tutulduğu bellek içi liste
const appointments = []; // Randevuların tutulduğu bellek içi liste

// Middleware: Kullanıcının oturumunu doğrula
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/login');
    }
}

// Ana sayfa
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Login sayfası
app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/login.html');
});

// Register sayfası
app.get('/register', (req, res) => {
    res.sendFile(__dirname + '/register.html');
});

// Profil sayfası
app.get('/profile', isAuthenticated, (req, res) => {
    res.sendFile(__dirname + '/profile.html');
});

// Kullanıcı kaydı (Register işlemi)
app.post('/submitregister', (req, res) => {
    const { fname, lname, email, password } = req.body;

    // Alanların doldurulup doldurulmadığını kontrol et
    if (!fname || !lname || !email || !password) {
        return res.status(400).json({ message: 'Tüm alanlar doldurulmalıdır!' });
    }

    // E-posta kontrolü
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
        return res.status(400).json({ message: 'Bu e-posta adresi zaten kayıtlı!' });
    }

    // Yeni kullanıcıyı listeye ekle
    users.push({ firstname: fname, lastname: lname, email, password });
    res.json({ message: 'Kayıt başarıyla tamamlandı!' });
});

// Kullanıcı girişi (Login işlemi)
app.post('/submitlogin', (req, res) => {
    const { email, password } = req.body;

    // Kullanıcı doğrulama
    const user = users.find(user => user.email === email && user.password === password);

    if (user) {
        req.session.user = user; // Oturum aç
        res.redirect('/profile'); // Profil sayfasına yönlendir
    } else {
        res.status(401).json({ message: 'Geçersiz e-posta veya şifre!' });
    }
});

// Kullanıcının kendi randevularını listeleme
app.get('/list', isAuthenticated, (req, res) => {
    res.sendFile(__dirname + '/list.html'); // list.html sayfasını gönder
});

// Kullanıcının randevularını JSON olarak sağlama
app.get('/appointments', isAuthenticated, (req, res) => {
    const userAppointments = appointments.filter(app => app.userEmail === req.session.user.email);
    res.json(userAppointments); // JSON formatında döndür
});


// Yeni randevu ekleme
app.get('/form', isAuthenticated, (req, res) => {
    res.sendFile(__dirname + '/form.html');
});

app.post('/addrecord', isAuthenticated, (req, res) => {
    const { name, family, rdate, time, description } = req.body;
    const user = req.session.user;

    // Alanların doldurulup doldurulmadığını kontrol et
    if (!name || !family || !rdate || !time || !description) {
        return res.status(400).json({ message: 'Tüm alanlar doldurulmalıdır!' });
    }

    // Aynı tarih ve saat için çakışma kontrolü (tüm kullanıcılar için)
    const isDuplicate = appointments.some(
        app => app.rdate === rdate && app.time === time
    );

    if (isDuplicate) {
        return res.status(400).json({ message: 'Bu tarih ve saat için zaten bir randevu mevcut!' });
    }

    // Randevuyu ekle
    appointments.push({ name, family, rdate, time, description, userEmail: user.email });
    res.json({ message: 'Randevu başarıyla eklendi!' });
});


// Randevu silme
app.delete('/deleterecord/:index', isAuthenticated, (req, res) => {
    const index = req.params.index;
    const user = req.session.user;

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

// Çıkış yap
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

// Sunucuyu başlat
const PORT = 8090;
app.listen(PORT, () => {
    console.log(`Sunucu http://localhost:${PORT} üzerinde çalışıyor.`);
});
