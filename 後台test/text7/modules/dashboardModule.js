console.log('✓ 儀表板模組已成功載入');
/*
 * GAS用.HTML，+<script> /script 包住，地端用JS
 * 儀表板模組 - 負責管理系統儀表板功能
 * 包含數據載入、統計計算與儀表板渲染
 */ // 儀表板模組功能列表
    // 1. 初始化
    // 2. 設置事件監聽
    // 3. 載入篩選器選項
    // 4. 載入儀表板數據
    // 5. 顯示/隱藏載入狀態
    // 6. 渲染儀表板
    // 7. 匯出儀表板報表
    // 8. 啟用拖曳卡片功能

    //Web 應用程式 (Chart.getAs('image/png').getDataAsString() 等):
    //可以將圖表導出為圖片格式 (例如 PNG, JPEG, SVG) 的資料 URL
    // 然後在 Web 應用程式中顯示。

// 定義儀表板模組
const DashboardModule = {
    // 當前篩選設置
    filters: {
        timeRange: 'all', // 預設顯示所有資料
        museum: '', // 自動填入登入帳號的museumID
        dateFrom: '',           // 自訂日期範圍(起)
        dateTo: '',             // 自訂日期範圍(迄)
        customDateActive: false // 是否啟用自訂日期

    },
    
    // 數據緩存
    dataCache: {
        visitorInfo: null,
        interactions: null
    },
    
    // 初始化
    init: function() {
        console.log('初始化儀表板模組');
        this.setupEventListeners();
        this.loadFilterOptions();
        this.loadData();
    },
    
    // 取得目前登入的用戶
    getCurrentUser: function() {
        if (window.App && window.App.loginModule) {
            return window.App.loginModule.getCurrentUser();
        }
        // 若無法取得登入模組，返回空物件
        return {};
    },
    
    // 設置事件監聽
    setupEventListeners: function() {
        console.log('設置儀表板事件監聽器');
        
        try {
            // 時間範圍選擇
            const timeRangeButtons = document.querySelectorAll('#timeRangeSelector .btn');
            if (timeRangeButtons.length > 0) {
                timeRangeButtons.forEach(btn => {
                    btn.addEventListener('click', e => {
                        document.querySelectorAll('#timeRangeSelector .btn').forEach(b => 
                            b.classList.remove('active'));
                        e.target.classList.add('active');
                        
                        // 更新篩選設置
                        this.filters.timeRange = e.target.getAttribute('data-range');
                        
                        // 如果選擇自訂日期，顯示日期選擇器
                        const dateRangeInputs = document.getElementById('dateRangeInputs');
                        if (dateRangeInputs) {
                            if (this.filters.timeRange === 'custom') {
                                dateRangeInputs.classList.remove('d-none');
                                this.filters.customDateActive = true;
                                // 自訂日期模式不自動載入，等待使用者點擊套用按鈕
                            } else {
                                dateRangeInputs.classList.add('d-none');
                                this.filters.customDateActive = false;
                                
                                // 直接設置日期範圍
                                this.processTimeRangeFilter();
                                
                                // 載入資料
                                this.loadData();
                            }
                        } else {
                            // 如果找不到日期輸入元素，仍然處理時間範圍設置
                            this.processTimeRangeFilter();
                            this.loadData();
                        }
                        
                        console.log(`時間範圍已變更為: ${this.filters.timeRange}`);
                    });
                });
                console.log(`時間範圍選擇器監聽器已設置 (${timeRangeButtons.length}個按鈕)`);
            } else {
                console.warn('找不到時間範圍選擇器按鈕');
            }
             
             // 自訂日期範圍篩選器 (對應recordId中的日期時間部分)
             const dateRangeFrom = document.getElementById('dateRangeFrom');
             const dateRangeTo = document.getElementById('dateRangeTo');
             const applyDateRangeBtn = document.getElementById('applyDateRangeBtn');
             
             if (dateRangeFrom && dateRangeTo && applyDateRangeBtn) {
                 applyDateRangeBtn.addEventListener('click', () => {
                     this.filters.dateFrom = dateRangeFrom.value;
                     this.filters.dateTo = dateRangeTo.value;
                     console.log(`自訂日期範圍已變更為: ${this.filters.dateFrom} 至 ${this.filters.dateTo}`);
                     this.loadData();
                 });
                 console.log('自訂日期範圍篩選器監聽器已設置');
             } else if (dateRangeFrom || dateRangeTo || applyDateRangeBtn) {
                 console.warn('自訂日期範圍篩選器元素不完整');
             }
        } catch (error) {
            console.error('設置儀表板事件監聽器時發生錯誤:', error);        
        }
        
        // 重新整理按鈕
        const refreshBtn = document.getElementById('refreshDashboardBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadData(true));
        }
        
        // 匯出報表按鈕
        const exportBtn = document.getElementById('exportDashboardBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportDashboard());
        }
    },
    // 載入篩選器選項
    loadFilterOptions: function() {
        // 載入博物館選項
        if (LoginModule && LoginModule.getCurrentUser()) {
            const currentUser = LoginModule.getCurrentUser();
            if (currentUser && currentUser.museum) {
                this.filters.museum = currentUser.museum;
                console.log("使用者博物館ID:", this.filters.museum);
                const museumSelector = document.getElementById('museumSelector');
                if (museumSelector) {
                    museumSelector.value = currentUser.museum;
                }
            }
        } else {
            console.error('無法載入博物館資料: 使用者未登入');
        }
    },
    // 載入儀表板數據
    loadData: function(forceRefresh = false) {
        console.log(`載入儀表板數據 (強制刷新: ${forceRefresh ? '是' : '否'})`);
        
        // 顯示載入指示器
        this.showLoadingState(true); 
        
        // 從服務器獲取數據或使用測試數據
        if (typeof google !== 'undefined' && google.script) {
            // 使用計數器跟踪兩個請求的完成情況
            let requestsCompleted = 0;
            
            // 獲取訪客訊息數據 - 添加博物館篩選
            google.script.run
                .withSuccessHandler(data => {
                    // 保存表頭
                    const headers = data.length > 0 ? data[0] : [];
                    
                    // 分離表頭和資料行
                    const dataRows = data.slice(1);
                    
                    // 步驟1: 套用日期篩選
                    const dateFilteredRows = this.filterDataByDateRange(dataRows, headers);
                    
                    // 步驟2: 套用博物館篩選
                    const filteredDataRows = dateFilteredRows.filter(row => {
                        if (!row || row.length === 0) return false;
                        const recordId = row[1]; // recordId 在第二列
                        // 支援新的 nmp_nmp_000_ 格式和舊的 nmp_ 格式
                        return recordId && (
                            recordId.includes(`${this.filters.museum}_`) || 
                            recordId.startsWith(`${this.filters.museum}_`) ||
                            recordId.includes(`${this.filters.museum}_${this.filters.museum}_`)
                        );
                    });
                    
                    // 重新組合表頭和過濾後的數據
                    const filteredData = [headers, ...filteredDataRows];
                    
                    this.dataCache.visitorInfo = filteredData;
                    console.log(`成功載入訪客資料表數據 (${filteredDataRows.length} 筆)`);
                    requestsCompleted++;
                    
                    // 當兩個請求都完成時，渲染儀表板
                    if (requestsCompleted === 2) {
                        this.renderDashboard();
                        this.showLoadingState(false);
                    }
                })
                .withFailureHandler(error => {
                    console.error('載入訪客資料表失敗:', error);
                    requestsCompleted++;
                    
                    if (requestsCompleted === 2) {
                        this.showLoadingState(false);
                    }
                })
                .getDataVInfo();
                
            // 獲取互動數據 - 添加博物館篩選
            google.script.run
                .withSuccessHandler(data => {
                    // 保存表頭
                    const headers = data.length > 0 ? data[0] : [];
                    
                    // 分離表頭和資料行
                    const dataRows = data.slice(1);
                    
                    // 套用日期篩選 (使用recordId欄位)
                    const dateFilteredRows = this.filterDataByDateRange(dataRows, headers);
                    
                    // 套用博物館篩選
                    const filteredDataRows = dateFilteredRows.filter(row => {
                        if (!row || row.length === 0) return false;
                        const museumId = row[1]; // museumId 在第二列
                        return museumId === this.filters.museum;
                    });
                    
                    // 重新組合表頭和過濾後的數據
                    const filteredData = [headers, ...filteredDataRows];
                    
                    this.dataCache.interactions = filteredData;
                    console.log(`成功載入互動紀錄資料表 (${filteredDataRows.length} 筆)`);
                    requestsCompleted++;
                    
                    // 當兩個請求都完成時，渲染儀表板
                    if (requestsCompleted === 2) {
                        this.renderDashboard();
                        this.showLoadingState(false);
                    }
                })
                .withFailureHandler(error => {
                    console.error('載入互動紀錄資料表失敗:', error);
                    requestsCompleted++;
                    
                    if (requestsCompleted === 2) {
                        this.showLoadingState(false);
                    }
                })
                .getDataVInteractions(this.filters);
        } else {
            // 測試環境使用模擬數據庫
            console.log('測試環境使用模擬數據庫');
            setTimeout(() => {
                // 使用默認值作為後備
                const defaultDataVInFo = [
                    ['visitorId', 'recordId', 'formVersion', 'gender', 'ageGroup', 'education', 'residence', 'visitPurpose', 'visitFrequency', 'consent', 'totalSeconds', 'visitorComposition'],
                    ['N_00_02_KS_ 3500', 'nmp_nmp_000_202513282148_0000_285', 1, '非二元性別', '0-12', '國中', '高雄市', '休閒', '每年5-6次', true, 8, ' 家庭 '],
                    ['N_00_00_KS_ 5248', 'nmp_nmp_000_202503282149_0000_745', 1, '非二元性別', '0-12', '國中', '高雄市', '休閒', '每年5-6次', true, 17, '團體 '],
                    ['D_19_02_TN_ 2342', 'nmp_nmp_000_202503292304_0000_352', 1, '不願透漏', '19-24', '國中', '台南市', '學習', '每年13次以上', true, 5, '獨自'],
                    ['D_19_02_TN_ 8224', 'nmp_nmp_000_202503292307_0000_704', 1, '不願透漏', '19-24', '國中', '台南市', '學習', '每年13次以上', true, 188, ' 家庭 '],
                    ['N_19_01_PT_ 1796', 'nmp_nmp_000_202503292330_0000_065', 1, '非二元性別', '19-24', '國小或以下', '屏東縣', '休閒', '每年5-6次', true, 2, '團體 '],
                    ['N_19_01_PT_ 7198', 'nmp_nmp_000_202503292340_0000_102', 1, '非二元性別', '19-24', '國小或以下', '屏東縣', '休閒', '每年5-6次', true, 2, '獨自'],
                    ['N_25_04_TT_ 6711', 'nmp_nmp_000_202503292344_0000_195', 1, '非二元性別', '25-34', '專科', '台東縣', '其他', '每年1-2次', true, 31, ' 家庭 '],
                    ['F_75_00_HS_ 8020', 'nmp_nmp_000_202503292349_0000_236', 1, '生理女性', '75-84', '不願透漏', '新竹市', '其他', '每年5-6次', true, 24, '團體 '],
                    ['F_75_00_HS_ 8020', 'nmp_nmp_000_202503292349_0000_236', 1, '生理女性', '75-84', '不願透漏', '新竹市', '其他', '每年5-6次', true, 24, '獨自'],
                    ['F_75_00_HS_ 8020', 'nmp_nmp_000_202503292349_0000_236', 1, '生理女性', '75-84', '不願透漏', '新竹市', '其他', '每年5-6次', true, 24, ' 家庭 '],
                    ['M_75_06_HS_ 3065', 'nmp_nmp_000_202503292351_0000_446', 1, '生理男性', '75-84', '研究所', '新竹市', '休閒', '每年3-4次', true, 31, '團體 '],
                    ['M_13_03_CY_ 1971', 'nmp_nmp_000_202503301544_0000_754', 1, '生理男性', '13-18', '高中/職', '嘉義市', '學習', '每年1-2次', true, 53, '獨自'],
                    ['M_13_03_CY_ 2756', 'nmp_nmp_000_202503301547_0000_362', 1, '生理男性', '13-18', '高中/職', '嘉義市', '學習', '每年1-2次', true, 13, ' 家庭 '],
                    ['O_65_06_HJ_ 5400', 'nmp_nmp_000_202503311807_0000_621', 1, '其他', '65-74', '研究所', '新竹縣', '學習', '每年3-4次', true, 26, '團體 '],
                    ['D_13_02_CY_ 1694', 'nmp_nmp_000_202504011458_0000_634', 1, '不願透漏', '13-18', '國中', '嘉義縣', '學習', '每年1-2次', true, 8, '獨自'],
                    ['D_19_01_CY_ 4347', 'nmp_nmp_000_202504011631_0000_500', 1, '不願透漏', '19-24', '國小或以下', '嘉義市', '學習', '每年1-2次', true, 12, ' 家庭 '],
                    ['M_25_06_TP_ 7694', 'nmp_nmp_000_202504011840_0000_231', 1, '生理男性', '25-34', '研究所', '台北市', '學習, 休閒, 其他', '每年13次以上', true, 144, '團體 '],
                    ['M_25_06_TP_ 7425', 'nmp_nmp_000_202504011841_0000_059', 1, '生理男性', '25-34', '研究所', '台北市', '學習, 休閒, 其他', '每年13次以上', true, 144, '獨自'],
                    ['M_19_02_TY_ 8379', 'nmp_nmp_000_202504012039_0000_760', 1, '生理男性', '19-24', '國中', '桃園市', '其他', '每年3-4次', true, 0, ' 家庭 '],
                    ['F_25_04_HL_ 1091', 'nmp_nmp_000_202504012041_0000_031', 1, '生理女性', '25-34', '專科', '花蓮縣', '學習', '每年9-10次', true, 53, '團體 '],
                    ['N_19_02_NT_ 3956', 'nmp_nmp_000_202504012045_0000_981', 1, '非二元性別', '19-24', '國中', '南投縣', '休閒', '每年1-2次', true, 157, '獨自'],
                    ['O_19_02_KS_ 2420', 'nmp_nmp_000_202504041133_0000_791', 1, '其他', '19-24', '國中', '高雄市', '學習', '每年1-2次', true, 11, ' 家庭 '],
                    ['D_95_00_DI_ 7766', 'nmp_nmp_000_202504072019_0000_705', 1, '不願透漏', '95以上', '不願透漏', '不願透漏', '學習, 其他', '不願透漏', true, 47, ' 家庭 '],
                    ['N_13_03_PH_ 7698', 'nmp_nmp_000_202504072223_0000_820', 1, '非二元性別', '13-18', '高中/職', '澎湖縣', '學習', '每年1-2次', true, 4, ''],
                    ['N_00_02_KS_ 3500', 'nmp_nmp_000_202501282148_0000_285', 1, '非二元性別', '0-12', '國中', '高雄市', '休閒', '每年5-6次', true, 8, ' 家庭 '],
                    ['N_00_02_KS_ 3500', 'nmp_nmp_000_202502282148_0000_285', 1, '非二元性別', '0-12', '國中', '高雄市', '休閒', '每年5-6次', true, 8, ' 家庭 '],
                    ['N_00_02_KS_ 3500', 'nmp_nmp_000_202500282148_0000_285', 1, '非二元性別', '0-12', '國中', '高雄市', '休閒', '每年5-6次', true, 8, ' 家庭 '],
                    ['N_00_01_KS_ 3500', 'nmp_nmp_000_202504282148_0000_285', 1, '非二元性別', '0-12', '國中', '高雄市', '休閒', '每年5-6次', true, 8, ' 家庭 '],
                    ['N_00_02_KS_ 3500', 'nmp_nmp_000_202504282148_0000_285', 1, '非二元性別', '0-12', '國中', '高雄市', '休閒', '每年5-6次', true, 8, ' 家庭 '],
                    ['N_00_02_KS_ 3500', 'nmp_nmp_000_202504282148_0000_285', 1, '非二元性別', '0-12', '國中', '高雄市', '休閒', '每年5-6次', true, 8, ' 家庭 '],
                    ['N_00_02_KS_ 3500', 'nmp_nmp_000_202511282148_0000_285', 1, '非二元性別', '0-12', '國中', '高雄市', '休閒', '每年5-6次', true, 8, ' 家庭 '],
                    ['N_00_02_KS_ 3500', 'nmp_nmp_000_202510282148_0000_285', 1, '非二元性別', '0-12', '國中', '高雄市', '休閒', '每年5-6次', true, 8, ' 家庭 '],
                    ['N_00_02_KS_ 3500', 'nmp_nmp_000_202505282148_0000_285', 1, '非二元性別', '0-12', '國中', '高雄市', '休閒', '每年5-6次', true, 8, ' 家庭 '],
                    ['N_00_02_KS_ 3500', 'nmp_nmp_000_202601282148_0000_285', 1, '非二元性別', '0-12', '國中', '高雄市', '休閒', '每年5-6次', true, 8, ' 家庭 '],
                    ['N_00_02_KS_ 3500', 'nmp_nmp_000_202502282148_0000_285', 1, '非二元性別', '0-12', '國中', '高雄市', '休閒', '每年5-6次', true, 8, ' 家庭 '],
                    ['N_00_02_KS_ 3500', 'nmp_nmp_000_202503282148_0000_285', 1, '非二元性別', '0-12', '國中', '高雄市', '休閒', '每年5-6次', true, 8, ' 家庭 '],
                    ['N_00_02_KS_ 3500', 'nmp_nmp_000_202504282148_0000_285', 1, '非二元性別', '0-12', '國中', '高雄市', '休閒', '每年5-6次', true, 8, ' 家庭 '],
                    ['N_00_02_KS_ 3500', 'nmp_nmp_000_202605282148_0000_285', 1, '非二元性別', '0-12', '國中', '高雄市', '休閒', '每年5-6次', true, 8, ' 家庭 '],
                    ['N_00_02_KS_ 3500', 'nmp_nmp_000_202506282148_0000_285', 1, '非二元性別', '0-12', '國中', '高雄市', '休閒', '每年5-6次', true, 8, ' 家庭 '],
                    ['N_00_02_KS_ 3500', 'nmp_nmp_000_202507282148_0000_285', 1, '非二元性別', '0-12', '國中', '高雄市', '休閒', '每年5-6次', true, 100000, ' 家庭 '],
                    ['N_00_02_KS_ 3500', 'nmp_nmp_000_202508282148_0000_285', 1, '非二元性別', '0-12', '國中', '高雄市', '休閒', '每年5-6次', true, 8, ' 家庭 '],
                    ['N_00_02_KS_ 3500', 'nmp_nmp_000_202509282148_0000_285', 1, '非二元性別', '0-12', '國中', '高雄市', '休閒', '每年5-6次', true, 8, ' 家庭 '],
                    ['N_00_02_KS_ 3500', 'nmp_nmp_000_202510282148_0000_285', 1, '非二元性別', '0-12', '國中', '高雄市', '休閒', '每年5-6次', true, 8, ' 家庭 '],
                    ['N_00_02_KS_ 3500', 'nmp_nmp_000_202511282148_0000_285', 1, '非二元性別', '0-12', '國中', '高雄市', '休閒', '每年5-6次', true, 8, ' 家庭 '],
                    ['N_00_02_KS_ 3500', 'nmp_nmp_000_202512282148_0000_285', 1, '非二元性別', '0-12', '國中', '高雄市', '休閒', '每年5-6次', true, 8, ' 家庭 '],
                    ['N_00_02_KS_ 3500', 'nmp_nmp_000_202501282148_0000_285', 1, '非二元性別', '0-12', '國中', '高雄市', '休閒', '每年5-6次', true, 8, ' 家庭 '],
                    ['N_00_02_KS_ 3500', 'nmp_nmp_000_202504192148_0000_285', 1, '非二元性別', '0-12', '國中', '高雄市', '休閒', '每年5-6次', true, 8, ' 家庭 '],
                    ['F_00_01_PH_ 3500', 'nmp_nmp_000_202504092148_0000_285', 1, '非二元性別', '0-12', '國中', '台南市', '休閒', '每年5-6次', true, 8, ' 家庭 '],
                
                ];
                
                const defaultDataVInteractions = [
                    ['recordId', 'museumId', 'userId', 'pointId', 'arriveTime', 'leaveTime', 'staySeconds', 'totalSeconds ', 'interactionCount', 'interactionType', 'notes'],
                    ['nmp_nmp_000_202504080931_015', 'nmp', 'sam20000_02', '6-1', '2025-03-20T09:31:47.016Z', '2025-03-20T09:31:51.465Z', 4, '', 0, '觀看影片', ''],
                    ['nmp_nmp_000_202504080931_0000_001', 'nmp', 'sam20000_02', '6-1', '2025-03-20T09:31:47.016Z', '2025-03-20T09:31:51.465Z', 4, '', 0, '觀看影片', ''],
                    ['nmp_nmp_000_202504090543_000', 'nmp', 'sam20000_02', '1-1', '2025-03-24T05:43:20.804Z', '2025-03-24T05:43:31.934Z', 11, '', 0, '觀看展品', '燦坤'],
                    ['nmp_nmp_000_202503240543_000', 'nmp', 'sam20000_02', '1-1', '2025-03-24T05:43:20.804Z', '2025-03-24T05:43:31.934Z', 11, '', 0, '觀看展品', '燦坤'],
                    ['nmp_nmp_000_202503240543_000', 'nmp', 'sam20000_02', '1-1', '2025-03-24T05:43:20.804Z', '2025-03-24T05:43:31.934Z', 11, '', 0, '觀看展品', '燦坤'],
                    ['nmp_nmp_000_202503240543_000', 'nmp', 'sam20000_02', '1-1', '2025-03-24T05:43:20.804Z', '2025-03-24T05:43:31.934Z', 11, '', 0, '觀看展品', '燦坤'],
                    ['nmp_nmp_000_202503240543_000', 'nmp', 'sam20000_02', '1-1', '2025-03-24T05:43:20.804Z', '2025-03-24T05:43:31.934Z', 11, '', 0, '觀看展品', '燦坤'],
                    ['nmp_nmp_000_202503240543_000', 'nmp', 'sam20000_02', '1-1', '2025-03-24T05:43:20.804Z', '2025-03-24T05:43:31.934Z', 11, '', 0, '觀看展品', '燦坤'],
                    ['nmp_nmp_000_202503240543_000', 'nmp', 'sam20000_02', '1-2', '2025-03-24T05:43:20.804Z', '2025-03-24T05:43:31.934Z', 11, '', 0, '觀看展品', '燦坤'],
                    ['nmp_nmp_000_202503240543_000', 'nmp', 'sam20000_02', '1-2', '2025-03-24T05:43:20.804Z', '2025-03-24T05:43:31.934Z', 11, '', 0, '觀看展品', '燦坤'],
                    ['nmp_nmp_000_202503240543_000', 'nmp', 'sam20000_02', '1-2', '2025-03-24T05:43:20.804Z', '2025-03-24T05:43:31.934Z', 11, '', 0, '觀看展品', '燦坤'],
                    ['nmp_nmp_000_202503240543_000', 'nmp', 'sam20000_02', '1-2', '2025-03-24T05:43:20.804Z', '2025-03-24T05:43:31.934Z', 11, '', 0, '觀看展品', '燦坤'],
                    ['nmp_nmp_000_202503240545_000', 'nmp', 'sam20000_02', '1-1', '2025-03-24T05:45:19.228Z', '2025-03-24T05:45:30.087Z', 10, '', 0, '觀看告示牌, 聆聽導覽', 'iPad'],
                    ['nmp_nmp_000_202503240545_000', 'nmp', 'sam20000_02', '1-1', '2025-03-24T05:45:19.228Z', '2025-03-24T05:45:30.087Z', 10, '', 0, '觀看告示牌, 聆聽導覽', 'iPad'],
                    ['nmp_nmp_000_202503311806_0000_001', 'nmp', 'sam20000_02', '1-1', '2025-03-31T18:06:46.985+08:00', '2025-03-31T18:06:57.408+08:00', 10, '', 0, '其他', 'iphone'],
                    ['nmp_nmp_000_202504011458_0000_001', 'nmp', 'sam20000_02', '4-4', '2025-04-01T14:58:46.693+08:00', '2025-04-01T14:58:49.661+08:00', 2, '', 0, '觀看展品, 聆聽音樂', ''],
                    ['nmp_nmp_000_202504011458_0000_002', 'nmp', 'sam20000_02', '4-2', '2025-04-01T14:58:51.748+08:00', '2025-04-01T14:58:53.368+08:00', 1, '', 0, '觀看影片', ''],
                    ['nmp_nmp_000_202504011631_0000_002', 'nmp', 'sam20000_02', '5-3', '2025-04-01T16:31:04.962+08:00', '2025-04-01T16:31:06.634+08:00', 1, '', 0, '觀看展品', ''],
                    ['nmp_nmp_000_202504011631_0000_001', 'nmp', 'sam20000_02', '1-2', '2025-04-01T16:31:01.741+08:00', '2025-04-01T16:31:03.298+08:00', 1, '', 0, '觀看影片', ''],
                    ['nmp_nmp_000_202504011631_0000_000', 'nmp', 'sam20000_02', '5-2', '2025-04-01T16:30:58.270+08:00', '2025-04-01T16:31:00.065+08:00', 1, '', 0, '觀看展品', ''],
                    ['nmp_nmp_000_202504011631_0000_003', 'nmp', 'sam20000_02', '1-2', '2025-04-01T16:31:08.778+08:00', '2025-04-01T16:31:10.561+08:00', 1, '', 0, '觀看展品', ''],
                    ['nmp_nmp_000_202504011839_0000_000', 'nmp', 'sam20000_02', '6-3', '2025-04-01T18:39:37.059+08:00', '2025-04-01T18:39:45.855+08:00', 8, '', 0, '觸摸模型, 互動式投影, 拍照, 錄音, 錄影, 筆記, 其他', 'test'],
                    ['nmp_nmp_000_202504011840_0000_001', 'nmp', 'sam20000_02', '6-2', '2025-04-01T18:39:55.977+08:00', '2025-04-01T18:40:09.568+08:00', 13, '', 0, '觸摸模型, 互動式投影, 拍照, 錄音, 錄影, 筆記, 其他', 'test'],
                    ['nmp_nmp_000_202504012043_0000_000', 'nmp', 'sam20000_02', '5-5', '2025-04-01T20:42:26.100+08:00', '2025-04-01T20:43:25.531+08:00', 59, '', 0, '觀看模型, 聆聽音樂', ''],
                    ['nmp_nmp_000_202504041133_0000_001', 'nmp', 'sam20000_02', '1-3', '2025-04-04T11:33:17.577+08:00', '2025-04-04T11:33:19.519+08:00', 1, '', 0, '觀看模型', ''],
                    ['nmp_nmp_000_202504041133_0000_000', 'nmp', 'sam20000_02', '2-2', '2025-04-04T11:33:12.027+08:00', '2025-04-04T11:33:16.212+08:00', 4, '', 0, '觀看告示牌', ''],
                    ['nmp_nmp_000_202504041133_0000_002', 'nmp', 'sam20000_02', '3-1', '2025-04-04T11:33:21.611+08:00', '2025-04-04T11:33:23.431+08:00', 1, '', 0, '觀看告示牌', ''],
                    ['nmp_nmp_000_202504072019_0000_009', 'nmp', '0000', '3-1', '2025-04-07T20:19:38.279+08:00', '2025-04-07T20:19:42.683+08:00', 4, '', 0, '其他', ''],
                    ['nmp_nmp_000_202504072019_0000_008', 'nmp', '0000', '2-3', '2025-04-07T20:19:35.002+08:00', '2025-04-07T20:19:36.509+08:00', 1, '', 0, '觀看模型', ''],
                    ['nmp_nmp_000_202504072019_0000_007', 'nmp', '0000', '1-3', '2025-04-07T20:19:32.050+08:00', '2025-04-07T20:19:33.919+08:00', 1, '', 0, '觀看告示牌', ''],
                    ['nmp_nmp_000_202504072019_0000_006', 'nmp', '0000', '2-4', '2025-04-07T20:19:28.983+08:00', '2025-04-07T20:19:30.977+08:00', 1, '', 0, '觀看展品', ''],
                    ['nmp_nmp_000_202504072019_0000_005', 'nmp', '0000', '2-1', '2025-04-07T20:19:25.883+08:00', '2025-04-07T20:19:27.401+08:00', 1, '', 0, '觀看模型', ''],
                    ['nmp_nmp_000_202504072019_0000_004', 'nmp', '0000', '1-2', '2025-04-07T20:19:20.235+08:00', '2025-04-07T20:19:25.035+08:00', 4, '', 0, '觀看影片', ''],
                    ['nmp_nmp_000_202504072019_0000_003', 'nmp', '0000', '3-1', '2025-04-07T20:19:15.907+08:00', '2025-04-07T20:19:17.538+08:00', 1, '', 0, '聆聽音樂', ''],
                    ['nmp_nmp_000_202504072019_0000_002', 'nmp', '0000', '4-1', '2025-04-07T20:19:12.338+08:00', '2025-04-07T20:19:14.268+08:00', 1, '', 0, '觀看展品', ''],
                    ['nmp_nmp_000_202504072019_0000_001', 'nmp', '0000', '5-3', '2025-04-07T20:19:09.321+08:00', '2025-04-07T20:19:11.479+08:00', 2, '', 0, '觀看展品', ''],
                    ['nmp_nmp_000_202504072019_0000_000', 'nmp', '0000', '6-2', '2025-04-07T20:19:05.945+08:00', '2025-04-07T20:19:08.089+08:00', 2, '', 0, '觀看告示牌', ''],
                    ['nmp_nmp_000_202504072019_0000_010', 'nmp', '0000', '2-4', '2025-04-07T20:19:43.640+08:00', '2025-04-07T20:19:52.769+08:00', 9, '', 0, '拍照, 錄音, 錄影, 筆記', ''],
                    ['nmp_nmp_000_202504072019_0000_010', 'nmp', '0000', '2-4', '2025-04-07T20:19:43.640+08:00', '2025-04-07T20:19:52.769+08:00', 9, '', 0, '拍照, 錄音, 錄影, 筆記', '']
                ];
                
                // 保存表頭
                const visitorHeaders = defaultDataVInFo[0];
                const interactionHeaders = defaultDataVInteractions[0];
                
                // 分離表頭和資料行
                const visitorRows = defaultDataVInFo.slice(1);
                const interactionRows = defaultDataVInteractions.slice(1);
                
                // 步驟1: 套用日期篩選
                const dateFilteredVisitorRows = this.filterDataByDateRange(visitorRows, visitorHeaders);
                const dateFilteredInteractionRows = this.filterDataByDateRange(interactionRows, interactionHeaders);
                
                // 步驟2: 套用博物館篩選
                const filteredVisitorRows = dateFilteredVisitorRows.filter(row => {
                    if (!row || row.length === 0) return false;
                    const recordId = row[1]; // recordId 在第二列
                    // 支援新的 nmp_nmp_000_ 格式和舊的 nmp_ 格式
                    return recordId && (
                        recordId.includes(`${this.filters.museum}_`) || 
                        recordId.startsWith(`${this.filters.museum}_`) ||
                        recordId.includes(`${this.filters.museum}_${this.filters.museum}_`)
                    );
                });
                
                const filteredInteractionRows = dateFilteredInteractionRows.filter(row => {
                    if (!row || row.length === 0) return false;
                    const museumId = row[1]; // museumId 在第二列
                    return museumId === this.filters.museum;
                });
                
                // 重新組合表頭和過濾後的數據
                const filteredVisitorInfo = [visitorHeaders, ...filteredVisitorRows];
                const filteredInteractions = [interactionHeaders, ...filteredInteractionRows];
                
                this.dataCache.visitorInfo = filteredVisitorInfo;
                this.dataCache.interactions = filteredInteractions;
                
                console.log('已載入測試環境模擬數據');
                console.log(`篩選後的訪客資料: ${filteredVisitorRows.length} 筆`);
                console.log(`篩選後的互動資料: ${filteredInteractionRows.length} 筆`);
                
                this.renderDashboard();
                this.showLoadingState(false);
            }, 500);
        }
    },
    
    // 處理時間範圍篩選邏輯
    processTimeRangeFilter: function() {
        // 如果是自訂日期且已設置日期範圍，保留當前設置
        if (this.filters.customDateActive && this.filters.dateFrom && this.filters.dateTo) {
            console.log(`使用自訂日期範圍: ${this.filters.dateFrom} 到 ${this.filters.dateTo}`);
            return;
        }
        
        // 獲取當前時間（台灣時區）
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth(); // 0-11
        const date = now.getDate();
        
        // 根據時間範圍設置開始和結束日期
        switch (this.filters.timeRange) {
            case 'day':
                // 今天的數據（當天00:00:00到23:59:59）
                const todayStart = new Date(year, month, date);
                const todayEnd = new Date(year, month, date, 23, 59, 59, 999);
                
                this.filters.dateFrom = this.formatDateForFilter(todayStart);
                this.filters.dateTo = this.formatDateForFilter(todayEnd);
                console.log(`已設置日期範圍為今天: ${this.filters.dateFrom} 到 ${this.filters.dateTo}`);
                break;
            
            case 'week':
                // 本週數據（從本週日到本週六）
                const currentDayOfWeek = now.getDay(); // 0=週日, 6=週六
                const firstDayOfWeek = new Date(year, month, date - currentDayOfWeek);
                const lastDayOfWeek = new Date(year, month, date + (6 - currentDayOfWeek), 23, 59, 59, 999);
                
                this.filters.dateFrom = this.formatDateForFilter(firstDayOfWeek);
                this.filters.dateTo = this.formatDateForFilter(lastDayOfWeek);
                console.log(`已設置日期範圍為本週: ${this.filters.dateFrom} 到 ${this.filters.dateTo}`);
                break;
            
            case 'month':
                // 本月數據（從本月1日到本月最後一天）
                const firstDayOfMonth = new Date(year, month, 1);
                const lastDayOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);
                
                this.filters.dateFrom = this.formatDateForFilter(firstDayOfMonth);
                this.filters.dateTo = this.formatDateForFilter(lastDayOfMonth);
                console.log(`已設置日期範圍為本月: ${this.filters.dateFrom} 到 ${this.filters.dateTo}`);
                break;
            
            case 'all':
            default:
                // 顯示所有數據，清除日期範圍
                this.filters.dateFrom = '';
                this.filters.dateTo = '';
                console.log('已設置為顯示所有時間範圍的數據');
                break;
        }
    },
    
    // 將Date對象格式化為YYYY-MM-DD格式（適用於篩選）
    formatDateForFilter: function(date) {
        if (!date || !(date instanceof Date)) {
            return '';
        }
        
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    },
    
    // 從recordId中解析日期 (格式如: A_B_202503301547_0000_362)
    parseVisitorIdDate: function(recordId) {
        try {
            // 支援不同格式的recordId
            if (recordId && recordId.includes('_20')) {
                // 使用正則表達式來匹配格式內的日期部分
                const match = recordId.match(/20\d{8}/);
                if (match) {
                    const dateString = match[0];
                    const year = parseInt(dateString.substring(0, 4));
                    const month = parseInt(dateString.substring(4, 6)) - 1; // 月份從0開始
                    const day = parseInt(dateString.substring(6, 8));
                    
                    // 驗證日期的有效性
                    if (!isNaN(year) && !isNaN(month) && !isNaN(day) && 
                        month >= 0 && month < 12 && day >= 1 && day <= 31) {
                        // 進一步檢查日期有效性（考慮月份天數）
                        const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
                        // 處理閏年二月
                        if (month === 1 && ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0)) {
                            if (day <= 29) {
                                return { year, month, day };
                            }
                        } else if (day <= daysInMonth[month]) {
                            return { year, month, day };
                        }
                    }
                }
            }
        } catch (e) {
            console.error('解析recordId日期錯誤:', e, recordId);
        }
        
        // 無法解析日期時，返回月份為12（無效）
        return { month: 12 };
    },
    
    // 根據設定的日期範圍篩選資料
    filterDataByDateRange: function(data, headers) {
        // 如果沒有設置日期範圍，返回所有資料
        if (!this.filters.dateFrom && !this.filters.dateTo) {
            return data;
        }
        
        // 找出recordId欄位的位置
        const recordIdIdx = headers.indexOf('recordId');
        if (recordIdIdx === -1) {
            console.warn('無法找到recordId欄位，日期篩選無法應用');
            return data;
        }
        
        // 解析日期範圍 - 只保留年月日部分
        let fromDateObj = null;
        let toDateObj = null;
        
        if (this.filters.dateFrom) {
            const fromParts = this.filters.dateFrom.split('-');
            if (fromParts.length === 3) {
                // 創建日期物件但只用年月日
                fromDateObj = new Date(
                    parseInt(fromParts[0]), 
                    parseInt(fromParts[1]) - 1, 
                    parseInt(fromParts[2])
                );
            }
        }
        
        if (this.filters.dateTo) {
            const toParts = this.filters.dateTo.split('-');
            if (toParts.length === 3) {
                // 創建日期物件但只用年月日
                toDateObj = new Date(
                    parseInt(toParts[0]), 
                    parseInt(toParts[1]) - 1, 
                    parseInt(toParts[2])
                );
            }
        }
        
        console.log(`應用日期範圍篩選: ${this.filters.dateFrom || '不限'} 至 ${this.filters.dateTo || '不限'}`);
        
        // 篩選符合日期範圍的資料
        return data.filter(row => {
            if (!row || row.length === 0) return false;
            
            const recordId = row[recordIdIdx];
            const dateInfo = this.parseVisitorIdDate(recordId);
            
            // 如果無法解析日期，排除此筆資料
            if (!dateInfo || dateInfo.month === 12) return false;
            
            // 只創建年月日部分的日期物件
            const rowDateObj = new Date(dateInfo.year, dateInfo.month, dateInfo.day);
            
            // 只比較日期部分(忽略時間部分)
            let withinRange = true;
            if (fromDateObj) {
                // 比較年月日部分
                withinRange = withinRange && (
                    rowDateObj.getFullYear() > fromDateObj.getFullYear() || 
                    (rowDateObj.getFullYear() === fromDateObj.getFullYear() && 
                     rowDateObj.getMonth() > fromDateObj.getMonth()) ||
                    (rowDateObj.getFullYear() === fromDateObj.getFullYear() && 
                     rowDateObj.getMonth() === fromDateObj.getMonth() &&
                     rowDateObj.getDate() >= fromDateObj.getDate())
                );
            }
            
            if (toDateObj) {
                // 比較年月日部分
                withinRange = withinRange && (
                    rowDateObj.getFullYear() < toDateObj.getFullYear() || 
                    (rowDateObj.getFullYear() === toDateObj.getFullYear() && 
                     rowDateObj.getMonth() < toDateObj.getMonth()) ||
                    (rowDateObj.getFullYear() === toDateObj.getFullYear() && 
                     rowDateObj.getMonth() === toDateObj.getMonth() &&
                     rowDateObj.getDate() <= toDateObj.getDate())
                );
            }
            
            return withinRange;
        });
    },
    
   
    // 顯示/隱藏載入狀態
    processVisitorInteractionsData: function() {
        let result = {
            visitorCount: 0,
            interactionCount: 0,  // 改為 interactionCount，表示互動記錄數量
            totalStayTime: 0,
            averageStayTime: 0,
            visitorTrend: Array(12).fill(0), // 12個月的實際訪客數據
            invalidDateCount: 0, // 新增：無效日期的訪客數量
            popularAreas: [],
            interactionCounts: {}, // 互動行為次數
            visitorLocations: {}  // 訪客居住地分布
        };
        
        // 取得緩存數據
        const visitorInfo = this.dataCache.visitorInfo;
        const interactions = this.dataCache.interactions;
        
        // 檢查數據有效性
        if (!visitorInfo || visitorInfo.length <= 1 || !interactions || interactions.length <= 1) {
            // 確保返回空陣列而不是空對象
            result.popularAreas = [];
            result.visitorLocations = [];
            result.interactionCounts = [];
            return result; // 返回默認值
        }
        
        // 解析訪客訊息
        //indexOf() 是 JavaScript 陣列的標準方法，用於查找指定元素在陣列中第一次出現的索引位置。
        // 如果找到元素，返回其索引值（從0開始計數）；如果元素不存在於陣列中，
        // 則返回 -1。在這段代碼中，它用來找出 'visitorId' 在表頭陣列中的位置，以便後續能正確存取對應欄位的數據。
        const visitorHeaders = visitorInfo[0];
        const visitorIdIdx = visitorHeaders.indexOf('visitorId');
        const recordIdIdx = visitorHeaders.indexOf('recordId');
        const formVersionIdx = visitorHeaders.indexOf('formVersion');
        const genderIdx = visitorHeaders.indexOf('gender');
        const ageGroupIdx = visitorHeaders.indexOf('ageGroup');
        const educationIdx = visitorHeaders.indexOf('education');
        const residenceIdx = visitorHeaders.indexOf('residence');
        const visitPurposeIdx = visitorHeaders.indexOf('visitPurpose');
        const visitFrequencyIdx = visitorHeaders.indexOf('visitFrequency');
        const consentIdx = visitorHeaders.indexOf('consent');
        const totalSecondsIdx = visitorHeaders.indexOf('totalSeconds');
        const visitorCompositionIdx = visitorHeaders.indexOf('visitorComposition');
        
        // 解析互動數據
        const interactionHeaders = interactions[0];
        const interactionRecordIdIdx = interactionHeaders.indexOf('recordId');
        const pointIdIdx = interactionHeaders.indexOf('pointId');
        const staySecondsIdx = interactionHeaders.indexOf('staySeconds');
        const interactionTypeIdx = interactionHeaders.indexOf('interactionType');
        const museumIdIdx = interactionHeaders.indexOf('museumId');
        const exhibitIdIdx = interactionHeaders.indexOf('exhibitId');
        const exhibitNameIdx = interactionHeaders.indexOf('exhibitName');
        
        // 統計數據
        const visitorIds = new Set();
        const interactionIds = new Set(); // 用於統計不重複的互動記錄ID
        let totalStayTime = 0;
        const areaCountMap = {};
        const interactionTypeMap = {};
        const residenceMap = {};
        const monthlyVisitors = Array(13).fill(0); // 13個月的數據（第13個用於存儲無效日期）
        
        // 處理訪客訊息數據
        for (let i = 1; i < visitorInfo.length; i++) {
            const row = visitorInfo[i];
            if (!row || row.length === 0) continue;
            
            // 訪客ID統計
            if (visitorIdIdx >= 0 && row[visitorIdIdx]) {
                visitorIds.add(row[visitorIdIdx]);
            }
            
            // 總停留時間
            if (totalSecondsIdx >= 0 && !isNaN(parseInt(row[totalSecondsIdx]))) {
                totalStayTime += parseInt(row[totalSecondsIdx]);
            }
            
            // 訪客趨勢數據（按月份）
            if (recordIdIdx >= 0 && row[recordIdIdx]) {
                const recordId = row[recordIdIdx];
                const dateInfo = this.parseVisitorIdDate(recordId);
                
                // 增加對應月份的訪客數（包括無效月份）
                if (dateInfo && dateInfo.month !== undefined) {
                    monthlyVisitors[dateInfo.month]++;
                } else {
                    // 無法解析日期時，計入無效月份
                    monthlyVisitors[12]++;
                }
            }
            
            // 互動行為統計
            if (visitPurposeIdx >= 0 && row[visitPurposeIdx]) {
                const purposes = row[visitPurposeIdx].split(', ');
                purposes.forEach(purpose => {
                    interactionTypeMap[purpose] = (interactionTypeMap[purpose] || 0) + 1;
                });
            }
            
            // 居住地統計
            if (residenceIdx >= 0 && row[residenceIdx]) {
                const residence = row[residenceIdx];
                residenceMap[residence] = (residenceMap[residence] || 0) + 1;
            }
        }
        
        // 處理互動數據
        for (let i = 1; i < interactions.length; i++) {
            const row = interactions[i];
            if (!row || row.length === 0) continue;
            
            // 收集不重複的互動記錄ID
            if (interactionRecordIdIdx >= 0 && row[interactionRecordIdIdx]) {
                interactionIds.add(row[interactionRecordIdIdx]);
            }
            
            // 熱門區域統計
            if (pointIdIdx >= 0 && row[pointIdIdx]) {
                // 使用互動數據中的pointId作為區域標識
                const areaName = row[pointIdIdx];
                areaCountMap[areaName] = (areaCountMap[areaName] || 0) + 1;
            } else if (exhibitNameIdx >= 0 && row[exhibitNameIdx]) {
                // 備用：使用互動數據中的展品名稱
                const areaName = row[exhibitNameIdx];
                areaCountMap[areaName] = (areaCountMap[areaName] || 0) + 1;
            } else if (exhibitIdIdx >= 0 && row[exhibitIdIdx]) {
                // 備用：使用互動數據中的展品ID
                const areaName = row[exhibitIdIdx];
            areaCountMap[areaName] = (areaCountMap[areaName] || 0) + 1;
            }
            
            // 互動類型統計（互動數據表中）
            if (interactionTypeIdx >= 0 && row[interactionTypeIdx]) {
                const types = row[interactionTypeIdx].split(', ');
                types.forEach(type => {
                    if (type && type.trim() !== '') {
                        interactionTypeMap[type] = (interactionTypeMap[type] || 0) + 1;
                    }
                });
            }
        }
        
        // 計算結果
        result.visitorCount = visitorIds.size;
        result.interactionCount = interactionIds.size; // 設置互動記錄數量為不重複ID的數量
        result.totalStayTime = totalStayTime;
        result.averageStayTime = result.visitorCount > 0 ? Math.floor(totalStayTime / result.visitorCount) : 0;
        result.invalidDateCount = monthlyVisitors[12]; // 記錄無效日期的數量
        result.visitorTrend = monthlyVisitors.slice(0, 12); //0-11 12個月
        
        // 處理熱門區域數據
        result.popularAreas = Object.entries(areaCountMap)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 15); // 取前15個最熱門區域
        
        // 處理訪客趨勢數據 - 只使用有效月份資料（0-11）

        
        // 處理互動行為次數
        result.interactionCounts = Object.entries(interactionTypeMap)
            .map(([type, count]) => ({ type, count }))
            .sort((a, b) => b.count - a.count);
        
        // 處理訪客居住地分布
        result.visitorLocations = Object.entries(residenceMap)
            .map(([location, count]) => ({ location, count }))
            .sort((a, b) => b.count - a.count);
        
        // 確保所有結果屬性都是正確的類型
        if (!Array.isArray(result.visitorLocations)) {
            result.visitorLocations = [];
            console.warn('訪客居住地數據不是陣列，已重置為空陣列');
        }
        
        if (!Array.isArray(result.popularAreas)) {
            result.popularAreas = [];
            console.warn('熱門區域數據不是陣列，已重置為空陣列');
        }
        
        if (!Array.isArray(result.interactionCounts)) {
            result.interactionCounts = [];
            console.warn('互動行為數據不是陣列，已重置為空陣列');
        }
        
        return result;
    },
    
    // 顯示/隱藏載入狀態
    showLoadingState: function(isLoading) {
        // 優化卡片載入狀態，支援不同結構的卡片元素
        try {
            // 查找所有卡片文本元素
            const cards = document.querySelectorAll('.card-text, .dashboard-card .fw-bold');
            
        cards.forEach(card => {
            if (isLoading) {
                    // 保存原始文本到數據屬性
                card.dataset.originalText = card.textContent;
                    // 替換為載入指示器
                card.innerHTML = '<div class="spinner-border spinner-border-sm text-secondary" role="status"><span class="visually-hidden">Loading...</span></div>';
            } else if (card.dataset.originalText) {
                    // 恢復原始文本
                card.textContent = card.dataset.originalText;
                delete card.dataset.originalText;
            }
        });
            
            // 設置全局超時，確保即使有錯誤也能恢復卡片狀態
            if (isLoading) {
                this._loadingTimeout = setTimeout(() => {
                    if (document.querySelectorAll('.card-text .spinner-border, .dashboard-card .fw-bold .spinner-border').length > 0) {
                        console.warn('載入狀態超時，強制恢復卡片顯示');
                        this.showLoadingState(false);
                    }
                }, 1000000); // 10秒後如果仍在載入狀態，則強制恢復
            } else if (this._loadingTimeout) {
                clearTimeout(this._loadingTimeout);
                this._loadingTimeout = null;
            }
        } catch (error) {
            console.error('更新載入狀態時發生錯誤:', error);
            // 嘗試恢復所有卡片狀態
            document.querySelectorAll('.card-text, .dashboard-card .fw-bold').forEach(card => {
                if (card.dataset.originalText) {
                    card.textContent = card.dataset.originalText;
                }
            });
        }
    },
    
    // 渲染儀表板
    renderDashboard: function() {
        try {
            // 處理數據
            const processedData = this.processVisitorInteractionsData();
            
            // 輸出詳細的數據日誌，用於核對
            console.group('儀表板數據日誌 - ' + new Date().toLocaleString());
            console.log('數據概要:', {
                訪客數量: processedData.visitorCount || 0,
                記錄數量: processedData.interactionCount || 0,
                總停留時間: processedData.totalStayTime || 0,
                平均停留時間: processedData.averageStayTime || 0,
                無效日期數量: processedData.invalidDateCount || 0
            });
            
            // 格式化總停留時間（秒轉為時:分:秒）
            const totalSeconds = processedData.totalStayTime || 0;
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;
            const formattedTime = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            // 計算平均停留時間
            const avgSeconds = processedData.visitorCount > 0 
                ? Math.floor(totalSeconds / processedData.visitorCount) 
                : 0;
            const avgHours = Math.floor(avgSeconds / 3600);
            const avgMinutes = Math.floor((avgSeconds % 3600) / 60);
            const avgRemainSeconds = avgSeconds % 60;
            const formattedAvgTime = `${avgHours}:${avgMinutes.toString().padStart(2, '0')}:${avgRemainSeconds.toString().padStart(2, '0')}`;
            
            // 記錄卡片數據
            console.log('卡片顯示數據:', {
                訪客數量: processedData.visitorCount || 0,
                記錄數量: processedData.interactionCount || 0,
                總停留時間: formattedTime,
                平均停留時間: formattedAvgTime
            });
            
            // 記錄圖表數據摘要，添加數組類型檢查
            console.log('訪客趨勢數據:', Array.isArray(processedData.visitorTrend) ? processedData.visitorTrend : []);
            console.log('居住地分布(前5項):', Array.isArray(processedData.visitorLocations) ? processedData.visitorLocations.slice(0, 5) : []);
            console.log('熱門展區(前5項):', Array.isArray(processedData.popularAreas) ? processedData.popularAreas.slice(0, 5) : []);
            console.log('互動行為(前5項):', Array.isArray(processedData.interactionCounts) ? processedData.interactionCounts.slice(0, 5) : []);
            
            // 顯示無效日期比例
            if (processedData.visitorCount > 0) {
                const invalidPercentage = (processedData.invalidDateCount / processedData.visitorCount * 100).toFixed(2);
                console.log(`無效日期統計: ${processedData.invalidDateCount}筆 (佔總訪客${invalidPercentage}%)`);
                
                // 更新數據品質報告
                const invalidDateCountElement = document.getElementById('invalidDateCount');
                const invalidDatePercentageElement = document.getElementById('invalidDatePercentage');
                
                if (invalidDateCountElement) {
                    invalidDateCountElement.textContent = processedData.invalidDateCount || 0;
                }
                
                if (invalidDatePercentageElement) {
                    invalidDatePercentageElement.textContent = invalidPercentage + '%';
                }
                
                // 根據無效數據比例設置警告級別
                const alertElement = document.querySelector('.alert');
                if (alertElement) {
                    // 根據無效數據百分比調整警告級別
                    if (invalidPercentage > 10) {
                        alertElement.classList.remove('alert-info');
                        alertElement.classList.add('alert-danger');
                    } else if (invalidPercentage > 5) {
                        alertElement.classList.remove('alert-info');
                        alertElement.classList.add('alert-warning');
                    } else {
                        alertElement.classList.remove('alert-warning', 'alert-danger');
                        alertElement.classList.add('alert-info');
                    }
                }
            }
            
            console.groupEnd();
            
            // 更新卡片數據，添加元素存在性檢查
            const visitorCountElement = document.getElementById('visitorCountCard');
            if (visitorCountElement) {
                visitorCountElement.textContent = processedData.visitorCount || 0;
            }
            
            const interactionCountCardElement = document.getElementById('interactionCountCard');
            if (interactionCountCardElement) {
                interactionCountCardElement.textContent = processedData.interactionCount || 0;
            }
            
            const totalStayTimeElement = document.getElementById('totalStayTimeCard');
            if (totalStayTimeElement) {
                totalStayTimeElement.textContent = formattedTime;
            }
            
            // 更新平均停留時間
            const avgStayTimeElement = document.getElementById('averageStayTimeCard');
            if (avgStayTimeElement) {
                avgStayTimeElement.textContent = formattedAvgTime;
            }
        
        // 輸出無效日期數量
        console.log(`訪客趨勢圖表中的無效日期數量: ${processedData.invalidDateCount || 0}`);
        
        // 更新圖表，確保傳遞有效的數據
        this.updateVisitorTrendChart(Array.isArray(processedData.visitorTrend) ? processedData.visitorTrend : []);
        this.updatePopularAreasChart(Array.isArray(processedData.visitorLocations) ? processedData.visitorLocations : []); // 位置已對調，這裡顯示的是居住地分布
        this.updateHotAreasChart(Array.isArray(processedData.popularAreas) ? processedData.popularAreas : []); // 熱門展區
        this.updateInteractionChart(Array.isArray(processedData.interactionCounts) ? processedData.interactionCounts : []);
        } catch (error) {
            console.error('渲染儀表板時發生錯誤:', error);
            // 確保載入狀態被移除，即使發生錯誤
            this.showLoadingState(false);
        }
    },
    
    // 更新訪客趨勢圖表
    updateVisitorTrendChart: function(trendData) {
        const ctx = document.getElementById('visitorTrendChart');
        if (!ctx) return;
        
        // 確保 trendData 是陣列
        if (!Array.isArray(trendData)) {
            console.warn('訪客趨勢數據不是陣列，無法更新圖表');
            trendData = Array(12).fill(0);
        }
        
        // 使用Chart.js更新圖表
        if (window.Chart && trendData) {
            if (ctx.chart) {
                ctx.chart.destroy();
            }
            
            ctx.chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
                    datasets: [{
                        label: '訪客數',
                        data: trendData,
                        fill: true,
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        tension: 0.3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
    },
    
    // 更新訪客居住地圓餅圖
    updatePopularAreasChart: function(locationData) {
        const ctx = document.getElementById('popularAreasChart');
        if (!ctx) return;
        
        // 確保 locationData 是陣列
        if (!Array.isArray(locationData)) {
            console.warn('訪客居住地數據不是陣列，無法更新圖表');
            locationData = [];
        }
        
        // 使用Chart.js更新圖表
        if (window.Chart && locationData && locationData.length > 0) {
            if (ctx.chart) {
                ctx.chart.destroy();
            }
            
            // 準備圖表數據
            const labels = locationData.map(item => item.location);
            const counts = locationData.map(item => item.count);
            
            // 生成隨機顏色
            const backgroundColors = labels.map(() => 
                `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.5)`
            );
            
            ctx.chart = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: labels,
                    datasets: [{
                        label: '訪客數',
                        data: counts,
                        backgroundColor: backgroundColors,
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }
    },

    // 更新熱門展區圖表
    updateHotAreasChart: function(areasData) {
        const ctx = document.getElementById('visitorLocationChart');
        if (!ctx) return;
        
        // 確保 areasData 是陣列
        if (!Array.isArray(areasData)) {
            console.warn('熱門展區數據不是陣列，無法更新圖表');
            areasData = [];
        }
        
        // 使用Chart.js更新圖表
        if (window.Chart && areasData && areasData.length > 0) {
            if (ctx.chart) {
                ctx.chart.destroy();
            }
            
            ctx.chart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: areasData.map(area => area.name),
                    datasets: [{
                        label: '記錄數',
                        data: areasData.map(area => area.count),
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.5)',
                            'rgba(54, 162, 235, 0.5)',
                            'rgba(255, 206, 86, 0.5)',
                            'rgba(75, 192, 192, 0.5)',
                            'rgba(153, 102, 255, 0.5)'
                        ],
                        borderColor: [
                            'rgba(255, 99, 132, 1)',
                            'rgba(54, 162, 235, 1)',
                            'rgba(255, 206, 86, 1)',
                            'rgba(75, 192, 192, 1)',
                            'rgba(153, 102, 255, 1)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
    },
    
    // 更新互動行為次數圖表
    updateInteractionChart: function(interactionData) {
        const ctx = document.getElementById('interactionCountChart');
        if (!ctx) return;
        
        // 確保 interactionData 是陣列
        if (!Array.isArray(interactionData)) {
            console.warn('互動行為數據不是陣列，無法更新圖表');
            interactionData = [];
        }
        
        if (window.Chart && interactionData && interactionData.length > 0) {
            if (ctx.chart) {
                ctx.chart.destroy();
            }
            
            // 準備圖表數據
            const labels = interactionData.map(item => item.type);
            const counts = interactionData.map(item => item.count);
            
            ctx.chart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: '次數',
                        data: counts,
                        backgroundColor: 'rgba(54, 162, 235, 0.5)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        }

                    }
                }
            });
        }
    },
    
    // 匯出儀表板報表
    exportDashboard: function() {
        alert('匯出儀表板報表功能尚未實現');
    }
};

// 導出模組
// 在瀏覽器環境中，將模組附加到全局App對象
if (typeof window !== 'undefined' && window.App) {
    window.App.dashboardModule = DashboardModule;
}

// 在Node.js環境中(測試環境)，將模組導出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardModule;
} 

