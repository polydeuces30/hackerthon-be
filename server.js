const express = require('express');
const path = require('path');

const app = express();
const PORT = 8001;

app.use('/live', express.static('/tmp/hls', {
  setHeaders: function (res, path, stat) {
    console.log('Serving:', path);
    if (path.endsWith('.m3u8')) {
      res.set('Content-Type', 'application/x-mpegURL');
    } else if (path.endsWith('.ts')) {
      res.set('Content-Type', 'video/mp2t');
    }
  }
}));

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
