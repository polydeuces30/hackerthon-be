const NodeMediaServer = require('node-media-server');

const config = {
  rtmp: {
    port: 1935,
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60
  },
  http: {
    port: 8000,
    allow_origin: '*'
  },
  trans: {
    ffmpeg: "/usr/bin/ffmpeg",
    tasks: [
      {
        app: "live",
        ac: "aac",
        mp4: true,
        hls: true,
        hlsFlags: "[hls_time=2:hls_list_size=5:hls_flags=delete_segments]",
        hlsKeep: true,
        hls_path: "/tmp/hls",
      },
    ],
  },
};

const nms = new NodeMediaServer(config);

nms.run();

console.log("Streaming server running at:");
console.log("- RTMP: rtmp://localhost:1935/live");
console.log("- HLS: http://localhost:8000/live/[stream_key].m3u8");
