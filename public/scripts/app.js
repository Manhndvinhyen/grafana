// app.js
import { supabase } from '../supabase/client.js';

console.log('✅ App.js loaded');
console.log('✅ Supabase instance:', supabase ? 'Connected' : 'Not connected');

// Thêm vào đầu cả auth.js và app.js
console.log('📄 Script loaded:', window.location.href);
// Biến toàn cục cho player
let currentAudio = null;
let isPlaying = false;
let currentTrackIndex = 0;
let currentPlaylist = [];
let volume = 0.5;


// Hàm tải components
async function loadComponents() {
    try {
        // Tải sidebar
        const sidebarResponse = await fetch('/components/sidebar.html');
        if (!sidebarResponse.ok) throw new Error('Sidebar fetch fail: ' + sidebarResponse.status);
        const sidebarHTML = await sidebarResponse.text();
        const sidebarElement = document.querySelector('.sidebar-left');
        if (sidebarElement) {
            sidebarElement.innerHTML = sidebarHTML;
            initializeSidebarEvents();
            console.log('Sidebar loaded ok');
        }

        // Tải player bar
        const playerResponse = await fetch('/components/player-bar.html');
        if (!playerResponse.ok) throw new Error('Player-bar fetch fail: ' + playerResponse.status);
        const playerHTML = await playerResponse.text();
        const playerElement = document.querySelector('.player-bar');
        if (playerElement) {
            playerElement.innerHTML = playerHTML;
            initializePlayerControls();
            console.log('Player-bar loaded ok');
        }

    } catch (error) {
        console.error('Lỗi tải components:', error.message);
        alert('Lỗi load UI, check console');
    }
}

// Khởi tạo sidebar events
function initializeSidebarEvents() {
    const navLinks = document.querySelectorAll('.sidebar a');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const href = link.getAttribute('href');
            if (href && href !== '#') {
                window.location.href = href;
            }
        });
    });
}

// Khởi tạo đầy đủ player controls
function initializePlayerControls() {
    // Play/Pause
    const playPauseBtn = document.getElementById('playPauseBtn');
    if (playPauseBtn) {
        playPauseBtn.addEventListener('click', togglePlayPause);
    }

    // Previous track
    const prevBtn = document.getElementById('prevBtn');
    if (prevBtn) {
        prevBtn.addEventListener('click', playPreviousTrack);
    }

    // Next track
    const nextBtn = document.getElementById('nextBtn');
    if (nextBtn) {
        nextBtn.addEventListener('click', playNextTrack);
    }

    // Volume control
    const volumeSlider = document.getElementById('volumeSlider');
    if (volumeSlider) {
        volumeSlider.addEventListener('input', handleVolumeChange);
        volumeSlider.value = volume * 100;
    }

    // Progress bar (nếu có)
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
        progressBar.addEventListener('input', handleProgressChange);
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);

    console.log('Player controls initialized');
}

// Play/Pause toggle
function togglePlayPause() {
    const playPauseBtn = document.getElementById('playPauseBtn');
    
    if (!currentAudio) return;

    if (isPlaying) {
        currentAudio.pause();
        if (playPauseBtn) playPauseBtn.textContent = '▶️';
    } else {
        currentAudio.play();
        if (playPauseBtn) playPauseBtn.textContent = '⏸️';
    }
    isPlaying = !isPlaying;
}

// Play previous track
function playPreviousTrack() {
    if (currentPlaylist.length === 0) return;

    currentTrackIndex = (currentTrackIndex - 1 + currentPlaylist.length) % currentPlaylist.length;
    const track = currentPlaylist[currentTrackIndex];
    playTrack(track.file_url, track.title, track.artist, track.cover_url);
}

// Play next track
function playNextTrack() {
    if (currentPlaylist.length === 0) return;

    currentTrackIndex = (currentTrackIndex + 1) % currentPlaylist.length;
    const track = currentPlaylist[currentTrackIndex];
    playTrack(track.file_url, track.title, track.artist, track.cover_url);
}

// Volume control
function handleVolumeChange(e) {
    volume = e.target.value / 100;
    if (currentAudio) {
        currentAudio.volume = volume;
    }
}

// Progress control
function handleProgressChange(e) {
    if (currentAudio && currentAudio.duration) {
        const seekTime = (e.target.value / 100) * currentAudio.duration;
        currentAudio.currentTime = seekTime;
    }
}

// Keyboard shortcuts
function handleKeyboardShortcuts(e) {
    if (e.target.tagName === 'INPUT') return; // Ignore when typing in inputs

    switch(e.code) {
        case 'Space':
            e.preventDefault();
            togglePlayPause();
            break;
        case 'ArrowLeft':
            e.preventDefault();
            seek(-10); // Rewind 10 seconds
            break;
        case 'ArrowRight':
            e.preventDefault();
            seek(10); // Forward 10 seconds
            break;
        case 'ArrowUp':
            e.preventDefault();
            increaseVolume();
            break;
        case 'ArrowDown':
            e.preventDefault();
            decreaseVolume();
            break;
    }
}

// Seek forward/backward
function seek(seconds) {
    if (currentAudio) {
        currentAudio.currentTime += seconds;
    }
}

// Increase volume
function increaseVolume() {
    volume = Math.min(1, volume + 0.1);
    if (currentAudio) {
        currentAudio.volume = volume;
    }
    const volumeSlider = document.getElementById('volumeSlider');
    if (volumeSlider) {
        volumeSlider.value = volume * 100;
    }
}

// Decrease volume
function decreaseVolume() {
    volume = Math.max(0, volume - 0.1);
    if (currentAudio) {
        currentAudio.volume = volume;
    }
    const volumeSlider = document.getElementById('volumeSlider');
    if (volumeSlider) {
        volumeSlider.value = volume * 100;
    }
}

// Update progress bar (chạy liên tục khi nhạc đang phát)
function updateProgressBar() {
    const progressBar = document.getElementById('progressBar');
    const currentTimeEl = document.getElementById('currentTime');
    const durationEl = document.getElementById('duration');

    if (currentAudio && progressBar) {
        const progress = (currentAudio.currentTime / currentAudio.duration) * 100 || 0;
        progressBar.value = progress;

        if (currentTimeEl) {
            currentTimeEl.textContent = formatTime(currentAudio.currentTime);
        }
        if (durationEl) {
            durationEl.textContent = formatTime(currentAudio.duration);
        }
    }
}

// Format time (seconds to MM:SS)
function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Phát bài hát
window.playTrack = function (url, title, artist, cover_url = '', playlist = [], index = 0) {
    // Dừng bài hát hiện tại
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }

    // Lưu playlist và index nếu được cung cấp
    if (playlist.length > 0) {
        currentPlaylist = playlist;
        currentTrackIndex = index;
    }

    // Tạo audio mới
    currentAudio = new Audio(url);
    currentAudio.volume = volume;
    
    // Event listeners cho audio
    currentAudio.addEventListener('loadedmetadata', function() {
        console.log('Track loaded:', title, 'Duration:', this.duration);
        updateProgressBar();
    });

    currentAudio.addEventListener('timeupdate', updateProgressBar);

    currentAudio.addEventListener('ended', function() {
        isPlaying = false;
        const playPauseBtn = document.getElementById('playPauseBtn');
        if (playPauseBtn) playPauseBtn.textContent = '▶️';
        
        // Tự động chuyển bài tiếp theo
        if (currentPlaylist.length > 0) {
            setTimeout(playNextTrack, 1000);
        }
    });

    currentAudio.addEventListener('error', function(e) {
        console.error('Audio error:', e);
        alert('Lỗi phát nhạc: Không thể tải file audio');
    });

    // Phát nhạc
    currentAudio.play().catch(error => {
        console.error('Play failed:', error);
        alert('Lỗi phát nhạc: ' + error.message);
    });
    
    isPlaying = true;
    
    // Cập nhật UI
    updatePlayerBar({ title, artist, cover_url });
    
    // Cập nhật nút play/pause
    const playPauseBtn = document.getElementById('playPauseBtn');
    if (playPauseBtn) {
        playPauseBtn.textContent = '⏸️';
    }

    console.log('Now playing:', title, 'by', artist);
};

// Cập nhật player bar
function updatePlayerBar(trackInfo) {
    const trackTitle = document.getElementById('trackTitle');
    const trackArtist = document.getElementById('trackArtist');
    const trackCover = document.getElementById('trackCover');

    if (trackTitle) trackTitle.textContent = trackInfo.title || 'Unknown Title';
    if (trackArtist) trackArtist.textContent = trackInfo.artist || 'Unknown Artist';
    if (trackCover) {
        trackCover.src = trackInfo.cover_url || '/assets/default-cover.jpg';
        trackCover.alt = trackInfo.title || 'Track cover';
    }
}

// Tải playlist của user
async function loadUserPlaylists() {
    try {
      const { data: playlists, error } = await supabase
        .from('playlists')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Playlists loaded:', playlists.length);  // Log count
      displayPlaylists(playlists);
    } catch (error) {
      console.error('Lỗi tải playlists:', error.message);
      alert('Lỗi load playlists');
    }
}

// Hiển thị playlists
function displayPlaylists(playlists) {
    const playlistGrid = document.getElementById('playlistGrid');
    if (!playlistGrid) return;

    playlistGrid.innerHTML = '';

    playlists.forEach(playlist => {
        const playlistCard = document.createElement('div');
        playlistCard.className = 'playlist-card';
        playlistCard.innerHTML = `
            <h3>${playlist.name}</h3>
            <p>${playlist.description || 'No description'}</p>
            <button onclick="loadPlaylistTracks(${playlist.id})">▶️ Phát</button>
        `;
        playlistGrid.appendChild(playlistCard);
    });
}

// Tải tracks trong playlist
window.loadPlaylistTracks = async function(playlistId) {
    try {
        const { data: tracks, error } = await supabase
            .from('playlist_tracks')
            .select(`
                track_id,
                tracks (*)
            `)
            .eq('playlist_id', playlistId);

        if (error) throw error;

        const trackList = tracks.map(item => item.tracks);
        currentPlaylist = trackList;
        
        // Phát bài đầu tiên
        if (trackList.length > 0) {
            const firstTrack = trackList[0];
            playTrack(firstTrack.file_url, firstTrack.title, firstTrack.artist, firstTrack.cover_url, trackList, 0);
        }

    } catch (error) {
        console.error('Lỗi tải tracks:', error);
        alert('Lỗi tải danh sách nhạc: ' + error.message);
    }
};

// Thêm progress bar vào player-bar.html (cần sửa file này)
/*
<div class="progress-container">
    <span id="currentTime">0:00</span>
    <input type="range" id="progressBar" min="0" max="100" value="0" class="progress-bar">
    <span id="duration">0:00</span>
</div>
*/

document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ DOM loaded, checking auth...');
    
    // Chỉ kiểm tra trên player.html
    if (window.location.pathname.includes('/player')) {  // Sửa từ 'player.html' thành '/player'
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (!user) {
                console.log('❌ No user, redirecting to login...');
                window.location.href = "/index.html";
            } else {
                console.log('✅ User authenticated:', user.email);
                // Nếu đã đăng nhập, tải các component
                loadComponents();
                loadUserPlaylists();
            }
        }).catch(error => {
            console.error('❌ Auth check error:', error);
        });
    }
});