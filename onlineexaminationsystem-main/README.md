# ExamPro - Online Examination System

A complete, production-ready full-stack online examination system built with Node.js, React, PostgreSQL, and Redis.

## Features

- Role-based Authentication (Admin, Faculty, Student)
- Real-time Live Exam Monitoring with Socket.io
- Interactive, Timer-based Exam Interface with tab-switching detection
- Rich Administrative Dashboard & Analytics
- Automated Examination Grading and Ranking
- Scalable design deployed via Docker Compose

## Prerequisites

- Docker and Docker Compose
- Node.js 20+ (if running locally without Docker)

## Quick Start (Docker)

1. Clone the repository
2. Environment configuration:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and fill the variables (especially generating a JWT secret).
3. Build and launch the containers:
   ```bash
   docker-compose up --build
   ```
4. Run migrations and seed the database:
   ```bash
   docker-compose exec backend npx sequelize-cli db:migrate
   docker-compose exec backend npx sequelize-cli db:seed:all
   ```
5. Open http://localhost in your browser.

## Project Architecture

- **Frontend**: React 18, Vite, Tailwind CSS, shadcn/ui, Recharts
- **Backend**: Node.js, Express, Sequelize, Socket.io
- **Database**: PostgreSQL 15, Redis 7

## Demo Credentials

Pending seeding configuration. Admin details will be auto-generated during the seeding phase.
