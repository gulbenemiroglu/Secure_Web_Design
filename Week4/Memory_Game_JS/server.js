var http = require('http');
var fs = require('fs');
var path = require('path');

// Sunucu oluşturma
http.createServer(function (req, res) {
    var filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.html';
    }

    // Dosya uzantısı belirleme
    var extname = String(path.extname(filePath)).toLowerCase();
    var mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.png': 'image/png'
    };

    // Dosya türüne göre MIME tipi
    var contentType = mimeTypes[extname] || 'application/octet-stream';

    // Dosyayı okuma yanıt olarak gönderme
    fs.readFile(filePath, function(err, data) {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end("404 Dosya Bulunamadı");
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data, 'utf-8');
        }
    });
}).listen(8080, () => {
    console.log("Sunucu 8080 portunda çalışıyor...");
});
