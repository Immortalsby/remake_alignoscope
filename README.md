# Alignoscope Next

重新编写 alignoscope，使用最新的技术栈：

- Next.js 14
- TypeScript
- Radix UI
- next-intl
- PostgreSQL

## 开发环境设置

首先，运行开发服务器：

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

在浏览器中打开 [http://localhost:3000](http://localhost:3000) 查看结果。

## 数据库设置

项目使用 Docker Compose 来管理数据库：

```bash
docker-compose up -d
```

## 国际化

项目支持多语言：
- 中文 (zh)
- 英文 (en)
- 法文 (fr)

## 部署

项目可以部署到任何支持 Next.js 的平台。
