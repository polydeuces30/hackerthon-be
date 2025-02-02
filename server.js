const express = require('express');
const path = require('path');

const app = express();
const PORT = 8001;

// Serve HLS files with the correct content type
app.use('/live', express.static('/tmp/hls', {
  setHeaders: function (res, path, stat) {
    console.log('Serving:', path);  // Log every file being served
    if (path.endsWith('.m3u8')) {
      res.set('Content-Type', 'application/x-mpegURL');  // Set .m3u8 MIME type
    } else if (path.endsWith('.ts')) {
      res.set('Content-Type', 'video/mp2t');  // Set .ts MIME type
    }
  }
}));

// Serve the HTML player page
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
