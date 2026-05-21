// auth.js - логика сессий
const AuthService = {
    // Установка куки
    setSession: (username) => {
        document.cookie = `session_user=${username}; path=/; max-age=86400; SameSite=Strict`;
        localStorage.setItem('isLoggedIn', 'true');
    },
    
    // Проверка сессии
    checkSession: () => {
        return document.cookie.includes('session_user=') && localStorage.getItem('isLoggedIn') === 'true';
    },

    // Выход
    logout: () => {
        document.cookie = "session_user=; path=/; max-age=0";
        localStorage.removeItem('isLoggedIn');
        window.location.href = 'index.html';
    }
};