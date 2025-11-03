import { supabase } from '../supabase/client.js';

console.log('📄 Script loaded:', window.location.href);
// Kiểm tra đăng nhập
document.addEventListener('DOMContentLoaded', function() {
    const currentPath = window.location.pathname;
    console.log('🔍 Auth.js checking path:', currentPath);
    
    // SỬA ĐIỀU KIỆN NÀY
    if (currentPath === '/' || currentPath === '/index' || currentPath === '/index.html') {
        supabase.auth.getUser().then(({ data: { user } }) => {
            console.log('👤 User status:', user ? 'Logged in' : 'Not logged in');
            if (user) {
                console.log('🔄 Redirecting to player (already logged in)');
                window.location.href = "/player";
            } else {
                const authContainer = document.getElementById("authContainer");
                if (authContainer) {
                    authContainer.style.display = "block";
                    console.log('👁️ Showing auth form');
                }
            }
        }).catch(error => {
            console.error('❌ Auth check error:', error);
        });
    }
});


export async function signup() {
    const username = document.getElementById('signupUsername').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirm').value;
    const birthday = document.getElementById('signupBirthday').value;

    // Validation
    if (password !== confirmPassword) {
        alert('Mật khẩu xác nhận không khớp!');
        return;
    }

    if (!username || !email || !password) {
        alert('Vui lòng điền đầy đủ thông tin!');
        return;
    }

    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    username: username,
                    birthday: birthday
                }
            }
        });

        if (error) throw error;

        alert('Đăng ký thành công! Vui lòng kiểm tra email để xác thực.');
        window.location.href = 'index.html';
    } catch (error) {
        alert('Lỗi đăng ký: ' + error.message);
    }
}


// Đăng nhập bằng email/password
async function loginWithEmail() {
    if (window.location.pathname.includes('/player')) {
        console.log('🚫 Login function skipped on /player page');
        return;  // Ngăn gọi login trên player
    }
    console.log('🚀 loginWithEmail FUNCTION STARTED');
    
    const email = document.getElementById('loginEmail')?.value;
    const password = document.getElementById('loginPassword')?.value;

    console.log('📧 Login credentials:', { email, password });

    if (!email || !password) {
        alert('Vui lòng điền đầy đủ thông tin!');
        return;
    }

    try {
        console.log('🔐 Attempting Supabase login...');
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            console.error('❌ Supabase login error:', error);
            throw error;
        }

        console.log('✅ Login successful! User:', data.user);
        console.log('🔄 Redirecting to /player');
        
        alert('Đăng nhập thành công!');
        window.location.href = '/player'; 
        
    } catch (error) {
        console.error('💥 Login failed:', error);
        alert('Lỗi đăng nhập: ' + error.message);
    }
}

// Đăng nhập bằng Google
async function loginWithGoogle() {
    console.log('Login with Google called');
    
    try {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/player.html`
            }
        });

        if (error) throw error;
    } catch (error) {
        alert('Lỗi đăng nhập Google: ' + error.message);
        console.error('Google login error:', error);
    }
}

window.signup = signup;
window.loginWithEmail = loginWithEmail;
window.loginWithGoogle = loginWithGoogle;


window.authFunctions = {
    signup,
    loginWithEmail, 
    loginWithGoogle
};
