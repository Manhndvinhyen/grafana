// upload.js
import { supabase } from '../supabase/client.js';
import * as musicMetadata from 'music-metadata-browser';

export async function uploadTrack() {
  const titleInput = document.getElementById('trackTitle').value;
  const artistInput = document.getElementById('trackArtist').value;
  const fileInput = document.getElementById('trackFile');
  const coverUrl = document.getElementById('coverUrl').value || '/assets/default-cover.jpg';  // Default nếu không có

  const file = fileInput.files[0];
  if (!file) {
    alert('Vui lòng chọn file audio.');
    return;
  }

  // Check file type (chỉ audio: MP3, OGG, WAV)
  const allowedTypes = ['audio/mpeg', 'audio/ogg', 'audio/wav'];
  if (!allowedTypes.includes(file.type)) {
    alert('Chỉ hỗ trợ file MP3, OGG, hoặc WAV.');
    return;
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    alert('Bạn chưa đăng nhập.');
    return;
  }

  // Parse metadata từ file (title, artist auto nếu có)
  let title = titleInput;
  let artist = artistInput;
  try {
    const metadata = await musicMetadata.parseBlob(file);
    title = metadata.common.title || titleInput || file.name.replace(/\.[^/.]+$/, '');  // Fallback input hoặc filename
    artist = metadata.common.artist || artistInput || 'Unknown';
    console.log('Metadata extracted:', { title, artist });
  } catch (parseError) {
    console.error('Error parsing metadata:', parseError.message);
    alert('Không thể phân tích metadata file, sử dụng input thủ công.');
  }

  if (!title || !artist) {
    alert('Vui lòng cung cấp title và artist (hoặc file có metadata).');
    return;
  }

  const fileName = `${Date.now()}_${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from('tracks')
    .upload(fileName, file);

  if (uploadError) {
    console.error('Upload error:', uploadError.message);
    alert('Lỗi khi tải file lên: ' + uploadError.message);
    return;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('tracks')
    .getPublicUrl(fileName);

  const { error: insertError } = await supabase.from('tracks').insert([
    {
      title,
      artist,
      url: publicUrl,  // Sửa field 'url' nếu schema là 'file_url'
      cover_url: coverUrl,
      user_id: user.id
    }
  ]);

  if (insertError) {
    console.error('Insert error:', insertError.message);
    alert('Lỗi khi lưu bài hát: ' + insertError.message);
  } else {
    alert('Tải lên thành công!');
    // Clear inputs
    fileInput.value = '';
    document.getElementById('trackTitle').value = '';
    document.getElementById('trackArtist').value = '';
    document.getElementById('coverUrl').value = '';
    // Refresh playlists nếu cần (gọi từ app.js)
    if (window.loadUserPlaylists) window.loadUserPlaylists();
  }
}