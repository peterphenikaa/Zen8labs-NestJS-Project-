<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

# Zen8labs-NestJS-Project

## Tổng quan

Đây là project backend NestJS kết hợp frontend HTML/CSS/JS thuần, mô phỏng hệ thống mạng xã hội với các chức năng:

- Đăng ký, đăng nhập, xác thực JWT
- Quản lý session, token, refresh token
- Dashboard giao diện giống Instagram
- Chat real-time bằng WebSocket (socket.io)
- Lưu cache bằng Redis và Memory
- Quản lý user, bài viết, gợi ý bạn bè, stories

## Cấu trúc thư mục

- `src/` : Mã nguồn backend NestJS
  - `modules/auth/` : Đăng nhập, đăng ký, xác thực, quản lý token
  - `modules/chat/` : Chat real-time (gateway, module)
  - `modules/user/`, `posts/`, ... : Các module quản lý user, bài viết
  - `app.controller.ts` : Controller chính, render view
  - `app.module.ts` : Khai báo các module
- `views/` : Các file pug cho giao diện (login, dashboard, ...)
- `public/css/` : File CSS cho giao diện
- `public/js/` : File JS cho chat real-time
- `frontend/` : Giao diện HTML/CSS/JS thuần cho đăng nhập, đăng ký
- `prisma/` : Quản lý database, migration

## Chức năng chính

- **Đăng ký/Đăng nhập:**
  - Giao diện: `views/login.pug` hoặc `frontend/index.html`
  - API: `POST /v1/auth/register`, `POST /v1/auth/login`
  - Lưu token vào localStorage sau khi đăng nhập thành công
- **Dashboard:**
  - Giao diện: `views/dashboard.pug`
  - Hiển thị sidebar, stories, gợi ý bạn bè, feed bài viết
- **Chat real-time:**
  - Gateway: `src/modules/chat/chat.gateway.ts`
  - JS client: `public/js/chat.js`
  - Giao diện chat: khung chat trong dashboard
- **Quản lý token:**
  - AccessToken hết hạn sau 30s, tự động logout về trang đăng nhập
  - RefreshToken dùng để gia hạn phiên (có thể mở rộng logic tự động refresh)
- **Logout:**
  - API: `POST /v1/auth/logout` (gửi refreshToken)
  - Frontend tự động gọi khi hết hạn hoặc nhấn nút logout

## Cách test project

1. **Cài đặt:**
   - Cài Node.js, npm
   - Chạy `npm install` để cài dependencies
   - Cài và khởi động Redis nếu dùng cache
2. **Khởi động backend:**
   - Chạy `npm run start:dev` để khởi động NestJS
3. **Test đăng nhập/đăng ký:**
   - Truy cập `http://localhost:3000/v1/auth/login` để đăng nhập
   - Truy cập `http://localhost:3000/v1/auth/register` để đăng ký
   - Kiểm tra localStorage để xem token
4. **Test dashboard:**
   - Truy cập `http://localhost:3000/dashboard` để xem giao diện Instagram clone
5. **Test chat real-time:**
   - Mở dashboard ở 2 tab trình duyệt, gửi tin nhắn để kiểm tra chat
6. **Test logout:**
   - Đợi 30s hoặc nhấn nút logout để kiểm tra tự động logout

## Lưu ý

- Các endpoint API đều ở `/v1/auth/*`
- Giao diện sử dụng pug, CSS hiện đại, JS thuần
- Có thể mở rộng thêm các module, chức năng khác theo nhu cầu

---

Nếu cần hướng dẫn chi tiết hoặc bổ sung chức năng, hãy xem code từng module hoặc liên hệ người phát triển.
