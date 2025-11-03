import { supabase } from '../supabase/client.js';

// Kiểm tra đăng nhập
supabase.auth.getUser().then(({ data: { user } }) => {
  if (!user) {
    window.location.href = "/index.html";
  }
});

// Hàm phát bài hát - FIX LỖI 404 CHÍNH
window.playTrack = function (url, title, artist, cover_url = null) {
  try {
    const audio = new Audio(url);
    audio.play();
    
    // FIX: Sử dụng global function
    if (window.updatePlayerBar) {
      window.updatePlayerBar({ 
        title: title || 'Unknown Title', 
        artist: artist || 'Unknown Artist', 
        cover_url: cover_url 
      });
    }
  } catch (error) {
    console.error('Lỗi phát nhạc:', error);
  }
};

// Lấy playlist_id từ URL
function getPlaylistIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

// Load thông tin playlist
async function loadPlaylistInfo() {
  const playlistId = getPlaylistIdFromURL();
  if (!playlistId) {
    console.log('Không tìm thấy ID playlist trong URL - Có thể đang ở trang khác');
    return;
  }

  try {
    const { data: playlist, error } = await supabase
      .from('playlists')
      .select('*')
      .eq('id', playlistId)
      .single();

    if (error) {
      console.error("Lỗi lấy thông tin playlist:", error);
      return;
    }

    const header = document.getElementById('playlistHeader');
    if (header) {
      header.innerHTML = `
        <h1>${playlist.name || 'Unnamed Playlist'}</h1>
        <p>${playlist.description || 'No description'}</p>
      `;
    }
  } catch (error) {
    console.error('Lỗi khi load playlist info:', error);
  }
}

// Hiển thị danh sách bài hát trong playlist - FIX LỖI QUERY
async function loadTracksInPlaylist() {
  const playlistId = getPlaylistIdFromURL();
  
  // Chỉ chạy nếu có playlistId (trang playlist detail)
  if (!playlistId) {
    console.log('Không có playlistId - Có thể đang ở trang chủ');
    return;
  }

  try {
    let trackLinks = null;
    let linkError = null;

    // Thử bảng 'playlist_tracks' trước
    ({ data: trackLinks, error: linkError } = await supabase
      .from('playlist_tracks')
      .select('track_id')
      .eq('playlist_id', playlistId));

    // Nếu lỗi, thử bảng 'playlist-tracks'
    if (linkError) {
      console.log('Thử bảng playlist-tracks...');
      ({ data: trackLinks, error: linkError } = await supabase
        .from('playlist-tracks')
        .select('track_id')
        .eq('playlist_id', playlistId));
    }

    const container = document.getElementById('trackList');
    if (!container) return;

    if (linkError || !trackLinks || trackLinks.length === 0) {
      console.log("Không có bài hát trong playlist hoặc lỗi:", linkError);
      
      // Thử load tracks trực tiếp
      await loadTracksDirectly(playlistId);
      return;
    }

    const trackIds = trackLinks.map(link => link.track_id);

    // Lấy thông tin bài hát từ bảng tracks
    const { data: tracks, error: trackError } = await supabase
      .from('tracks')
      .select('*')
      .in('id', trackIds);

    if (trackError) {
      console.error("Lỗi lấy bài hát:", trackError);
      container.innerHTML = '<p class="error-message">Lỗi tải danh sách bài hát</p>';
      return;
    }

    renderTracks(tracks, container);
  } catch (error) {
    console.error('Lỗi khi load tracks:', error);
  }
}

// Fallback: Load tracks trực tiếp nếu không có bảng playlist_tracks
async function loadTracksDirectly(playlistId) {
  try {
    const { data: tracks, error } = await supabase
      .from('tracks')
      .select('*')
      .eq('playlist_id', playlistId);

    const container = document.getElementById('trackList');
    if (!container) return;

    if (error || !tracks || tracks.length === 0) {
      console.log("Không có bài hát trong playlist");
      container.innerHTML = '<p class="empty-message">Playlist trống</p>';
      return;
    }

    renderTracks(tracks, container);
  } catch (error) {
    console.error('Lỗi load tracks trực tiếp:', error);
  }
}

// Render danh sách bài hát - FIX LỖI TEMPLATE STRING
function renderTracks(tracks, container) {
  container.innerHTML = '';

  tracks.forEach(track => {
    const item = document.createElement('div');
    item.className = 'track-item';
    
    const safeTitle = track.title || 'Unknown Title';
    const safeArtist = track.artist || 'Unknown Artist';
    const safeFileUrl = track.file_url || track.url || '';
    const safeCoverUrl = track.cover_url || '';
    
    item.innerHTML = `
      <div class="track-info">
        <img src="${safeCoverUrl}" 
             alt="${safeArtist}" 
             class="track-cover"
             onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRUVFRUVFIi8+CjxwYXRoIGQ9Ik0yMCAxMkMxNS41ODQgMTIgMTIgMTUuNTg0IDEyIDIwQzEyIDI0LjQxNiAxNS41ODQgMjggMjAgMjhDMjQuNDE2IDI4IDI4IDI0LjQxNiAyOCAyMEMyOCAxNS41ODQgMjQuNDE2IDEyIDIwIDEyWk0yMi41IDIxLjI1TDE5IDIzVjE3SDIyLjVWMjEuMjVaIiBmaWxsPSIjOTk5OTk5Ii8+Cjwvc3ZnPgo=';" />
        <div class="track-details">
          <strong class="track-name">${safeTitle}</strong>
          <small class="track-artist">${safeArtist}</small>
        </div>
      </div>
      <button class="play-btn" data-url="${safeFileUrl}" data-title="${safeTitle}" data-artist="${safeArtist}" data-cover="${safeCoverUrl}">
        ▶️
      </button>
    `;
    
    // Thêm event listener
    const playBtn = item.querySelector('.play-btn');
    playBtn.addEventListener('click', () => {
      window.playTrack(safeFileUrl, safeTitle, safeArtist, safeCoverUrl);
    });
    
    container.appendChild(item);
  });
}

// Tự động tải khi mở trang - CHỈ chạy nếu có element cần thiết
document.addEventListener('DOMContentLoaded', () => {
  // Chỉ chạy nếu đang ở trang playlist detail
  if (document.getElementById('playlistHeader') || document.getElementById('trackList')) {
    loadPlaylistInfo();
    loadTracksInPlaylist();
  }
});