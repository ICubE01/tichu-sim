# Tichu Sim

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.0.3-6DB33F?logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19.2.0-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![AWS](https://img.shields.io/badge/AWS-Integrated-232F3E?logo=amazon-aws&logoColor=white)](https://aws.amazon.com/)

**Tichu Sim**은 인기가 높은 4인용 팀 카드 게임인 '티츄(Tichu)'를 웹에서 실시간으로 즐길 수 있도록 구현한 풀스택 시뮬레이션
프로젝트입니다. 복잡한 게임 규칙을 정교하게 엔진화하고, WebSocket을 통한 실시간 동기화와 현대적인 UI/UX를 결합하여 사용자에게
프리미엄 카드 게임 경험을 제공합니다.

[접속](https://tichu-sim.com/)

---

## 🚀 주요 기능 (Key Features)

### 1. 자율적 매치메이킹
- 사용자가 자율적으로 방을 생성하거나 방에 참가하여 게임을 플레이합니다.

### 2. 실시간 멀티플레이어 동기화
- **WebSocket (STOMP)** 기반의 실시간 양방향 통신을 통해 4명의 플레이어가 지연 없이 게임 상태를 공유합니다.
- 실시간 채팅 기능을 지원합니다.

### 3. 정교한 티츄 게임 엔진
- **Trick & Bomb 판정**: 싱글, 페어, 스트레이트 등 모든 족보 및 폭탄에 대한 엄격한 검증 로직을 제공합니다.
- **특수 카드 구현**: 참새(Sparrow)의 소원 빌기, 개(Dog)의 차례 넘기기, 봉황(Phoenix)의 조커 기능, 용(Dragon)의 승리 처리를 완벽하게 지원합니다.
- **Tichu 선언**: 라지 티츄(Large Tichu) 및 스몰 티츄(Small Tichu) 선언과 그에 따른 점수 산정 로직이 포함되어 있습니다.

---

## 🛠 기술 스택 (Tech Stack)

### Backend
- **Core**: Java 21, Spring Boot 4.0.3
- **Security**: Spring Security, JWT (JSON Web Token)
- **Communication**: Spring WebSocket (STOMP)
- **Data**: Spring Data JPA, MySQL, Flyway
- **Tooling**: Lombok, MapStruct

### Frontend
- **Core**: React 19, TypeScript
- **Build Tool**: Vite
- **Networking**: Axios, Stomp.js
- **Styling**: Vanilla CSS (Modern Design System)

### Infrastructure & DevOps
- **Cloud**: AWS Lightsail
- **CI/CD**: GitHub Actions
- **Container**: Docker, Docker Compose

---

## 📸 스크린샷 (Screenshots)

<img width="1000" alt="Room Page" src="https://github.com/user-attachments/assets/71b9e53f-d8a1-4d16-a67c-4c02cc8933e5" />

<img width="1000" alt="Tichu Page" src="https://github.com/user-attachments/assets/ce1a247e-2fc4-4ed4-b071-e74ccee2e695" />

---

## 📄 라이선스 (License)
이 프로젝트는 개인 포트폴리오 용도로 제작되었으며, 상업적 이용을 금합니다.
Copyright © 2026 ICubE. All rights reserved.
