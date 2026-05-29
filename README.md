# 小米数管理系统

纺织工厂尾部小米数管理系统，采用前后端分离结构。

## 技术栈

- 后端：Python、FastAPI、SQLAlchemy ORM、PostgreSQL
- 前端：HTML、CSS、JavaScript
- 数据库：PostgreSQL

## 页面

- `frontend/login.html`：员工登录
- `frontend/admin.html`：后台管理，管理员创建员工账号
- `frontend/home.html`：员工主页
- `frontend/product-entry.html`：产品尾布录入
- `frontend/product-search.html`：产品查询

## 本地启动

进入后端目录：

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m app.seed_admin
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

浏览器打开：

```text
frontend/login.html
```

默认管理员：

```text
账号：admin
密码：admin123456
```

上线前必须修改默认管理员密码和 `SECRET_KEY`。

登录状态默认保存在当前设备，不设置自动过期；点击退出登录后才会清除。

## 数据库连接

当前本地数据库连接：

```text
postgresql+psycopg://user3:ct20082009@localhost:5432/xiaomishu
```

部署到腾讯云时，建议将数据库密码、密钥等放入服务器环境变量或 `.env` 文件，不要提交到代码仓库。

## 腾讯云部署建议

- 后端部署在 CVM，使用 `uvicorn` 或 `gunicorn + uvicorn worker`
- 前端静态文件交给 Nginx
- PostgreSQL 可以用本机 PostgreSQL 或 TencentDB for PostgreSQL
- 生产环境只开放 `80`、`443` 和必要的 SSH 端口
- 数据库端口不要直接暴露公网
- 配置自动备份
