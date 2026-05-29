# 项目目录

```text
小米数管理/
  backend/
    app/
      api/          FastAPI 路由
      core/         配置、数据库、安全工具
      models/       SQLAlchemy ORM 模型
      schemas/      Pydantic 请求/响应结构
      services/     业务服务
      main.py       后端入口
      seed_admin.py 初始化管理员
    .env            本地环境变量
    .env.example    环境变量模板
    requirements.txt
  frontend/
    assets/
      css/
      js/
    login.html
    admin.html
    home.html
    product-entry.html
    product-search.html
  docs/
  README.md
```
