const NodeMediaServer = require('node-media-server');

const config = {
  rtmp: {
    port: 1935,          // RTMP server will listen here
    chunk_size: 60000,   // Chunk size
    gop_cache: true,
    ping: 30,
    ping_timeout: 60
  },
  http: {
    port: 8000,          // HTTP server for HLS streaming
    allow_origin: '*'    // Allow all origins for cross-origin requests
  },
  trans: {
    ffmpeg: "/usr/bin/ffmpeg", // Make sure ffmpeg is installed
    tasks: [
      {
        app: "live",          // RTMP application name (this should match with OBS stream key)
        ac: "aac",            // Audio codec
        mp4: true,            // Optionally, save the stream as MP4
        hls: true,            // Enable HLS output
        hlsFlags: "[hls_time=2:hls_list_size=5:hls_flags=delete_segments]",
        hlsKeep: true,        // Keep HLS segments for debugging
        hls_path: "/tmp/hls", // Directory where HLS segments will be stored
      },
    ],
  },
};

const nms = new NodeMediaServer(config);

// Simply run the server without events
nms.run();

console.log("Streaming server running at:");
console.log("- RTMP: rtmp://localhost:1935/live");
console.log("- HLS: http://localhost:8000/live/[stream_key].m3u8");
