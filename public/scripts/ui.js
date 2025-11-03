// Tải giao diện sidebar
function loadSidebar() {
  fetch('/components/sidebar.html')
    .then(res => {
      if (!res.ok) throw new Error('Failed to load sidebar');
      return res.text();
    })
    .then(html => {
      const sidebar = document.querySelector('.sidebar-left');
      if (sidebar) sidebar.innerHTML = html;
    })
    .catch(error => {
      console.error('Error loading sidebar:', error);
    });
}

// Tải giao diện player bar
function loadPlayerBar() {
  fetch('/components/player-bar.html')
    .then(res => {
      if (!res.ok) throw new Error('Failed to load player bar');
      return res.text();
    })
    .then(html => {
      const playerBar = document.querySelector('.player-bar');
      if (playerBar) {
        playerBar.innerHTML = html;
        initializePlayerBar();
      }
    })
    .catch(error => {
      console.error('Error loading player bar:', error);
    });
}

// Khởi tạo player bar controls
function initializePlayerBar() {
  const playPauseBtn = document.getElementById('playPauseBtn');
  const volumeSlider = document.getElementById('volumeSlider');
  
  if (playPauseBtn) {
    playPauseBtn.addEventListener('click', togglePlayPause);
  }
  
  if (volumeSlider) {
    volumeSlider.addEventListener('input', handleVolumeChange);
  }
}

let currentAudio = null;
let isPlaying = false;

function togglePlayPause() {
  if (currentAudio) {
    if (isPlaying) {
      currentAudio.pause();
      isPlaying = false;
      document.getElementById('playPauseBtn').textContent = '▶️';
    } else {
      currentAudio.play();
      isPlaying = true;
      document.getElementById('playPauseBtn').textContent = '⏸️';
    }
  }
}

function handleVolumeChange(e) {
  if (currentAudio) {
    currentAudio.volume = e.target.value / 100;
  }
}

/**
 * Cập nhật nội dung thanh phát nhạc - FIX LỖI 404
 */
function updatePlayerBar(track) {
  if (!track) return;

  const cover = document.getElementById('trackCover');
  const title = document.getElementById('trackTitle');
  const artist = document.getElementById('trackArtist');

  // FIX QUAN TRỌNG: Xử lý cover_url đúng cách
  if (cover) {
    if (track.cover_url && track.cover_url.trim() !== '') {
      cover.src = track.cover_url;
      cover.alt = track.artist || 'Track cover';
      cover.style.display = 'block';
    } else {
      // QUAN TRỌNG: Đặt src thành # hoặc ẩn đi
      cover.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRUVFRUVFIi8+CjxwYXRoIGQ9Ik0yMCAxMkMxNS41ODQgMTIgMTIgMTUuNTg0IDEyIDIwQzEyIDI0LjQxNiAxNS41ODQgMjggMjAgMjhDMjQuNDE2IDI4IDI4IDI0LjQxNiAyOCAyMEMyOCAxNS41ODQgMjQuNDE2IDEyIDIwIDEyWk0yMi41IDIxLjI1TDE5IDIzVjE3SDIyLjVWMjEuMjVaIiBmaWxsPSIjOTk5OTk5Ii8+Cjwvc3ZnPgo=';
      cover.alt = 'No cover';
      cover.style.display = 'block';
    }
  }

  if (title) title.textContent = track.title || 'Unknown Title';
  if (artist) artist.textContent = track.artist || 'Unknown Artist';
}

// Khởi tạo khi trang load
document.addEventListener('DOMContentLoaded', () => {
  loadSidebar();
  loadPlayerBar();
});

// Make functions available globally
window.updatePlayerBar = updatePlayerBar;
window.loadSidebar = loadSidebar;
window.loadPlayerBar = loadPlayerBar;