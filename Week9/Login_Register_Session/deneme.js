const express = require('express');
const session = require('express-session');
const fs = require('fs');
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(
    session({
        secret: 'my-secret-key',
        resave: false,
        saveUninitialized: true,
    })
);

// Kullanıcı verilerini okuma ve yazma fonksiyonları
function readUsers(callback) {
    fs.readFile('users.json', 'utf8', (err, data) => {
        if (err) return callback([]);
        callback(JSON.parse(data || '[]'));
    });
}

function writeUsers(users, callback) {
    fs.writeFile('users.json', JSON.stringify(users), 'utf8', callback);
}

// Middleware: Oturum doğrulama
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/login');
    }
}
// Ana Sayfa - index.html gönderimi
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Login Sayfası
app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/login.html');
});

// Register Sayfası
app.get('/register', (req, res) => {
    res.sendFile(__dirname + '/register.html');
});

// Kullanıcı Kaydı
app.post('/submitregister', (req, res) => {
    const { fname, lname, email, password } = req.body;
    readUsers((users) => {
        if (users.some(user => user.email === email)) {
            return res.send("E-posta zaten kayıtlı! <a href='/register'>Geri dön</a>");
        }
        users.push({ firstname: fname, lastname: lname, email, password });
        writeUsers(users, () => {
            res.send("Kayıt başarılı! <a href='/login'>Giriş yap</a>");
        });
    });
});

// Kullanıcı Girişi
app.post('/submitlogin', (req, res) => {
    const { email, password } = req.body;

    readUsers((users) => {
        const user = users.find(user => user.email === email && user.password === password);

        if (user) {
            req.session.user = user; // Kullanıcı oturuma kaydediliyor
            res.redirect('/profile'); // Profil sayfasına yönlendiriliyor
        } else {
            res.send("Geçersiz kullanıcı adı veya şifre. <a href='/login'>Tekrar deneyin</a>");
        }
    });
});


// Profil Sayfası
app.get('/profile', isAuthenticated, (req, res) => {
    readUsers((users) => {
        const currentUser = req.session.user; // Oturumdaki giriş yapan kullanıcı
        const otherUsers = users.filter(user => user.email !== currentUser.email); // Diğer kullanıcılar

        res.send(`
            <h1>Hoş Geldiniz, ${currentUser.firstname} ${currentUser.lastname}</h1>
            <p>E-posta: ${currentUser.email}</p>
            <h2>Diğer Kullanıcılar</h2>
            <ul>
                ${otherUsers.map(user => `<li>${user.firstname} ${user.lastname} (${user.email})</li>`).join('')}
            </ul>
            <a href="/logout">Çıkış Yap</a>
        `);
    });
});


// Çıkış İşlemi
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

// Sunucu Başlat
app.listen(5500, () => {
    console.log('Server running on http://localhost:5500');
});
