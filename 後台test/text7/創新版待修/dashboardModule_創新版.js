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
        timeRange: 'day',
        museum: '',
        exhibition: '',
        gender: ''
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
        // 時間範圍選擇
        document.querySelectorAll('#timeRangeSelector .btn').forEach(btn => {
            btn.addEventListener('click', e => {
                document.querySelectorAll('#timeRangeSelector .btn').forEach(b => 
                    b.classList.remove('active'));
                e.target.classList.add('active');
                this.filters.timeRange = e.target.getAttribute('data-range');
                this.loadData();
            });
        });
        
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
        
        // 性別篩選器
        const genderSelector = document.getElementById('genderSelector');
        if (genderSelector) {
            genderSelector.addEventListener('change', e => {
                this.filters.gender = e.target.value;
                this.loadData();
            });
        }
    },
    
    // 載入篩選器選項
    loadFilterOptions: function() {
        // 載入博物館選項
        if (typeof google !== 'undefined' && google.script) {
            google.script.run
                .withSuccessHandler(data => {
                    this.renderMuseumOptions(data);
                })
                .getDataMuseums();
        } else {
            // 測試環境使用模擬數據
            setTimeout(() => {
                const museums = [
                    {id: 'nmp', name: '國立史前文化博物館'}
                ];
                this.renderMuseumOptions(museums);
            }, 300);
        }
    },
    
    // 渲染博物館選項
    renderMuseumOptions: function(museums) {
        // 實現博物館選項渲染邏輯
        console.log('載入博物館選項:', museums);
        
        const selector = document.getElementById('museumSelector');
        if (selector) {
            // 清空現有選項
            selector.innerHTML = '<option value="">所有博物館</option>';
            
            // 添加博物館選項
            museums.forEach(museum => {
                const option = document.createElement('option');
                option.value = museum.id || museum[0];
                option.textContent = museum.name || museum[1] || museum[0];
                selector.appendChild(option);
            });
        }
    },
    
    // 載入儀表板數據
    loadData: function(forceRefresh = false) {
        // 顯示載入指示器
        this.showLoadingState(true);
        
        // 從服務器獲取數據或使用測試數據
        if (typeof google !== 'undefined' && google.script) {
            // 使用計數器跟踪兩個請求的完成情況
            let requestsCompleted = 0;
            
            // 獲取訪客信息數據
            google.script.run
                .withSuccessHandler(data => {
                    this.dataCache.visitorInfo = data;
                    requestsCompleted++;
                    
                    // 當兩個請求都完成時，渲染儀表板
                    if (requestsCompleted === 2) {
                        this.renderDashboard();
                    this.showLoadingState(false);
                    }
                })
                .withFailureHandler(error => {
                    console.error('載入訪客信息失敗:', error);
                    requestsCompleted++;
                    
                    if (requestsCompleted === 2) {
                    this.showLoadingState(false);
                    }
                })
                .getDataVInfo();
                
            // 獲取互動數據
            google.script.run
                .withSuccessHandler(data => {
                    this.dataCache.interactions = data;
                    requestsCompleted++;
                    
                    // 當兩個請求都完成時，渲染儀表板
                    if (requestsCompleted === 2) {
                        this.renderDashboard();
                        this.showLoadingState(false);
                    }
                })
                .withFailureHandler(error => {
                    console.error('載入互動數據失敗:', error);
                    requestsCompleted++;
                    
                    if (requestsCompleted === 2) {
                        this.showLoadingState(false);
                    }
                })
                .getDataVInteractions();
        } else {
            // 測試環境使用模擬數據庫
            setTimeout(() => {
                // 使用默認值作為後備
                const defaultDataVInFo =[[ 'visitorId',
                    'recordId',
                    'formVersion',
                    'gender',
                    'ageGroup',
                    'education',
                    'residence',
                    'visitPurpose',
                    'visitFrequency',
                    'consent',
    'totalSeconds',
    'visitorComposition' ],
  [ 'N_00_02_KS_ 3500',
                    'A_B_202503282148_0000_285',
                    1,
                    '非二元性別',
                    '0-12',
                    '國中',
                    '高雄市',
                    '休閒',
                    '每年5-6次',
                    true,
    8,
    ' 家庭 ' ],
  [ 'N_00_02_KS_ 5248',
                    'A_B_202503282149_0000_745',
                    1,
                    '非二元性別',
                    '0-12',
                    '國中',
                    '高雄市',
                    '休閒',
                    '每年5-6次',
                    true,
    17,
    '團體 ' ],
  [ 'D_19_02_TN_ 2342',
                    'A_B_202503292304_0000_352',
                    1,
                    '不願透漏',
                    '19-24',
                    '國中',
                    '台南市',
                    '學習',
                    '每年13次以上',
                    true,
    5,
    '獨自' ],
  [ 'D_19_02_TN_ 8224',
                    'A_B_202503292307_0000_704',
                    1,
                    '不願透漏',
                    '19-24',
                    '國中',
                    '台南市',
                    '學習',
                    '每年13次以上',
                    true,
    188,
    ' 家庭 ' ],
  [ 'N_19_01_PT_ 1796',
                    'A_B_202503292330_0000_065',
                    1,
                    '非二元性別',
                    '19-24',
                    '國小或以下',
                    '屏東縣',
                    '休閒',
                    '每年5-6次',
                    true,
    2,
    '團體 ' ],
  [ 'N_19_01_PT_ 7198',
                    'A_B_202503292340_0000_102',
                    1,
                    '非二元性別',
                    '19-24',
                    '國小或以下',
                    '屏東縣',
                    '休閒',
                    '每年5-6次',
                    true,
    2,
    '獨自' ],
  [ 'N_25_04_TT_ 6711',
                    'A_B_202503292344_0000_195',
                    1,
                    '非二元性別',
                    '25-34',
                    '專科',
                    '台東縣',
                    '其他',
                    '每年1-2次',
                    true,
    31,
    ' 家庭 ' ],
  [ 'F_75_00_HS_ 8020',
                    'A_B_202503292349_0000_236',
                    1,
                    '生理女性',
                    '75-84',
                    '不願透漏',
                    '新竹市',
                    '其他',
                    '每年5-6次',
                    true,
    24,
    '團體 ' ],
  [ 'F_75_00_HS_ 8020',
                    'A_B_202503292349_0000_236',
                    1,
                    '生理女性',
                    '75-84',
                    '不願透漏',
                    '新竹市',
                    '其他',
                    '每年5-6次',
                    true,
    24,
    '獨自' ],
  [ 'F_75_00_HS_ 8020',
                    'A_B_202503292349_0000_236',
                    1,
                    '生理女性',
                    '75-84',
                    '不願透漏',
                    '新竹市',
                    '其他',
                    '每年5-6次',
                    true,
    24,
    ' 家庭 ' ],
  [ 'M_75_06_HS_ 3065',
                    'A_B_202503292351_0000_446',
                    1,
                    '生理男性',
                    '75-84',
                    '研究所',
                    '新竹市',
                    '休閒',
                    '每年3-4次',
                    true,
    31,
    '團體 ' ],
  [ 'M_13_03_CY_ 1971',
                    'A_B_202503301544_0000_754',
                    1,
                    '生理男性',
                    '13-18',
                    '高中/職',
                    '嘉義市',
                    '學習',
                    '每年1-2次',
                    true,
    53,
    '獨自' ],
  [ 'M_13_03_CY_ 2756',
                    'A_B_202503301547_0000_362',
                    1,
                    '生理男性',
                    '13-18',
                    '高中/職',
                    '嘉義市',
                    '學習',
                    '每年1-2次',
                    true,
    13,
    ' 家庭 ' ],
  [ 'O_65_06_HJ_ 5400',
                    'A_B_202503311807_0000_621',
                    1,
                    '其他',
                    '65-74',
                    '研究所',
                    '新竹縣',
                    '學習',
                    '每年3-4次',
                    true,
    26,
    '團體 ' ],
  [ 'D_13_02_CY_ 1694',
                    'A_B_202504011458_0000_634',
                    1,
                    '不願透漏',
                    '13-18',
                    '國中',
                    '嘉義縣',
                    '學習',
                    '每年1-2次',
                    true,
    8,
    '獨自' ],
  [ 'D_19_01_CY_ 4347',
                    'A_B_202504011631_0000_500',
                    1,
                    '不願透漏',
                    '19-24',
                    '國小或以下',
                    '嘉義市',
                    '學習',
                    '每年1-2次',
                    true,
    12,
    ' 家庭 ' ],
  [ 'M_25_06_TP_ 7694',
                    'A_B_202504011840_0000_231',
                    1,
                    '生理男性',
                    '25-34',
                    '研究所',
                    '台北市',
                    '學習, 休閒, 其他',
                    '每年13次以上',
                    true,
    144,
    '團體 ' ],
  [ 'M_25_06_TP_ 7425',
                    'A_B_202504011841_0000_059',
                    1,
                    '生理男性',
                    '25-34',
                    '研究所',
                    '台北市',
                    '學習, 休閒, 其他',
                    '每年13次以上',
                    true,
    144,
    '獨自' ],
  [ 'M_19_02_TY_ 8379',
                    'A_B_202504012039_0000_760',
                    1,
                    '生理男性',
                    '19-24',
                    '國中',
                    '桃園市',
                    '其他',
                    '每年3-4次',
                    true,
    0,
    ' 家庭 ' ],
  [ 'F_25_04_HL_ 1091',
                    'A_B_202504012041_0000_031',
                    1,
                    '生理女性',
                    '25-34',
                    '專科',
                    '花蓮縣',
                    '學習',
                    '每年9-10次',
                    true,
    53,
    '團體 ' ],
  [ 'N_19_02_NT_ 3956',
                    'A_B_202504012045_0000_981',
                    1,
                    '非二元性別',
                    '19-24',
                    '國中',
                    '南投縣',
                    '休閒',
                    '每年1-2次',
                    true,
    157,
    '獨自' ],
  [ 'O_19_02_KS_ 2420',
                    'A_B_202504041133_0000_791',
                    1,
                    '其他',
                    '19-24',
                    '國中',
                    '高雄市',
                    '學習',
                    '每年1-2次',
                    true,
    11,
    ' 家庭 ' ],
  [ 'D_95_00_DI_ 7766',
    'A_B_202504072019_0000_705',
    1,
    '不願透漏',
    '95以上',
    '不願透漏',
    '不願透漏',
    '學習, 其他',
    '不願透漏',
    true,
    47,
    ' 家庭 ' ],
  [ 'N_13_03_PH_ 7698',
    'A_B_202504072223_0000_820',
    1,
    '非二元性別',
    '13-18',
    '高中/職',
    '澎湖縣',
    '學習',
    '每年1-2次',
    true,
    4,
    '' ] ] ;
                const defaultDataVInteractions = [[ 'recordId',
                        'museumId',
                        'userId',
                        'pointId',
                        'arriveTime',
                        'leaveTime',
                        'staySeconds',
                        'totalSeconds ',
                        'interactionCount',
                        'interactionType',
                        'notes' ],
                  [ 'nmp_nmp_000_202503200931_015',
                        'nmp',
                        'sam20000_02',
                        '6-1',
                    '2025-03-20T09:31:47.016Z',
                    '2025-03-20T09:31:51.465Z',
                    4,
                        '',
                        0,
                    '觀看影片',
                        '' ],
                  [ 'A_B_202503200931_0000_001',
                        'nmp',
                        'sam20000_02',
                        '6-1',
                        '2025-03-20T09:31:47.016Z',
                        '2025-03-20T09:31:51.465Z',
                        4,
                        '',
                        0,
                        '觀看影片',
                        '' ],
                      [ 'nmp_nmp_000_202503240543_000',
                        'nmp',
                        'sam20000_02',
                        '1-2',
                        '2025-03-24T05:43:20.804Z',
                        '2025-03-24T05:43:31.934Z',
                        11,
                        '',
                        0,
                        '觀看展品',
                        '燦坤' ],
                        [ 'nmp_nmp_000_202503240543_000',
                            'nmp',
                            'sam20000_02',
                            '1-2',
                            '2025-03-24T05:43:20.804Z',
                            '2025-03-24T05:43:31.934Z',
                            11,
                            '',
                            0,
                            '觀看展品',
                            '燦坤' ],
                            [ 'nmp_nmp_000_202503240543_000',
                                'nmp',
                                'sam20000_02',
                                '1-2',
                                '2025-03-24T05:43:20.804Z',
                                '2025-03-24T05:43:31.934Z',
                                11,
                                '',
                                0,
                                '觀看展品',
                                '燦坤' ],
                                [ 'nmp_nmp_000_202503240543_000',
                                    'nmp',
                                    'sam20000_02',
                                    '1-2',
                                    '2025-03-24T05:43:20.804Z',
                                    '2025-03-24T05:43:31.934Z',
                                    11,
                                    '',
                                    0,
                                    '觀看展品',
                                    '燦坤' ],
                                    [ 'nmp_nmp_000_202503240543_000',
                                        'nmp',
                                        'sam20000_02',
                                        '1-2',
                                        '2025-03-24T05:43:20.804Z',
                                        '2025-03-24T05:43:31.934Z',
                                        11,
                                        '',
                                        0,
                                        '觀看展品',
                                        '燦坤' ],[ 'nmp_nmp_000_202503240543_000',
                                            'nmp',
                                            'sam20000_02',
                                            '1-2',
                                            '2025-03-24T05:43:20.804Z',
                                            '2025-03-24T05:43:31.934Z',
                                            11,
                                            '',
                                            0,
                                            '觀看展品',
                                            '燦坤' ],[ 'nmp_nmp_000_202503240543_000',
                                                'nmp',
                                                'sam20000_02',
                                                '1-2',
                                                '2025-03-24T05:43:20.804Z',
                                                '2025-03-24T05:43:31.934Z',
                                                11,
                                                '',
                                                0,
                                                '觀看展品',
                                                '燦坤' ],[ 'nmp_nmp_000_202503240543_000',
                                                    'nmp',
                                                    'sam20000_02',
                                                    '1-2',
                                                    '2025-03-24T05:43:20.804Z',
                                                    '2025-03-24T05:43:31.934Z',
                                                    11,
                                                    '',
                                                    0,
                                                    '觀看展品',
                                                    '燦坤' ],[ 'nmp_nmp_000_202503240543_000',
                                                        'nmp',
                                                        'sam20000_02',
                                                        '1-2',
                                                        '2025-03-24T05:43:20.804Z',
                                                        '2025-03-24T05:43:31.934Z',
                                                        11,
                                                        '',
                                                        0,
                                                        '觀看展品',
                                                        '燦坤' ],[ 'nmp_nmp_000_202503240543_000',
                                                            'nmp',
                                                            'sam20000_02',
                                                            '1-2',
                                                            '2025-03-24T05:43:20.804Z',
                                                            '2025-03-24T05:43:31.934Z',
                                                            11,
                                                            '',
                                                            0,
                                                            '觀看展品',
                                                            '燦坤' ],[ 'nmp_nmp_000_202503240543_000',
                                                                'nmp',
                                                                'sam20000_02',
                                                                '1-2',
                                                                '2025-03-24T05:43:20.804Z',
                                                                '2025-03-24T05:43:31.934Z',
                                                                11,
                                                                '',
                                                                0,
                                                                '觀看展品',
                                                                '燦坤' ],
                      [ 'nmp_nmp_000_202503240545_000',
                        'nmp',
                        'sam20000_02',
                        '1-1',
                        '2025-03-24T05:45:19.228Z',
                        '2025-03-24T05:45:30.087Z',
                        10,
                        '',
                        0,
                        '觀看告示牌, 聆聽導覽',
                        'iPad' ],
                      [ 'nmp_nmp_000_202503240545_000',
                        'nmp',
                        'sam20000_02',
                        '1-1',
                        '2025-03-24T05:45:19.228Z',
                        '2025-03-24T05:45:30.087Z',
                        10,
                        '',
                        0,
                        '觀看告示牌, 聆聽導覽',
                        'iPad' ],
                      [ 'nmp_nmp_000_202503311806_0000_001',
                        'nmp',
                        'sam20000_02',
                        '1-1',
                        '2025-03-31T18:06:46.985+08:00',
                        '2025-03-31T18:06:57.408+08:00',
                        10,
                        '',
                        0,
                        '其他',
                        'iphone' ],
                      [ 'nmp_nmp_000_202504011458_0000_001',
                        'nmp',
                        'sam20000_02',
                        '4-4',
                        '2025-04-01T14:58:46.693+08:00',
                        '2025-04-01T14:58:49.661+08:00',
                        2,
                        '',
                        0,
                        '觀看展品, 聆聽音樂',
                        '' ],
                      [ 'nmp_nmp_000_202504011458_0000_002',
                        'nmp',
                        'sam20000_02',
                        '4-2',
                        '2025-04-01T14:58:51.748+08:00',
                        '2025-04-01T14:58:53.368+08:00',
                        1,
                        '',
                        0,
                        '觀看影片',
                        '' ],
                      [ 'nmp_nmp_000_202504011631_0000_002',
                        'nmp',
                        'sam20000_02',
                        '5-3',
                        '2025-04-01T16:31:04.962+08:00',
                        '2025-04-01T16:31:06.634+08:00',
                        1,
                        '',
                        0,
                        '觀看展品',
                        '' ],
                      [ 'nmp_nmp_000_202504011631_0000_001',
                        'nmp',
                        'sam20000_02',
                        '1-2',
                        '2025-04-01T16:31:01.741+08:00',
                        '2025-04-01T16:31:03.298+08:00',
                        1,
                        '',
                        0,
                        '觀看影片',
                        '' ],
                      [ 'nmp_nmp_000_202504011631_0000_000',
                        'nmp',
                        'sam20000_02',
                        '5-2',
                        '2025-04-01T16:30:58.270+08:00',
                        '2025-04-01T16:31:00.065+08:00',
                        1,
                        '',
                        0,
                        '觀看展品',
                        '' ],
                      [ 'nmp_nmp_000_202504011631_0000_003',
                        'nmp',
                        'sam20000_02',
                        '1-2',
                        '2025-04-01T16:31:08.778+08:00',
                        '2025-04-01T16:31:10.561+08:00',
                        1,
                        '',
                        0,
                        '觀看展品',
                        '' ],
                      [ 'nmp_nmp_000_202504011839_0000_000',
                        'nmp',
                        'sam20000_02',
                        '6-3',
                        '2025-04-01T18:39:37.059+08:00',
                        '2025-04-01T18:39:45.855+08:00',
                        8,
                        '',
                        0,
                        '觸摸模型, 互動式投影, 拍照, 錄音, 錄影, 筆記, 其他',
                        'test' ],
                      [ 'nmp_nmp_000_202504011840_0000_001',
                        'nmp',
                        'sam20000_02',
                        '6-2',
                        '2025-04-01T18:39:55.977+08:00',
                        '2025-04-01T18:40:09.568+08:00',
                        13,
                        '',
                        0,
                        '觸摸模型, 互動式投影, 拍照, 錄音, 錄影, 筆記, 其他',
                        'test' ],
                      [ 'nmp_nmp_000_202504012043_0000_000',
                        'nmp',
                        'sam20000_02',
                        '5-5',
                        '2025-04-01T20:42:26.100+08:00',
                        '2025-04-01T20:43:25.531+08:00',
                        59,
                        '',
                        0,
                        '觀看模型, 聆聽音樂',
                        '' ],
                      [ 'nmp_nmp_000_202504041133_0000_001',
                        'nmp',
                        'sam20000_02',
                        '1-3',
                        '2025-04-04T11:33:17.577+08:00',
                        '2025-04-04T11:33:19.519+08:00',
                        1,
                        '',
                        0,
                        '觀看模型',
                        '' ],
                      [ 'nmp_nmp_000_202504041133_0000_000',
                        'nmp',
                        'sam20000_02',
                        '2-2',
                        '2025-04-04T11:33:12.027+08:00',
                        '2025-04-04T11:33:16.212+08:00',
                        4,
                        '',
                        0,
                        '觀看告示牌',
                        '' ],
                      [ 'nmp_nmp_000_202504041133_0000_002',
                        'nmp',
                        'sam20000_02',
                        '3-1',
                        '2025-04-04T11:33:21.611+08:00',
                        '2025-04-04T11:33:23.431+08:00',
                        1,
                        '',
                        0,
                        '觀看告示牌',
                    '' ],
                  [ 'A_B_202504072019_0000_009',
                    'A',
                    '0000',
                    '3-1',
                    '2025-04-07T20:19:38.279+08:00',
                    '2025-04-07T20:19:42.683+08:00',
                    4,
                    '',
                    0,
                    '其他',
                    '' ],
                  [ 'A_B_202504072019_0000_008',
                    'A',
                    '0000',
                    '2-3',
                    '2025-04-07T20:19:35.002+08:00',
                    '2025-04-07T20:19:36.509+08:00',
                    1,
                    '',
                    0,
                    '觀看模型',
                    '' ],
                  [ 'A_B_202504072019_0000_007',
                    'A',
                    '0000',
                    '1-3',
                    '2025-04-07T20:19:32.050+08:00',
                    '2025-04-07T20:19:33.919+08:00',
                    1,
                    '',
                    0,
                    '觀看告示牌',
                    '' ],
                  [ 'A_B_202504072019_0000_006',
                    'A',
                    '0000',
                    '2-4',
                    '2025-04-07T20:19:28.983+08:00',
                    '2025-04-07T20:19:30.977+08:00',
                    1,
                    '',
                    0,
                    '觀看展品',
                    '' ],
                  [ 'A_B_202504072019_0000_005',
                    'A',
                    '0000',
                    '2-1',
                    '2025-04-07T20:19:25.883+08:00',
                    '2025-04-07T20:19:27.401+08:00',
                    1,
                    '',
                    0,
                    '觀看模型',
                    '' ],
                  [ 'A_B_202504072019_0000_004',
                    'A',
                    '0000',
                    '1-2',
                    '2025-04-07T20:19:20.235+08:00',
                    '2025-04-07T20:19:25.035+08:00',
                    4,
                    '',
                    0,
                    '觀看影片',
                    '' ],
                  [ 'A_B_202504072019_0000_003',
                    'A',
                    '0000',
                    '3-1',
                    '2025-04-07T20:19:15.907+08:00',
                    '2025-04-07T20:19:17.538+08:00',
                    1,
                    '',
                    0,
                    '聆聽音樂',
                    '' ],
                  [ 'A_B_202504072019_0000_002',
                    'A',
                    '0000',
                    '4-1',
                    '2025-04-07T20:19:12.338+08:00',
                    '2025-04-07T20:19:14.268+08:00',
                    1,
                    '',
                    0,
                    '觀看展品',
                    '' ],
                  [ 'A_B_202504072019_0000_001',
                    'A',
                    '0000',
                    '5-3',
                    '2025-04-07T20:19:09.321+08:00',
                    '2025-04-07T20:19:11.479+08:00',
                    2,
                    '',
                    0,
                    '觀看展品',
                    '' ],
                  [ 'A_B_202504072019_0000_000',
                    'A',
                    '0000',
                    '6-2',
                    '2025-04-07T20:19:05.945+08:00',
                    '2025-04-07T20:19:08.089+08:00',
                    2,
                    '',
                    0,
                    '觀看告示牌',
                    '' ],
                  [ 'A_B_202504072019_0000_010',
                    'A',
                    '0000',
                    '2-4',
                    '2025-04-07T20:19:43.640+08:00',
                    '2025-04-07T20:19:52.769+08:00',
                    9,
                    '',
                    0,
                    '拍照, 錄音, 錄影, 筆記',
                    ''  ],
                    [ 'A_B_202504072019_0000_010',
                        'A',
                        '0000',
                        '2-4',
                        '2025-04-07T20:19:43.640+08:00',
                        '2025-04-07T20:19:52.769+08:00',
                        9,
                        '',
                        0,
                        '拍照, 錄音, 錄影, 筆記',
                        ''  ]];
                this.dataCache.visitorInfo = defaultDataVInFo;
                this.dataCache.interactions = defaultDataVInteractions;
                
                // 渲染儀表板
                this.renderDashboard();
                this.showLoadingState(false);
            }, 500);
        }
    },
    
    // 處理訪客互動數據，生成統計結果
    processVisitorInteractionsData: function() {
        // 初始化結果對象
        const result = {
            visitorCount: 0,
            recordCount: 0,
            totalStayTime: 0,
            avgStayTime: 0,
            visitorTrend: Array(13).fill(0), // 月度訪客數 (索引12為無效日期)
            popularAreas: [],                // 熱門展區
            visitorLocations: [],            // 訪客居住地分布
            interactionCounts: [],           // 互動行為次數
            invalidDateCount: 0,             // 無效日期計數
            invalidDatePercentage: 0,        // 無效日期百分比
            topInteractions: [],             // 最受歡迎的互動方式
            trendAnalysis: []                // 趨勢分析數據
        };
        
        // 訪客ID去重處理
        const uniqueVisitorIds = new Set();
        
        // 互動行為統計
        const interactionTypes = {};
        
        // 遍歷處理數據
        if (this.dataCache.visitorInfo && Array.isArray(this.dataCache.visitorInfo) && this.dataCache.visitorInfo.length > 0) {
            // 計算記錄總數
            result.recordCount = this.dataCache.visitorInfo.length;
            
            // 遍歷所有訪客記錄
            this.dataCache.visitorInfo.forEach(visitor => {
                // 檢查必要的數據字段
                if (!visitor || !Array.isArray(visitor) || visitor.length < 11) {
                    return; // 跳過無效數據
                }
                
                try {
                    // 獲取訪客ID和總停留時間
                    const visitorId = visitor[0];
                    const totalSeconds = parseInt(visitor[10]) || 0;
                    
                    // 統計唯一訪客數量
                    if (visitorId && !uniqueVisitorIds.has(visitorId)) {
                        uniqueVisitorIds.add(visitorId);
                        
                        // 解析日期並統計月份數據
                        const dateInfo = this.parseVisitorIdDate(visitorId);
                        if (dateInfo && typeof dateInfo.month === 'number') {
                            if (dateInfo.month >= 0 && dateInfo.month < 12) {
                                // 有效月份
                                result.visitorTrend[dateInfo.month]++;
                            } else if (dateInfo.month === 12) {
                                // 無效日期
                                result.visitorTrend[12]++;
                                result.invalidDateCount++;
                            }
                        }
                        
                        // 統計居住地分布
                        const residence = visitor[7] || '未知';
                        const areaIndex = result.visitorLocations.findIndex(item => item.area === residence);
                        if (areaIndex >= 0) {
                            result.visitorLocations[areaIndex].count++;
                        } else {
                            result.visitorLocations.push({ area: residence, count: 1 });
                        }
                    }
                    
                    // 累加總停留時間
                    result.totalStayTime += totalSeconds;
                } catch (error) {
                    console.error('處理訪客數據時發生錯誤:', error);
                }
            });
            
            // 設置訪客數量
            result.visitorCount = uniqueVisitorIds.size;
            
            // 計算平均停留時間
            result.avgStayTime = result.visitorCount > 0 ? Math.floor(result.totalStayTime / result.visitorCount) : 0;
            
            // 計算無效日期百分比
            result.invalidDatePercentage = result.visitorCount > 0 
                ? Math.round((result.invalidDateCount / result.visitorCount) * 100) 
                : 0;
        }
        
        // 處理互動數據
        if (this.dataCache.interactions && Array.isArray(this.dataCache.interactions) && this.dataCache.interactions.length > 0) {
            // 遍歷所有互動記錄
            this.dataCache.interactions.forEach(interaction => {
                // 檢查必要的數據字段
                if (!interaction || !Array.isArray(interaction) || interaction.length < 10) {
                    return; // 跳過無效數據
                }
                
                try {
                    // 獲取點位和互動類型
                    const location = interaction[3] || '未知';
                    const interactionType = interaction[9] || '';
                    
                    // 統計熱門展區
                    const areaIndex = result.popularAreas.findIndex(item => item.location === location);
                    if (areaIndex >= 0) {
                        result.popularAreas[areaIndex].count++;
                    } else {
                        result.popularAreas.push({ location: location, count: 1 });
                    }
                    
                    // 分割並統計互動行為類型
                    if (interactionType) {
                        const types = interactionType.split(/[,、]/);
                        types.forEach(type => {
                            const trimmedType = type.trim();
                            if (trimmedType) {
                                interactionTypes[trimmedType] = (interactionTypes[trimmedType] || 0) + 1;
                            }
                        });
                    }
                } catch (error) {
                    console.error('處理互動數據時發生錯誤:', error);
                }
            });
            
            // 轉換互動類型統計為數組
            for (const type in interactionTypes) {
                result.interactionCounts.push({ type: type, count: interactionTypes[type] });
            }
            
            // 生成最受歡迎的互動方式
            result.topInteractions = [...result.interactionCounts]
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);
        }
        
        // 生成趨勢分析數據
        result.trendAnalysis = this.generateTrendAnalysis(result.visitorTrend);
        
        return result;
    },
    
    // 生成趨勢分析數據
    generateTrendAnalysis: function(trendData) {
        if (!trendData || !Array.isArray(trendData) || trendData.length < 12) {
            return [];
        }
        
        const analysis = [];
        try {
            // 計算月度平均
            const validMonths = trendData.slice(0, 12).filter(count => count > 0).length;
            const totalVisitors = trendData.slice(0, 12).reduce((sum, count) => sum + count, 0);
            const monthlyAverage = validMonths > 0 ? Math.round(totalVisitors / validMonths) : 0;
            
            // 找出訪客最多的月份
            let maxMonth = 0;
            let maxVisitors = 0;
            for (let i = 0; i < 12; i++) {
                if (trendData[i] > maxVisitors) {
                    maxVisitors = trendData[i];
                    maxMonth = i;
                }
            }
            
            // 計算季度趨勢
            const quarters = [
                trendData.slice(0, 3).reduce((sum, count) => sum + count, 0),  // Q1
                trendData.slice(3, 6).reduce((sum, count) => sum + count, 0),  // Q2
                trendData.slice(6, 9).reduce((sum, count) => sum + count, 0),  // Q3
                trendData.slice(9, 12).reduce((sum, count) => sum + count, 0)  // Q4
            ];
            
            const maxQuarter = quarters.indexOf(Math.max(...quarters)) + 1;
            
            // 添加分析結論
            analysis.push({
                title: '月平均訪客數',
                value: monthlyAverage,
                icon: 'bi-people'
            });
            
            analysis.push({
                title: '訪客最多月份',
                value: `${maxMonth + 1}月 (${maxVisitors}人)`,
                icon: 'bi-calendar-check'
            });
            
            analysis.push({
                title: '訪客最多季度',
                value: `Q${maxQuarter}`,
                icon: 'bi-graph-up-arrow'
            });
            
            // 計算趨勢方向
            let increasing = 0;
            for (let i = 1; i < 12; i++) {
                if (trendData[i] > trendData[i-1]) increasing++;
            }
            
            const trendDirection = increasing >= 6 ? '上升' : (increasing <= 4 ? '下降' : '穩定');
            analysis.push({
                title: '整體趨勢',
                value: trendDirection,
                icon: increasing >= 6 ? 'bi-arrow-up-circle' : (increasing <= 4 ? 'bi-arrow-down-circle' : 'bi-arrow-left-right')
            });
            
        } catch (error) {
            console.error('生成趨勢分析時發生錯誤:', error);
        }
        
        return analysis;
    },
    
    // 渲染儀表板
    renderDashboard: function() {
        // 處理數據
        const processedData = this.processVisitorInteractionsData();
        
        try {
            // 更新卡片數據
            const visitorCountElement = document.getElementById('visitorCountCard');
            if (visitorCountElement) {
                visitorCountElement.textContent = processedData.visitorCount || 0;
            }
            
            const recordCountElement = document.getElementById('recordCountCard');
            if (recordCountElement) {
                recordCountElement.textContent = processedData.recordCount || 0;
            }
            
            // 格式化總停留時間（秒轉為時:分:秒）
            const totalSeconds = processedData.totalStayTime || 0;
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;
            const formattedTime = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            const totalStayTimeElement = document.getElementById('totalStayTimeCard');
            if (totalStayTimeElement) {
                totalStayTimeElement.textContent = formattedTime;
            }
            
            // 格式化平均停留時間（秒轉為時:分）
            const avgSeconds = processedData.avgStayTime || 0;
            const avgMinutes = Math.floor(avgSeconds / 60);
            const avgHours = Math.floor(avgMinutes / 60);
            const remainingMinutes = avgMinutes % 60;
            const formattedAvgTime = `${avgHours}:${remainingMinutes.toString().padStart(2, '0')}`;
            
            const avgStayTimeElement = document.getElementById('avgStayTimeCard');
            if (avgStayTimeElement) {
                avgStayTimeElement.textContent = formattedAvgTime;
            }
            
            // 更新無效日期統計
            const invalidDateCountElement = document.getElementById('invalidDateCount');
            if (invalidDateCountElement) {
                invalidDateCountElement.textContent = processedData.invalidDateCount || 0;
            }
            
            const invalidDatePercentageElement = document.getElementById('invalidDatePercentage');
            if (invalidDatePercentageElement) {
                invalidDatePercentageElement.textContent = processedData.invalidDatePercentage + '%';
            }
            
            // 更新最受歡迎的互動方式列表
            this.renderTopInteractions(processedData.topInteractions);
            
            // 更新趨勢分析列表
            this.renderTrendAnalysis(processedData.trendAnalysis);
            
            // 輸出無效日期數量
            console.log(`訪客趨勢圖表中的無效日期數量: ${processedData.invalidDateCount || 0}`);
            
            // 更新圖表
            this.updateVisitorTrendChart(processedData.visitorTrend, processedData.invalidDateCount);
            this.updatePopularAreasChart(processedData.visitorLocations); // 位置已對調，這裡顯示的是居住地分布
            this.updateHotAreasChart(processedData.popularAreas); // 熱門展區
            this.updateInteractionChart(processedData.interactionCounts);
            
            // 綁定圖表類型切換事件
            this.bindChartTypeButtons();
        } catch (error) {
            console.error('渲染儀表板時發生錯誤:', error);
        }
    },
    
    // 渲染最受歡迎的互動方式列表
    renderTopInteractions: function(topInteractions) {
        const container = document.getElementById('topInteractions');
        if (!container) return;
        
        try {
            container.innerHTML = '';
            
            if (!topInteractions || !Array.isArray(topInteractions) || topInteractions.length === 0) {
                container.innerHTML = '<li class="list-group-item">無數據</li>';
                return;
            }
            
            topInteractions.forEach((item, index) => {
                const li = document.createElement('li');
                li.className = 'list-group-item d-flex justify-content-between align-items-center';
                
                const typeSpan = document.createElement('span');
                typeSpan.innerHTML = `${index + 1}. ${item.type}`;
                
                const countBadge = document.createElement('span');
                countBadge.className = 'badge bg-primary rounded-pill';
                countBadge.textContent = item.count;
                
                li.appendChild(typeSpan);
                li.appendChild(countBadge);
                container.appendChild(li);
            });
        } catch (error) {
            console.error('渲染互動方式列表時發生錯誤:', error);
            container.innerHTML = '<li class="list-group-item">載入失敗</li>';
        }
    },
    
    // 渲染趨勢分析列表
    renderTrendAnalysis: function(trendAnalysis) {
        const container = document.getElementById('trendAnalysis');
        if (!container) return;
        
        try {
            container.innerHTML = '';
            
            if (!trendAnalysis || !Array.isArray(trendAnalysis) || trendAnalysis.length === 0) {
                container.innerHTML = '<li class="list-group-item">無分析數據</li>';
                return;
            }
            
            trendAnalysis.forEach(item => {
                const li = document.createElement('li');
                li.className = 'list-group-item d-flex justify-content-between align-items-center';
                
                const titleSpan = document.createElement('span');
                titleSpan.innerHTML = `<i class="bi ${item.icon} me-2"></i> ${item.title}`;
                
                const valueSpan = document.createElement('span');
                valueSpan.className = 'fw-bold';
                valueSpan.textContent = item.value;
                
                li.appendChild(titleSpan);
                li.appendChild(valueSpan);
                container.appendChild(li);
            });
        } catch (error) {
            console.error('渲染趨勢分析列表時發生錯誤:', error);
            container.innerHTML = '<li class="list-group-item">載入失敗</li>';
        }
    },
    
    // 綁定圖表類型切換按鈕
    bindChartTypeButtons: function() {
        try {
            const chartTypeButtons = document.querySelectorAll('[data-chart-type]');
            const chartDownloadButtons = document.querySelectorAll('[data-chart-action="download"]');
            
            // 圖表類型切換
            chartTypeButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    
                    const chartType = button.getAttribute('data-chart-type');
                    const chartContainer = button.closest('.card').querySelector('canvas');
                    
                    if (chartContainer && chartContainer.chart) {
                        // 儲存當前數據
                        const currentData = chartContainer.chart.data;
                        
                        // 銷毀當前圖表
                        chartContainer.chart.destroy();
                        
                        // 創建新類型的圖表
                        const newChart = new Chart(chartContainer.getContext('2d'), {
                            type: chartType,
                            data: currentData,
                            options: this.getChartOptions(chartType)
                        });
                        
                        // 保存新圖表引用
                        chartContainer.chart = newChart;
                    }
                });
            });
            
            // 圖表下載
            chartDownloadButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    
                    const chartContainer = button.closest('.card').querySelector('canvas');
                    const chartTitle = button.closest('.card').querySelector('.card-title').textContent.trim();
                    
                    if (chartContainer) {
                        const link = document.createElement('a');
                        link.download = `${chartTitle}-${new Date().toLocaleDateString()}.png`;
                        link.href = chartContainer.toDataURL('image/png');
                        link.click();
                    }
                });
            });
            
            // 自訂日期範圍顯示/隱藏
            const customRangeButton = document.querySelector('[data-range="custom"]');
            const customDateRangeContainer = document.getElementById('customDateRange');
            
            if (customRangeButton && customDateRangeContainer) {
                customRangeButton.addEventListener('click', () => {
                    customDateRangeContainer.classList.remove('d-none');
                });
                
                // 其他時間範圍按鈕會隱藏自訂日期
                document.querySelectorAll('#timeRangeSelector [data-range]:not([data-range="custom"])').forEach(btn => {
                    btn.addEventListener('click', () => {
                        customDateRangeContainer.classList.add('d-none');
                    });
                });
            }
            
            // 篩選應用按鈕
            const applyFiltersButton = document.getElementById('applyFilters');
            if (applyFiltersButton) {
                applyFiltersButton.addEventListener('click', () => {
                    // 重新載入數據並渲染儀表板
                    this.loadData();
                });
            }
        } catch (error) {
            console.error('綁定圖表事件時發生錯誤:', error);
        }
    },
    
    // 獲取不同圖表類型的配置選項
    getChartOptions: function(chartType) {
        const baseOptions = {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        };
        
        switch (chartType) {
            case 'line':
                return {
                    ...baseOptions,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                precision: 0
                            }
                        }
                    }
                };
                
            case 'bar':
                return {
                    ...baseOptions,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                precision: 0
                            }
                        }
                    }
                };
                
            case 'horizontalBar':
                return {
                    ...baseOptions,
                    indexAxis: 'y',
                    scales: {
                        x: {
                            beginAtZero: true,
                            ticks: {
                                precision: 0
                            }
                        }
                    }
                };
                
            case 'pie':
            case 'doughnut':
            case 'polarArea':
                return {
                    ...baseOptions,
                    plugins: {
                        legend: {
                            position: 'right'
                        }
                    }
                };
                
            default:
                return baseOptions;
        }
    },
    
    // 顯示/隱藏載入狀態
    showLoadingState: function(isLoading) {
        const cards = document.querySelectorAll('.dashboard-card .card-text');
        cards.forEach(card => {
            if (isLoading) {
                card.dataset.originalText = card.textContent;
                card.innerHTML = '<div class="spinner-border spinner-border-sm text-secondary" role="status"><span class="visually-hidden">Loading...</span></div>';
            } else if (card.dataset.originalText) {
                card.textContent = card.dataset.originalText;
                delete card.dataset.originalText;
            }
        });
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

