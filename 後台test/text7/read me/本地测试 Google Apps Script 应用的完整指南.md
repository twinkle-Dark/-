# 本地测试 Google Apps Script 应用的完整指南

## 1. 背景与目标

Google Apps Script (GAS) 是一个基于云端的脚本平台，允许开发者创建与 Google 产品集成的应用。然而，在本地测试 GAS 应用面临一些挑战：

- GAS 代码设计为在 Google 云端运行
- 直接访问 Google 服务（如 SpreadsheetApp）需要身份验证
- 预览更改需要每次部署代码

**本指南目标**：创建一个本地测试环境，允许你无需连接到 Google 服务即可开发和测试 GAS 应用。

## 2. 项目准备

### 2.1 基础工具安装

1. **安装 Node.js 和 npm**

   ```bash
   # 检查是否已安装
   node --version
   npm --version

   # 如未安装，访问 https://nodejs.org/ 下载并安装
   ```

2. **创建项目目录结构**

   ```
   /your-project/
   ├── /src/                 # 源代码
   │   ├── /modules/         # JavaScript 模块
   │   └── index.html        # HTML 界面
   ├── /tests/               # 测试文件
   ├── /mocks/               # 模拟对象
   ├── package.json          # 项目配置
   └── jest.config.js        # Jest 配置
   ```

3. **初始化项目**

   ```bash
   # 进入项目目录
   cd your-project

   # 初始化 npm 项目
   npm init -y

   # 安装测试相关依赖
   npm install --save-dev jest jest-environment-jsdom
   ```

4. **配置 package.json**
   ```json
   {
     "scripts": {
       "test": "jest",
       "test:watch": "jest --watch"
     }
   }
   ```

## 3. 创建 GAS 模拟环境

### 3.1 基本 GAS 服务模拟

创建 `mocks/gas-service.js` 文件来模拟 GAS 的核心服务：

```javascript
// mocks/gas-service.js

// 模拟数据库
const mockDatabase = {
  Museums: [
    [
      "ID",
      "名称",
      "展厅ID",
      "展厅",
      "厅别",
      "描述",
      "平面图",
      "地址",
      "联络信息",
      "状态",
      "备注",
    ],
    [
      "mus001",
      "国立史前文化博物馆",
      "hall001",
      "主展厅",
      "常设展",
      "介绍史前文化",
      "",
      "台东市",
      "089-123456",
      "运营中",
      "",
    ],
  ],
  Users: [
    ["ID", "Email", "名称", "角色", "建立日期", "最后登入", "账号状态"],
    [
      "user001",
      "admin@example.com",
      "管理员",
      "01",
      "2023-01-01",
      "2023-05-01",
      "一般",
    ],
    [
      "user002",
      "staff@example.com",
      "工作人员",
      "00",
      "2023-02-15",
      "2023-04-28",
      "一般",
    ],
  ],
  FormTemplates: [
    [
      "ID",
      "表单名称",
      "表单类型",
      "版本",
      "使用中",
      "创建日期",
      "最后修改日期",
      "创建者",
      "描述",
      "备注",
    ],
    [
      "form001",
      "观众基本资料表",
      "调查表单",
      "1.0",
      "是",
      "2023-01-15",
      "2023-03-20",
      "admin",
      "收集观众基本信息",
      "",
    ],
  ],
  VisitorInfo: [
    ["访客ID", "年龄", "性别", "居住地", "教育程度", "访问日期", "访问次数"],
    ["vis001", "28", "男", "台北市", "大学", "2023-04-01", "2"],
  ],
  VisitorInteractions: [
    [
      "交互ID",
      "访客ID",
      "展品ID",
      "停留时间(分)",
      "交互类型",
      "反馈评分",
      "记录时间",
      "记录者",
    ],
    [
      "int001",
      "vis001",
      "exh001",
      "4.5",
      "观看",
      "5",
      "2023-04-01 14:30",
      "staff001",
    ],
  ],
  control: [
    ["配置项", "值"],
    ["frontendUrl", "https://example.com/frontend"],
  ],
};

// SpreadsheetApp 模拟
class SpreadsheetApp {
  static openById(id) {
    return {
      getSheetByName: (name) => {
        if (!mockDatabase[name]) {
          console.warn(`模拟表格 "${name}" 不存在`);
          mockDatabase[name] = [["无数据"]];
        }

        return {
          getDataRange: () => ({
            getValues: () => mockDatabase[name],
          }),
          getRange: (cell) => {
            // 简单解析 A1 格式，如 "A2"
            const rowMatch = cell.match(/\d+/);
            const colMatch = cell.match(/[A-Z]+/);

            if (rowMatch && colMatch) {
              const row = parseInt(rowMatch[0]) - 1; // 转为0基索引
              const col = colMatch[0].charCodeAt(0) - 65; // A=0, B=1, etc.

              return {
                getValue: () => {
                  try {
                    return mockDatabase[name][row][col] || "";
                  } catch (e) {
                    return "";
                  }
                },
                setValue: (value) => {
                  try {
                    mockDatabase[name][row][col] = value;
                  } catch (e) {
                    console.error("无法设置值:", e);
                  }
                },
              };
            }

            return {
              getValue: () => "",
              setValue: () => {},
            };
          },
        };
      },
    };
  }
}

// HtmlService 模拟
class HtmlService {
  static createTemplateFromFile(filename) {
    return {
      evaluate: () => ({
        setTitle: (title) => ({
          setFaviconUrl: (url) => ({
            addMetaTag: (name, content) => ({
              setXFrameOptionsMode: (mode) => ({
                getContent: () =>
                  `<html><head><title>${title}</title></head><body><div>模拟HTML内容: ${filename}</div></body></html>`,
              }),
            }),
          }),
        }),
      }),
    };
  }

  static createHtmlOutputFromFile(filename) {
    return {
      getContent: () => `<div>模拟HTML片段: ${filename}</div>`,
    };
  }

  static XFrameOptionsMode = {
    ALLOWALL: "ALLOWALL",
  };
}

// 导出模拟对象
const mockGasServices = {
  SpreadsheetApp,
  HtmlService,

  // 添加模拟数据以便测试
  mockDatabase,
};

// 设置全局变量
global.SpreadsheetApp = SpreadsheetApp;
global.HtmlService = HtmlService;

module.exports = mockGasServices;
```

### 3.2 模拟 GAS 脚本函数

创建 `mocks/gas-script.js` 文件以模拟你的 GAS 脚本函数：

```javascript
// mocks/gas-script.js
const { mockDatabase } = require("./gas-service");

// 常量定义
const SPREADSHEET_ID = "1NoGwkVzUjgufEMTJ4cvUDZHWA8dsv90y3cQn681rZyE"; // 模拟 ID

// 模拟脚本函数
function doGet() {
  const template = HtmlService.createTemplateFromFile("Index更新外观");
  const urlF = SpreadsheetApp.openById(SPREADSHEET_ID)
    .getSheetByName("control")
    .getRange("A2")
    .getValue();

  template.urlF = urlF; // 传递网址给 HTML

  return template
    .evaluate()
    .setTitle("博物馆观众行为调查系统")
    .setFaviconUrl("https://www.google.com/favicon.ico")
    .addMetaTag("viewport", "width=device-width, initial-scale=1")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getData() {
  return mockDatabase.Museums;
}

function getDataMuseums() {
  return mockDatabase.Museums;
}

function getDataUser() {
  return mockDatabase.Users;
}

function getDataForm() {
  return mockDatabase.FormTemplates;
}

function getDataVInfo() {
  return mockDatabase.VisitorInfo;
}

function getDataVInteractions() {
  return mockDatabase.VisitorInteractions;
}

function getFrontendUrl() {
  return "https://script.google.com/macros/s/AKfycbz0MIuYiSgU9NjnuuruO_lSJ9_DztWFZ9Amnj9Uwp-sR9QqlqQtSvoqwGFqtQgfLfW8CA/exec";
}

// 导出所有函数以便在测试中使用
module.exports = {
  doGet,
  getData,
  getDataMuseums,
  getDataUser,
  getDataForm,
  getDataVInfo,
  getDataVInteractions,
  getFrontendUrl,
  SPREADSHEET_ID,
};
```

## 4. 设置测试环境

### 4.1 Jest 配置文件

创建 `jest.config.js`：

```javascript
// jest.config.js
module.exports = {
  testEnvironment: "jsdom",
  setupFiles: ["./tests/setup-tests.js"],
  moduleNameMapper: {
    // 模拟静态资源
    "\\.(css|less|scss)$": "<rootDir>/mocks/style-mock.js",
    "\\.(jpg|jpeg|png|gif|svg)$": "<rootDir>/mocks/file-mock.js",
  },
  transform: {
    "^.+\\.js$": "babel-jest",
  },
  // 覆盖率报告配置
  collectCoverageFrom: ["src/**/*.js", "!**/node_modules/**"],
};
```

### 4.2 测试设置文件

创建 `tests/setup-tests.js`：

```javascript
// tests/setup-tests.js

// 导入 GAS 服务模拟
require("../mocks/gas-service");

// 导入模拟脚本函数
const gasScripts = require("../mocks/gas-script");

// 将脚本函数设为全局可用
Object.keys(gasScripts).forEach((key) => {
  if (typeof gasScripts[key] === "function") {
    global[key] = gasScripts[key];
  }
});

// 创建全局 App 命名空间
global.App = {
  dashboardModule: {},
  museumModule: {},
  userModule: {},
};

// 模拟 Bootstrap
global.bootstrap = {
  Modal: class Modal {
    constructor(element) {
      this.element = element;
    }

    static getInstance(element) {
      return new Modal(element);
    }

    show() {
      // 模拟显示模态框
      console.log("模拟显示模态框");
    }

    hide() {
      // 模拟隐藏模态框
      console.log("模拟隐藏模态框");
    }
  },
};

// 模拟 google.script.run
global.google = {
  script: {
    run: new Proxy(
      {},
      {
        get: function (target, prop) {
          // 如果访问的是 withSuccessHandler 或 withFailureHandler
          if (prop === "withSuccessHandler" || prop === "withFailureHandler") {
            return function (callback) {
              // 保存回调
              this[prop + "Callback"] = callback;
              return this;
            };
          }

          // 检查是否有对应的 GAS 脚本函数
          if (typeof gasScripts[prop] === "function") {
            return function (...args) {
              try {
                // 执行脚本函数
                const result = gasScripts[prop](...args);

                // 如果设置了成功回调，则调用
                if (this.withSuccessHandlerCallback) {
                  setTimeout(() => {
                    this.withSuccessHandlerCallback(result);
                  }, 10); // 添加短暂延迟模拟异步
                }

                return result;
              } catch (error) {
                // 如果设置了失败回调，则调用
                if (this.withFailureHandlerCallback) {
                  setTimeout(() => {
                    this.withFailureHandlerCallback(error);
                  }, 10);
                }
                throw error;
              }
            };
          }

          // 如果没有对应函数，返回一个模拟函数
          return function (...args) {
            console.warn(`调用未模拟的函数: ${prop}`, args);

            // 如果设置了成功回调，返回模拟数据
            if (this.withSuccessHandlerCallback) {
              setTimeout(() => {
                this.withSuccessHandlerCallback({});
              }, 10);
            }
          };
        },
      }
    ),
  },
};

// 设置基本 DOM 结构供测试使用
document.body.innerHTML = `
  <!-- 仪表板模块 -->
  <div class="tab-pane fade show active dashboard-module" id="dashboard">
    <div class="content-header">
      <h2><i class="bi bi-speedometer2"></i> 仪表板</h2>
      <div class="btn-group">
        <button class="btn btn-outline-primary" id="exportDashboardBtn">
          <i class="bi bi-download"></i> 汇出报表
        </button>
        <button class="btn btn-outline-primary" id="refreshDashboardBtn">
          <i class="bi bi-arrow-clockwise"></i> 重新整理
        </button>
      </div>
    </div>
    
    <!-- 时间区间选择器 -->
    <div class="time-range-selector mb-4" id="timeRangeSelector">
      <div class="btn-group">
        <button class="btn btn-outline-primary active" data-range="day">日</button>
        <button class="btn btn-outline-primary" data-range="week">周</button>
        <button class="btn btn-outline-primary" data-range="month">月</button>
      </div>
    </div>

    <!-- 数据卡片 -->
    <div class="row g-3 mb-4" id="dashboard-cards-container">
      <div class="col-md-3">
        <div class="dashboard-card draggable-card" data-card-id="recordCount">
          <h5 class="card-title">记录数量</h5>
          <p class="card-text" id="recordCount">0</p>
        </div>
      </div>
      <div class="col-md-3">
        <div class="dashboard-card draggable-card" data-card-id="popularExhibits">
          <h5 class="card-title">热门展区</h5>
          <p class="card-text" id="popularExhibits">0</p>
        </div>
      </div>
      <div class="col-md-3">
        <div class="dashboard-card draggable-card" data-card-id="avgStayTime">
          <h5 class="card-title">平均停留时间</h5>
          <p class="card-text" id="avgStayTime">0分</p>
        </div>
      </div>
    </div>
  </div>

  <!-- 用户管理模块 -->
  <div class="tab-pane fade" id="users">
    <h2>用户管理</h2>
    <div class="card">
      <div class="card-body">
        <button class="btn btn-primary mb-3" id="addUserBtn">
          <i class="bi bi-person-plus"></i> 新增用户
        </button>
        <div class="table-responsive">
          <table class="table table-striped">
            <thead>
              <tr>
                <th>ID</th>
                <th>Email</th>
                <th>名称</th>
                <th>角色</th>
                <th>建立日期</th>
                <th>最后登入</th>
                <th>帐号状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <!-- 表格内容将由JavaScript填充 -->
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
  
  <!-- 添加用户模态框 -->
  <div class="modal fade" id="userModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="userModalTitle">新增用户</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <form id="userForm">
            <input type="hidden" name="userId">
            
            <div class="mb-3">
              <label class="form-label">电子邮件</label>
              <input type="email" class="form-control" name="email" required>
            </div>
            
            <div class="mb-3">
              <label class="form-label">名称</label>
              <input type="text" class="form-control" name="name" required>
            </div>
            
            <div class="mb-3">
              <label class="form-label">角色</label>
              <select class="form-select" name="role" required></select>
            </div>
            
            <div class="mb-3">
              <label class="form-label">所属博物馆</label>
              <select class="form-select" name="museum"></select>
            </div>
            
            <div class="mb-3">
              <label class="form-label">帐号状态</label>
              <select class="form-select" name="status" required></select>
            </div>
            
            <div class="mb-3">
              <label class="form-label">用户ID预览</label>
              <div class="id-preview" id="userIdPreview"></div>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
          <button type="button" class="btn btn-primary" id="saveUserBtn">储存</button>
        </div>
      </div>
    </div>
  </div>
`;

// 静态资源模拟
require("../mocks/style-mock");
require("../mocks/file-mock");
```

### 4.3 静态资源模拟

创建模拟静态资源的文件：

```javascript
// mocks/style-mock.js
module.exports = {};
```

```javascript
// mocks/file-mock.js
module.exports = "test-file-stub";
```

## 5. 编写模块测试

### 5.1 用户模块测试示例

将你的 `userModule.js` 模块保存到 `src/modules/` 目录，然后创建测试文件：

```javascript
// tests/modules/userModule.test.js
// 导入模块
const userModule = require("../../src/modules/userModule");

// 在测试前将模块添加到 App 命名空间
App.userModule = userModule;

describe("用户管理模块", () => {
  // 每个测试前重置测试环境
  beforeEach(() => {
    // 重置表单
    document.getElementById("userForm").reset();
    // 清理 ID 预览
    document.getElementById("userIdPreview").textContent = "";
  });

  test("生成用户ID应符合预期格式", () => {
    // 测试 ID 生成功能
    const userId = App.userModule.generateUserId("test@example.com", "01");
    // 使用正则表达式检查格式是否正确
    expect(userId).toMatch(/^test\d{4}_01$/);
  });

  test("表单验证应正确识别无效表单", () => {
    // 创建一个表单元素
    const form = document.getElementById("userForm");

    // 测试空表单验证
    const result = App.userModule.validateForm(form);
    expect(result).toBe(false);

    // 检查是否正确标记了无效字段
    const emailField = form.querySelector('[name="email"]');
    expect(emailField.classList.contains("is-invalid")).toBe(true);
  });

  test("表单验证应通过有效表单", () => {
    // 创建并填充表单
    const form = document.getElementById("userForm");
    form.querySelector('[name="email"]').value = "valid@example.com";
    form.querySelector('[name="name"]').value = "测试用户";
    form.querySelector('[name="role"]').innerHTML =
      '<option value="01">管理员</option>';
    form.querySelector('[name="role"]').value = "01";
    form.querySelector('[name="status"]').innerHTML =
      '<option value="一般">一般</option>';
    form.querySelector('[name="status"]').value = "一般";

    // 测试表单验证
    const result = App.userModule.validateForm(form);
    expect(result).toBe(true);
  });

  test("保存新用户应生成ID并调用API", () => {
    // 创建并填充表单
    const form = document.getElementById("userForm");
    form.querySelector('[name="email"]').value = "new@example.com";
    form.querySelector('[name="name"]').value = "新用户";
    form.querySelector('[name="role"]').innerHTML =
      '<option value="00">一般使用者</option>';
    form.querySelector('[name="role"]').value = "00";
    form.querySelector('[name="status"]').innerHTML =
      '<option value="一般">一般</option>';
    form.querySelector('[name="status"]').value = "一般";

    // 模拟 google.script.run.saveUser 函数
    const saveUserSpy = jest.spyOn(google.script.run, "saveUser");

    // 执行保存操作
    App.userModule.saveUser();

    // 验证是否调用了 API
    expect(saveUserSpy).toHaveBeenCalled();

    // 验证传递给 API 的数据
    const userData = saveUserSpy.mock.calls[0][0];
    expect(userData.email).toBe("new@example.com");
    expect(userData.name).toBe("新用户");
    expect(userData.role).toBe("00");
    expect(userData.status).toBe("一般");
    expect(userData.userId).toMatch(/^new\d{4}_00$/);

    // 清理
    saveUserSpy.mockRestore();
  });

  test("编辑用户应正确填充表单", async () => {
    // 模拟用户数据
    const mockUserData = {
      userId: "user123",
      email: "edit@example.com",
      name: "编辑用户",
      role: "01",
      museum: "nmp",
      status: "一般",
    };

    // 创建一个返回模拟数据的函数
    google.script.run.getUserById = function () {
      setTimeout(() => {
        this.withSuccessHandlerCallback(mockUserData);
      }, 10);
    };

    // 模拟 Modal.show()
    const modalShowSpy = jest.spyOn(bootstrap.Modal.prototype, "show");

    // 调用编辑用户函数
    App.userModule.editUser("user123");

    // 等待异步操作完成
    await new Promise((resolve) => setTimeout(resolve, 20));

    // 验证表单是否正确填充
    const form = document.getElementById("userForm");
    expect(form.querySelector('[name="userId"]').value).toBe("user123");
    expect(form.querySelector('[name="email"]').value).toBe("edit@example.com");
    expect(form.querySelector('[name="name"]').value).toBe("编辑用户");

    // 验证是否显示了模态框
    expect(modalShowSpy).toHaveBeenCalled();

    // 清理
    modalShowSpy.mockRestore();
  });
});
```

### 5.2 仪表板模块测试示例

```javascript
// tests/modules/dashboardModule.test.js
// 导入模块
const dashboardModule = require("../../src/modules/dashboardModule");

// 在测试前将模块添加到 App 命名空间
App.dashboardModule = dashboardModule;

describe("仪表板模块", () => {
  // 每个测试前重置
  beforeEach(() => {
    // 重置过滤器
    App.dashboardModule.filters = {
      timeRange: "day",
      museum: "",
      exhibition: "",
    };

    // 重置数据缓存
    App.dashboardModule.dataCache = null;

    // 清理显示数据
    document.getElementById("recordCount").textContent = "0";
    document.getElementById("popularExhibits").textContent = "0";
    document.getElementById("avgStayTime").textContent = "0分";
  });

  test("加载数据应显示载入状态", () => {
    // 监控 showLoadingState 方法
    const showLoadingSpy = jest.spyOn(App.dashboardModule, "showLoadingState");

    // 调用加载数据方法
    App.dashboardModule.loadData();

    // 验证是否调用了显示载入状态方法
    expect(showLoadingSpy).toHaveBeenCalledWith(true);

    // 清理
    showLoadingSpy.mockRestore();
  });

  test("渲染仪表板应正确更新卡片数据", () => {
    // 模拟数据
    const mockData = {
      visitorCount: 25,
      volunteerCount: 8,
      recordCount: 142,
      avgStayTime: 4.5,
    };

    // 模拟图表渲染方法
    App.dashboardModule.renderVisitorTrendChart = jest.fn();
    App.dashboardModule.renderPopularAreasChart = jest.fn();

    // 调用渲染方法
    App.dashboardModule.renderDashboard(mockData);

    // 验证数据是否正确显示
    expect(document.getElementById("todayVisitors").textContent).toBe("25");
    expect(document.getElementById("activeVolunteers").textContent).toBe("8");
    expect(document.getElementById("monthlyRecords").textContent).toBe("142");
    expect(document.getElementById("avgStayTime").textContent).toBe("4.5分");

    // 验证是否调用了图表渲染方法
    expect(App.dashboardModule.renderVisitorTrendChart).toHaveBeenCalled();
    expect(App.dashboardModule.renderPopularAreasChart).toHaveBeenCalled();
  });

  test("切换时间范围应更新过滤器并重新加载数据", () => {
    // 模拟按钮点击事件
    const weekBtn = document.querySelector('[data-range="week"]');
    const clickEvent = new Event("click");

    // 监控 loadData 方法
    const loadDataSpy = jest.spyOn(App.dashboardModule, "loadData");

    // 设置事件监听
    App.dashboardModule.setupEventListeners();

    // 触发按钮点击
    weekBtn.dispatchEvent(clickEvent);

    // 验证过滤器是否更新
    expect(App.dashboardModule.filters.timeRange).toBe("week");

    // 验证是否重新加载数据
    expect(loadDataSpy).toHaveBeenCalled();

    // 清理
    loadDataSpy.mockRestore();
  });
});
```

## 6. 测试服务端 API 调用

### 6.1 模拟 API 调用测试

创建 `tests/api-calls.test.js`：

```javascript
// tests/api-calls.test.js
// 导入 GAS 脚本模拟
const gasScripts = require("../mocks/gas-script");

describe("Google Apps Script API 调用", () => {
  test("getDataMuseums 应返回博物馆数据", () => {
    // 直接调用模拟的 GAS 函数
    const result = gasScripts.getDataMuseums();

    // 验证返回的数据
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0][0]).toBe("ID"); // 第一行应是标题
  });

  test("通过 google.script.run 调用 getDataMuseums", (done) => {
    // 使用 google.script.run 接口调用
    google.script.run
      .withSuccessHandler((result) => {
        // 验证返回的数据
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
        done(); // 完成异步测试
      })
      .withFailureHandler((error) => {
        // 如果发生错误，让测试失败
        done.fail(error);
      })
      .getDataMuseums();
  });

  test("getFrontendUrl 应返回正确的 URL", () => {
    const url = gasScripts.getFrontendUrl();
    expect(url).toBe(
      "https://script.google.com/macros/s/AKfycbz0MIuYiSgU9NjnuuruO_lSJ9_DztWFZ9Amnj9Uwp-sR9QqlqQtSvoqwGFqtQgfLfW8CA/exec"
    );
  });

  test("doGet 应返回 HTML 输出", () => {
    const result = gasScripts.doGet();
    expect(result).toBeDefined();
    // 验证返回的是否包含 HTML 输出对象的典型方法
    expect(typeof result.getContent).toBe("function");
  });
});
```

## 7. 集成测试

### 7.1 模块间交互测试

```javascript
// tests/integration/module-interaction.test.js
// 导入所有模块
const dashboardModule = require("../../src/modules/dashboardModule");
const userModule = require("../../src/modules/userModule");
const museumModule = require("../../src/modules/museumModule");

// 在测试前将模块添加到 App 命名空间
App.dashboardModule = dashboardModule;
App.userModule = userModule;
App.museumModule = museumModule;

describe("模块间交互", () => {
  beforeEach(() => {
    // 创建事件监听系统
    App.events = {
      listeners: {},
      on: function (event, callback) {
        if (!this.listeners[event]) {
          this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
      },
      emit: function (event, data) {
        if (this.listeners[event]) {
          this.listeners[event].forEach((callback) => callback(data));
        }
      },
    };

    // 设置模块刷新方法
    App.dashboardModule.refreshData = jest.fn();
  });

  test("添加用户后应刷新仪表板", () => {
    // 假设添加用户会触发用户变更事件
    App.events.on("user:updated", () => {
      App.dashboardModule.refreshData();
    });

    // 模拟用户添加成功
    App.events.emit("user:updated", { action: "add", userId: "new123" });

    // 验证仪表板刷新方法是否被调用
    expect(App.dashboardModule.refreshData).toHaveBeenCalled();
  });

  test("模块应可通过事件系统共享数据", () => {
    // 设置数据接收器
    let receivedData = null;
    App.events.on("data:shared", (data) => {
      receivedData = data;
    });

    // 发送数据
    const testData = { key: "value", nested: { prop: true } };
    App.events.emit("data:shared", testData);

    // 验证数据是否正确传递
    expect(receivedData).toEqual(testData);
  });
});
```

## 8. 执行测试

### 8.1 运行单个测试文件

```bash
npx jest tests/modules/userModule.test.js
```

### 8.2 运行所有测试

```bash
npm test
```

### 8.3 监视模式（自动重新运行）

```bash
npm run test:watch
```

### 8.4 生成覆盖率报告

```bash
npm test -- --coverage
```

## 9. 常见问题与解决方案

### 9.1 模拟复杂的 GAS API

对于更复杂的 API 调用（如 DriveApp 或 DocumentApp），需要扩展模拟对象：

```javascript
// mocks/gas-extended.js
const DriveApp = {
  getFileById: (id) => ({
    getBlob: () => ({
      getDataAsString: () => '{"mockData": true}',
    }),
    getName: () => "mockFile.json",
  }),

  createFile: (name, content, mimeType) => ({
    getId: () => "new_file_id",
  }),
};

global.DriveApp = DriveApp;
```

### 9.2 处理 HTML 模板问题

GAS 的 HTML 模板使用 `<?= ... ?>` 语法，这在本地环境中无法直接解析。解决方案：

1. 在测试环境中使用替代模板：

```javascript
// mocks/template-processor.js
function processTemplate(templateString, data) {
  // 简单替换 <?= var ?> 语法
  return templateString.replace(/<\?=\s*([^?]*?)\s*\?>/g, (match, expr) => {
    try {
      // 尝试使用传入的数据求值
      return expr.split(".").reduce((obj, prop) => obj[prop], data) || "";
    } catch (e) {
      return "";
    }
  });
}

module.exports = { processTemplate };
```

### 9.3 处理外部库依赖

如需测试依赖 Bootstrap 等外部库的代码：

```javascript
// 在 setup-tests.js 中模拟 jQuery 和 Bootstrap
global.$ = global.jQuery = require("jquery");
require("bootstrap");
```

## 10. 最佳实践

### 10.1 使用依赖注入

修改代码以便更容易测试：

```javascript
// 原始代码
function loadData() {
  const data = google.script.run.getDataMus
```
