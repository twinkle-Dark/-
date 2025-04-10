    /**
     * 博物館管理模組 - 負責管理系統博物館
     * 包含博物館創建、編輯、刪除等功能
     * // 博物館管理模組功能列表
        // 1. 分頁配置
        // 2. 初始化
        // 3. 設置事件監聽
        // 4. 初始化表單
        // 5. 更新ID預覽
        // 6. 生成簡單ID
        // 7. 載入數據
        // 8. 顯示/隱藏載入狀態
        // 9. 顯示新增博物館模態框
        // 10. 編輯博物館
        // 11. 填充表單
        // 12. 保存博物館
        // 13. 驗證表單
        // 14. 刪除博物館
        // 15. 更新分頁控件
        // 16. 跳轉到指定頁
     */
    
    // 定義博物館管理模組
    const MuseumModule = {
        // 分頁配置
        pagination: {
            currentPage: 1,
            pageSize: 10,
            totalPages: 1
        },
        
        // 初始化
        init: function() {
            console.log('初始化博物館管理模組');
            this.setupEventListeners();
            this.loadData();
            this.initForm();
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
            // 新增按鈕
            const addBtn = document.querySelector('#museums .btn-primary');
            if (addBtn) {
                addBtn.addEventListener('click', () => this.showAddMuseumModal());
            }
            
            // 表格行操作按鈕 - 動態綁定
            document.addEventListener('click', (e) => {
                const btn = e.target.closest('.btn-sm');
                if (!btn) return;
                
                if (btn.classList.contains('btn-outline-primary') || btn.classList.contains('edit-museum')) {
                    const museumId = btn.closest('tr').cells[0].textContent;
                    this.editMuseum(museumId);
                } 
                else if (btn.classList.contains('btn-outline-danger') || btn.classList.contains('delete-museum')) {
                    const museumId = btn.closest('tr').cells[0].textContent;
                    const hallId = btn.closest('tr').cells[2].textContent;
                    const hallName = btn.closest('tr').cells[3].textContent;
                    this.deleteMuseum(museumId, hallId, hallName);
                }
            });
            
            // 保存按鈕
            const saveBtn = document.getElementById('saveMuseumBtn');
            if (saveBtn) {
                saveBtn.addEventListener('click', () => this.saveMuseum());
            }
            
            // 平面圖預覽
            document.addEventListener('click', (e) => {
                const link = e.target.closest('.view-floorplan');
                if (link) {
                    e.preventDefault();
                    const url = link.getAttribute('data-url');
                    if (url) {
                        this.showFloorPlanPreview(url);
                    }
                }
            });
            
            // 分頁按鈕 - 動態綁定
            document.addEventListener('click', (e) => {
                const pageLink = e.target.closest('.page-link');
                if (pageLink) {
                    e.preventDefault();
                    const page = parseInt(pageLink.getAttribute('data-page'));
                    if (!isNaN(page)) {
                        this.goToPage(page);
                    }
                }
            });
        },
        
        // 初始化表單
        initForm: function() {
            const form = document.getElementById('museumForm');
            if (!form) return;
            
            // 設置狀態選項
            const statusSelect = form.querySelector('[name="status"]');
            if (statusSelect) {
                const options = ['籌備中', '運營中', '維護中', '已關閉'];
                statusSelect.innerHTML = '<option value="">請選擇狀態</option>';
                options.forEach(option => {
                    const opt = document.createElement('option');
                    opt.value = option;
                    opt.textContent = option;
                    statusSelect.appendChild(opt);
                });
            }
        },
        
        // 生成展廳ID
        generateHallId: function(museumId) {
            if (!museumId) {
                // 如果沒有提供museumId，使用當前用戶的博物館ID
                museumId = this.getCurrentUser().museum;
            }
            
            // 測試環境模擬邏輯
            try {
                // 簡化的邏輯，根據mockData中的格式生成ID
                const mockHalls = ['nmp_000', 'nmp_001', 'nmp_002', 'nmp_003'];
                const prefix = museumId.toLowerCase();
                
                // 找出最大序號
                let maxSeq = -1;
                mockHalls.forEach(hall => {
                    if (hall.startsWith(prefix + '_')) {
                        const seqStr = hall.split('_')[1];
                        const seq = parseInt(seqStr, 10);
                        if (!isNaN(seq) && seq > maxSeq) {
                            maxSeq = seq;
                        }
                    }
                });
                
                // 生成新序號（最大序號+1，並補零至3位數）
                const newSeq = (maxSeq + 1).toString().padStart(3, '0');
                return `${prefix}_${newSeq}`;
            } catch (error) {
                console.error('生成展廳ID失敗:', error);
                return `${museumId}_000`;
            }
        },
        
        // 載入數據
        loadData: function() {
            this.showLoadingState(true);
            
            if (typeof google !== 'undefined' && google.script) {
                google.script.run
                    .withSuccessHandler(data => {
                        console.log('從GAS獲取博物館數據成功');
                        // 將二維陣列轉換為物件陣列
                        const processedData = this.convertMuseumsDataToObjects(data);
                        // 篩選出與用戶所屬博物館匹配的資料
                        const filteredData = this.filterMuseumsByUserMuseumId(processedData, this.getCurrentUser().museum);
                        this.renderTable(filteredData);
                        this.updatePagination();
                        this.showLoadingState(false);
                    })
                    .withFailureHandler(error => {
                        console.error('獲取博物館數據失敗:', error);
                        this.showLoadingState(false);
                    })
                    .getDataMuseums();
            } else {
                // 測試環境使用模擬數據庫
                setTimeout(() => {
                    // 使用預設值作為後備
                    console.log('使用預設博物館數據');
                    const mockData = [ [ 'museumId',
                        'name',
                        'exhibitionHallId',
                        'exhibitionHall',
                        'section ',
                        'description',
                        'floorPlanUrl',
                        'address',
                        'contact',
                        'status',
                        'notes' ],
                      [ 'nmp',
                        '國立史前博物館',
                        'nmp_000',
                        '南島廳',
                        '常設展',
                        '國內第一座以史前和原住民文化為範疇的博物館',
                        'https://drive.google.com/file/d/1pbT9M-pD4F84RRy7rEl3nxY7HaAg1xpz/view?usp=sharing',
                        '台東縣台東市豐田里博物館路1號',
                        '',
                        '營運中',
                        1 ],
                      [ 'nmp',
                        '國立史前博物館',
                        'nmp_001',
                        '史前史廳',
                        '常設展',
                        '國內第一座以史前和原住民文化為範疇的博物館',
                        'https://drive.google.com/file/d/1pbT9M-pD4F84RRy7rEl3nxY7HaAg1xpz/view?usp=sharing',
                        '台東縣台東市豐田里博物館路1號',
                        '',
                        '營運中',
                        2 ],
                      [ 'nmp',
                        '國立史前博物館',
                        'nmp_002',
                        '廳',
                        '常設展',
                        '國內第一座以史前和原住民文化為範疇的博物館',
                        'https://drive.google.com/file/d/1pbT9M-pD4F84RRy7rEl3nxY7HaAg1xpz/view?usp=sharing',
                        '',
                        '',
                        '營運中',
                        3 ],
                      [ 'nmp',
                        '國立史前博物館',
                        'nmp_003',
                        '考古特展',
                        '特展',
                        '國內第一座以史前和原住民文化為範疇的博物館',
                        'https://drive.google.com/file/d/1pbT9M-pD4F84RRy7rEl3nxY7HaAg1xpz/view?usp=sharing',
                        '台東縣台東市豐田里博物館路1號',
                        '',
                        '營運中',
                        4 ] ];
                    
                    // 篩選出與用戶所屬博物館匹配的資料
                    const userMuseumId = this.getCurrentUser().museum;
                    const filteredData = this.filterMuseumsByUserMuseumId(mockData, userMuseumId);
                    this.renderTable(filteredData);
                    this.updatePagination();
                    this.showLoadingState(false);
                }, 500);
            }
        },
        
        // 將博物館數據轉換為物件
        convertMuseumsDataToObjects: function(museumsData) {
            if (!museumsData || museumsData.length <= 1) return [];
        
            // 第一行是標題行
            const headers = museumsData[0];
        
            // 索引映射 - 更新以符合實際數據結構
            const indices = {
                museumId: headers.indexOf('museumId'),
                name: headers.indexOf('name'),
                hallId: headers.indexOf('exhibitionHallId'),
                hallName: headers.indexOf('exhibitionHall'),
                type: headers.indexOf('section '), // 注意空格
                description: headers.indexOf('description'),
                floorPlan: headers.indexOf('floorPlanUrl'),
                address: headers.indexOf('address'),
                contact: headers.indexOf('contact'),
                status: headers.indexOf('status'),
                notes: headers.indexOf('notes')
            };
        
            // 將數據轉換為物件陣列
            const museums = [];
            for (let i = 1; i < museumsData.length; i++) {
                const row = museumsData[i];
                
                // 檢查行是否有足夠的數據
                if (!row || row.length === 0) continue;
                
                const museum = {
                    museumId: indices.museumId >= 0 ? row[indices.museumId] : '',
                    name: indices.name >= 0 ? row[indices.name] : '',
                    hallId: indices.hallId >= 0 ? row[indices.hallId] : '',
                    hallName: indices.hallName >= 0 ? row[indices.hallName] : '',
                    type: indices.type >= 0 ? row[indices.type] : '',
                    description: indices.description >= 0 ? row[indices.description] : '',
                    floorPlan: indices.floorPlan >= 0 ? row[indices.floorPlan] : '',
                    address: indices.address >= 0 ? row[indices.address] : '',
                    contact: indices.contact >= 0 ? row[indices.contact] : '',
                    status: indices.status >= 0 ? row[indices.status] : '',
                    notes: indices.notes >= 0 ? row[indices.notes] : ''
                };
                
                museums.push(museum);
            }
        
            return museums;
        },
        
        // 根據ID查找博物館
        findMuseumById: function(museums, museumId) {
            if (Array.isArray(museums) && museums.length > 0) {
                // 如果museums是二維陣列(從GAS獲取的原始資料)
                if (Array.isArray(museums[0])) {
                    // 轉換為物件陣列
                    const museumObjects = this.convertMuseumsDataToObjects(museums);
                    return museumObjects.find(m => m.museumId === museumId);
                }
                
                // 如果museums已經是物件陣列
                return museums.find(m => m.museumId === museumId);
            }
            
            return null;
        },
        
        // 篩選出與用戶所屬博物館匹配的資料
        filterMuseumsByUserMuseumId: function(museums, userMuseumId) {
            if (!userMuseumId || !museums) return museums;
            
            // 如果是二維陣列（從GAS API獲取的原始資料)
            if (Array.isArray(museums) && museums.length > 0 && Array.isArray(museums[0])) {
                // 假設第一行是標題行，museumId在第一列
                const headers = museums[0];
                const museumIdIdx = headers.indexOf('museumId');
                const idColIndex = museumIdIdx >= 0 ? museumIdIdx : 0;
                
                // 篩選出museumId以userMuseumId開頭的行
                return [headers].concat(
                    museums.slice(1).filter(row => 
                        row[idColIndex] && 
                        (row[idColIndex].toString().toLowerCase().startsWith(userMuseumId.toLowerCase()) || 
                         row[idColIndex].toString().split('_')[0].toLowerCase() === userMuseumId.toLowerCase())
                    )
                );
            }
            
            // 如果是物件陣列 (已轉換後的資料)
            return museums.filter(museum => 
                museum.museumId && 
                (museum.museumId.toString().toLowerCase().startsWith(userMuseumId.toLowerCase()) || 
                 museum.museumId.toString().split('_')[0].toLowerCase() === userMuseumId.toLowerCase())
            );
        },
        
        // 渲染表格
        renderTable: function(data) {
            const tableBody = document.querySelector('#museums table tbody');
            const tableHead = document.querySelector('#museums table thead');
            if (!tableBody || !tableHead) return;
            
            // 更新表格標題
            tableHead.innerHTML = `
                <tr>
                    <th>博物館ID</th>
                    <th>所屬博物館</th>
                    <th>展廳ID</th>
                    <th>展廳名</th>
                    <th>廳別</th>
                    <th>描述</th>
                    <th>平面圖</th>
                    <th>地址</th>
                    <th>聯絡資訊</th>
                    <th>狀態</th>
                    <th>備註</th>
                    <th>操作</th>
                </tr>
            `;
            
            // 清空表格
            tableBody.innerHTML = '';
            
            // 判斷是否為二維陣列，如果是則轉換
            let processedData = data;
            if (data && data.length > 0 && Array.isArray(data[0])) {
                processedData = this.convertMuseumsDataToObjects(data);
            }
            
            // 計算當前頁面應顯示的數據
            const startIndex = (this.pagination.currentPage - 1) * this.pagination.pageSize;
            const endIndex = Math.min(startIndex + this.pagination.pageSize, processedData.length);
            const pageData = processedData.slice(startIndex, endIndex);
            
            // 渲染數據
            pageData.forEach(museum => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${museum.museumId || ''}</td>
                    <td>${museum.name || ''}</td>
                    <td>${museum.hallId || ''}</td>
                    <td>${museum.hallName || ''}</td>
                    <td>${museum.type || ''}</td>
                    <td>${museum.description ? (museum.description.length > 20 ? museum.description.substring(0, 20) + '...' : museum.description) : ''}</td>
                    <td>${museum.floorPlan ? `<a href="#" class="view-floorplan" data-url="${museum.floorPlan}">查看</a>` : ''}</td>
                    <td>${museum.address || ''}</td>
                    <td>${museum.contact || ''}</td>
                    <td><span class="badge ${this.getStatusBadgeClass(museum.status)}">${museum.status || ''}</span></td>
                    <td>${museum.notes || ''}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary edit-museum" data-id="${museum.museumId}" title="編輯">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger delete-museum" data-id="${museum.museumId}" title="刪除">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        },
        
        // 獲取狀態對應的Badge樣式
        getStatusBadgeClass: function(status) {
            switch (status) {
                case '籌備中':
                    return 'bg-info';
                case '運營中':
                    return 'bg-success';
                case '維護中':
                    return 'bg-warning';
                case '已關閉':
                    return 'bg-danger';
                case '啟用':
                    return 'bg-success';
                default:
                    return 'bg-secondary';
            }
        },
        
        // 更新分頁
        updatePagination: function() {
            const paginationContainer = document.getElementById('museum-pagination');
            if (!paginationContainer) return;
            
            const totalItems = this.getTotalCount();
            this.pagination.totalPages = Math.ceil(totalItems / this.pagination.pageSize);
            
            // 清空分頁容器
            paginationContainer.innerHTML = '';
            
            // 如果只有一頁，不顯示分頁
            if (this.pagination.totalPages <= 1) return;
            
            // 創建分頁 UI
            const paginationList = document.createElement('ul');
            paginationList.className = 'pagination';
            
            // 上一頁按鈕
            const prevButton = document.createElement('li');
            prevButton.className = `page-item ${this.pagination.currentPage === 1 ? 'disabled' : ''}`;
            prevButton.innerHTML = `<a class="page-link" href="#" data-page="${this.pagination.currentPage - 1}">上一頁</a>`;
            paginationList.appendChild(prevButton);
            
            // 頁碼按鈕
            for (let i = 1; i <= this.pagination.totalPages; i++) {
                const pageItem = document.createElement('li');
                pageItem.className = `page-item ${i === this.pagination.currentPage ? 'active' : ''}`;
                pageItem.innerHTML = `<a class="page-link" href="#" data-page="${i}">${i}</a>`;
                paginationList.appendChild(pageItem);
            }
            
            // 下一頁按鈕
            const nextButton = document.createElement('li');
            nextButton.className = `page-item ${this.pagination.currentPage === this.pagination.totalPages ? 'disabled' : ''}`;
            nextButton.innerHTML = `<a class="page-link" href="#" data-page="${this.pagination.currentPage + 1}">下一頁</a>`;
            paginationList.appendChild(nextButton);
            
            paginationContainer.appendChild(paginationList);
        },
        
        // 獲取數據總數
        getTotalCount: function() {
            // 在實際環境中，這應該從服務器獲取
            if (typeof google !== 'undefined' && google.script) {
                // 實際環境中的數據總數可能透過額外的API獲取
                return 20; // 假設總共有20條記錄
            } else {
                // 測試環境
                return 10;
            }
        },
        
        // 切換到指定頁
        goToPage: function(page) {
            if (page < 1 || page > this.pagination.totalPages) return;
            
            this.pagination.currentPage = page;
            this.loadData();
        },
        
        // 顯示/隱藏載入狀態
        showLoadingState: function(isLoading) {
            const table = document.querySelector('#museums table');
            const container = document.querySelector('#museums');
            if (!table || !container) return;
            
            if (isLoading) {
                table.classList.add('loading');
                
                // 添加載入動畫
                const loadingEl = document.createElement('div');
                loadingEl.className = 'loading-indicator';
                loadingEl.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">載入中...</span></div>';
                loadingEl.style.position = 'absolute';
                loadingEl.style.top = '50%';
                loadingEl.style.left = '50%';
                loadingEl.style.transform = 'translate(-50%, -50%)';
                
                // 先移除已存在的載入指示器
                const existingIndicator = container.querySelector('.loading-indicator');
                if (existingIndicator) {
                    existingIndicator.remove();
                }
                
                container.style.position = 'relative';
                container.appendChild(loadingEl);
            } else {
                table.classList.remove('loading');
                
                // 移除載入動畫
                const loadingEl = container.querySelector('.loading-indicator');
                if (loadingEl) {
                    loadingEl.remove();
                }
            }
        },
        
        // 顯示新增博物館模態框
        showAddMuseumModal: function() {
            // 確保模態框存在
            const modalElement = document.getElementById('museumModal');
            if (!modalElement) {
                this.createMuseumModal();
            }
            
            const modal = new bootstrap.Modal(document.getElementById('museumModal'));
            document.getElementById('museumForm').reset();
            
            // 清除隱藏表單欄位
            const museumIdInput = document.getElementById('museumForm').querySelector('[name="museumId"]');
            const hallIdInput = document.getElementById('museumForm').querySelector('[name="hallId"]');
            if (museumIdInput) museumIdInput.value = '';
            if (hallIdInput) hallIdInput.value = '';
            
            modal.show();
        },
        
        // 創建博物館模態框
        createMuseumModal: function() {
            // 如果模態框不存在，創建它
            const modalHTML = `
                <div class="modal fade" id="museumModal" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="museumModalTitle">新增展廳</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <form id="museumForm">
                                    <!-- 隱藏欄位 - 自動生成 -->
                                    <input type="hidden" name="museumId">
                                    <input type="hidden" name="hallId">
                                    
                                    <div class="row mb-3">
                                        <div class="col-md-6">
                                            <label class="form-label">博物館名稱</label>
                                            <input type="text" class="form-control" name="name" required>
                                        </div>
                                        <div class="col-md-6">
                                            <label class="form-label">展廳名稱</label>
                                            <input type="text" class="form-control" name="hallName" required>
                                        </div>
                                    </div>
                                    
                                    <div class="row mb-3">
                                        <div class="col-md-6">
                                            <label class="form-label">廳別</label>
                                            <select class="form-select" name="type" required>
                                                <option value="">請選擇廳別</option>
                                                <option value="常設展">常設展</option>
                                                <option value="特展">特展</option>
                                                <option value="臨時活動">臨時活動</option>
                                            </select>
                                        </div>
                                        <div class="col-md-6">
                                            <label class="form-label">狀態</label>
                                            <select class="form-select" name="status" required></select>
                                        </div>
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label class="form-label">描述</label>
                                        <textarea class="form-control" name="description" rows="2"></textarea>
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label class="form-label">平面圖</label>
                                        <input type="file" class="form-control" name="floorPlan">
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label class="form-label">地址</label>
                                        <input type="text" class="form-control" name="address">
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label class="form-label">聯絡資訊</label>
                                        <input type="text" class="form-control" name="contact">
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label class="form-label">備註</label>
                                        <input type="text" class="form-control" name="notes">
                                    </div>
                                </form>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                                <button type="button" class="btn btn-primary" id="saveMuseumBtn">儲存</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // 插入到body中
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            
            // 初始化表單
            this.initForm();
        },
        
        // 編輯博物館
        editMuseum: function(museumId) {
            // 確保模態框存在
            if (!document.getElementById('museumModal')) {
                this.createMuseumModal();
            }
            
            // 根據環境選擇數據來源
            if (typeof google !== 'undefined' && google.script) {
                google.script.run
                    .withSuccessHandler(data => {
                        this.populateForm(this.findMuseumById(data, museumId));
                    })
                    .getDataMuseums();
            } else {
                // 測試環境使用模擬數據
                const museumData = {
                    museumId: museumId,
                    name: '國立史前文化博物館',
                    hallId: 'nmp_001',
                    hallName: '特展廳',
                    type: '特展',
                    description: '史前館特展空間',
                    floorPlan: 'https://example.com/floorplan2.jpg',
                    address: '台東縣台東市博物館路1號',
                    contact: 'info@museum.com',
                    status: '運營中',
                    notes: '週一休館'
                };
                
                this.populateForm(museumData);
            }
        },
        
        // 填充表單
        populateForm: function(data) {
            if (!data) {
                console.error('無法找到博物館數據');
                return;
            }
            
            const form = document.getElementById('museumForm');
            if (!form) return;
            
            // 設置標題
            document.getElementById('museumModalTitle').textContent = '編輯展廳';
            
            // 填充表單欄位
            for (const key in data) {
                const input = form.querySelector(`[name="${key}"]`);
                if (!input) continue;
                
                if (input.tagName === 'SELECT') {
                    // 處理下拉選單
                    const options = Array.from(input.options);
                    const option = options.find(opt => opt.value === data[key]);
                    if (option) {
                        option.selected = true;
                    } else if (data[key]) {
                        // 如果沒有找到匹配的選項，但有數據，添加一個新選項
                        const newOption = document.createElement('option');
                        newOption.value = data[key];
                        newOption.textContent = data[key];
                        newOption.selected = true;
                        input.appendChild(newOption);
                    }
                } else {
                    // 處理普通輸入欄位
                    input.value = data[key];
                }
            }
            
            // 顯示模態框
            const modal = new bootstrap.Modal(document.getElementById('museumModal'));
            modal.show();
        },
        
        // 保存博物館
        saveMuseum: function() {
            const form = document.getElementById('museumForm');
            if (!form) return;
            
            // 驗證表單
            if (!this.validateForm(form)) return;
            
            // 獲取表單數據
            const formData = new FormData(form);
            const data = {};
            formData.forEach((value, key) => {
                // 映射欄位名稱以匹配數據結構
                if (key === 'hallId') {
                    data['exhibitionHallId'] = value;
                } else if (key === 'hallName') {
                    data['exhibitionHall'] = value;
                } else if (key === 'type') {
                    data['section'] = value;
                } else if (key === 'floorPlan') {
                    data['floorPlanUrl'] = value;
                } else {
                    data[key] = value;
                }
            });
            
            // 獲取ID，判斷是新增還是更新
            const isNew = !data.museumId;
            
            // 處理博物館ID和展廳ID
            if (isNew) {
                // 使用當前用戶的博物館ID
                data.museumId = this.getCurrentUser().museum;
                
                // 生成新的展廳ID (依序號)
                data.hallId = this.generateHallId(data.museumId);
                
                // 保存
                this.completeMuseumSave(data, isNew);
            } else {
                // 更新現有記錄，直接保存
                this.completeMuseumSave(data, isNew);
            }
        },
        
        // 完成博物館保存流程
        completeMuseumSave: function(data, isNew) {
            // 根據環境選擇保存方式
            if (typeof google !== 'undefined' && google.script) {
                google.script.run
                    .withSuccessHandler(() => {
                        bootstrap.Modal.getInstance(document.getElementById('museumModal')).hide();
                        this.loadData();
                        alert(isNew ? '展廳新增成功' : '展廳更新成功');
                    })
                    .withFailureHandler(error => {
                        alert('保存失敗: ' + error);
                    })
                    .saveMuseum(data);
            } else {
                // 測試環境模擬保存
                setTimeout(() => {
                    bootstrap.Modal.getInstance(document.getElementById('museumModal')).hide();
                    this.loadData();
                    alert(isNew ? '展廳新增成功' : '展廳更新成功');
                }, 300);
            }
        },
        
        // 驗證表單
        validateForm: function(form) {
            let isValid = true;
            
            // 移除所有現有的錯誤提示
            form.querySelectorAll('.is-invalid').forEach(el => {
                el.classList.remove('is-invalid');
            });
            form.querySelectorAll('.invalid-feedback').forEach(el => {
                el.remove();
            });
            
            // 檢查必填欄位
            const requiredFields = [
                { name: 'name', message: '請輸入博物館名稱' },
                { name: 'hallName', message: '請輸入展廳名稱' },
                { name: 'type', message: '請選擇廳別' },
                { name: 'status', message: '請選擇狀態' }
            ];
            
            requiredFields.forEach(field => {
                const input = form.querySelector(`[name="${field.name}"]`);
                if (!input) return;
                
                if (!input.value.trim()) {
                    input.classList.add('is-invalid');
                    
                    // 添加錯誤提示
                    const feedback = document.createElement('div');
                    feedback.className = 'invalid-feedback';
                    feedback.textContent = field.message;
                    input.parentNode.appendChild(feedback);
                    
                    isValid = false;
                }
            });
            
            return isValid;
        },
        
        // 刪除博物館
        deleteMuseum: function(museumId, hallId, hallName) {
            // 提供更多信息，讓用戶確認是刪除展廳還是博物館
            const confirmMessage = hallId 
                ? `確定要刪除展廳 "${hallName}" (${hallId}) 嗎？此操作無法撤銷。` 
                : `確定要刪除此博物館嗎？此操作無法撤銷。`;
                
            if (confirm(confirmMessage)) {
                // 顯示載入狀態
                this.showLoadingState(true);
                
                // 根據環境選擇刪除方式
                if (typeof google !== 'undefined' && google.script) {
                    google.script.run
                        .withSuccessHandler(() => {
                            this.loadData();
                            alert(hallId ? '展廳已刪除' : '博物館已刪除');
                        })
                        .withFailureHandler(error => {
                            this.showLoadingState(false);
                            alert('刪除失敗: ' + error);
                        })
                        .deleteMuseum(museumId, hallId);
                } else {
                    // 測試環境模擬刪除
                    setTimeout(() => {
                        this.loadData();
                        alert(hallId ? '展廳已刪除' : '博物館已刪除');
                    }, 300);
                }
            }
        },
        
        // 顯示平面圖預覽
        showFloorPlanPreview: function(url) {
            // 創建或獲取預覽模態框
            let previewModal = document.getElementById('floorPlanPreviewModal');
            if (!previewModal) {
                const modalHTML = `
                    <div class="modal fade" id="floorPlanPreviewModal" tabindex="-1" aria-hidden="true">
                        <div class="modal-dialog modal-lg">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title">平面圖預覽</h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                </div>
                                <div class="modal-body text-center">
                                    <img id="floorPlanPreviewImage" src="" alt="平面圖" class="img-fluid">
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                document.body.insertAdjacentHTML('beforeend', modalHTML);
                previewModal = document.getElementById('floorPlanPreviewModal');
            }
            
            // 更新圖片URL
            const previewImage = document.getElementById('floorPlanPreviewImage');
            if (previewImage) {
                previewImage.src = url;
                
                // 錯誤處理
                previewImage.onerror = function() {
                    this.src = 'https://via.placeholder.com/800x600?text=圖片載入失敗';
                };
            }
            
            // 顯示模態框
            const modal = new bootstrap.Modal(previewModal);
            modal.show();
        },
        
        // 刷新數據
        refreshData: function() {
            this.loadData();
        }
    };
    
    // 在瀏覽器環境中，將模組附加到全局App對象
    if (typeof window !== 'undefined' && window.App) {
        window.App.museumModule = MuseumModule;
    }
    
    // 在Node.js環境中(測試環境),將模組導出
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = MuseumModule;
    } 
   