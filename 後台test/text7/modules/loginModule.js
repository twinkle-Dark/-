console.log('✓ 登入模組已成功載入');
/*
 * 登入模組 - 負責管理使用者登入、權限驗證和使用者資訊
 */

// 定義登入模組
const LoginModule = {
    // 當前用戶信息 (預設資料)
    currentUser: {
        userId: 'sam230000_02',
        email: 'sam2355008@gmail.com',
        name: 'TK',
        role: '2',
        dateCreated: '2025-03-20T09:14:33.100Z',
        lastLogin: '2025-03-20T09:14:33.100Z',
        museum: 'nmp',
        status: '一般'
    },
    
    // 初始化
    init: function() {
        console.log('初始化登入模組');
        this.setupEventListeners();
        this.updateUIWithUserInfo();
    },
    
    // 設置事件監聽
    setupEventListeners: function() {
        // 登出按鈕事件
        const signoutBtn = document.querySelector('button[onclick="handleSignout()"]');
        if (signoutBtn) {
            signoutBtn.removeAttribute('onclick');
            signoutBtn.addEventListener('click', () => this.handleSignout());
        }
        
        // 測試登入按鈕
        const testBtn = document.getElementById('testLoginBtn');
        if (testBtn) {
            testBtn.addEventListener('click', () => this.testLogin());
        }
    },
    
    // 更新UI顯示用戶信息
    updateUIWithUserInfo: function() {
        const userNameElement = document.getElementById("userName");
        if (userNameElement) {
            userNameElement.textContent = this.currentUser.name;
        }
    },
    
    // 獲取當前用戶資訊
    getCurrentUser: function() {
        return this.currentUser;
    },
    
    // 處理登出
    handleSignout: function() {
        // 實際情況中，這裡應該清除session並重定向到登入頁面
        alert(`登出功能尚未實現`);
    },
    
    // 測試登入功能，顯示當前用戶資訊
    testLogin: function() {
        const user = this.getCurrentUser();
        const userInfo = `
        當前用戶資訊：
        - 用戶ID: ${user.userId}
        - 姓名: ${user.name}
        - 電子郵件: ${user.email}
        - 角色: ${user.role}
        - 所屬博物館: ${user.museum}
        - 狀態: ${user.status}
        `;
        alert(userInfo);
    }
};

// 在瀏覽器環境中，將模組附加到全局App對象
if (typeof window !== 'undefined' && window.App) {
    window.App.loginModule = LoginModule;
}

// 在Node.js環境中(測試環境)，將模組導出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoginModule;
} 