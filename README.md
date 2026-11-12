# Visit Flow – Visitor Management System

## Tech Stack

- Node.js
- Express.js
- SQLite
- JWT

## Requirements

- Node.js
- npm

## Setup

Install dependencies:

```bash
npm install
```

Create a `.env` file in the root directory:

```env
JWT_SECRET=your-secret-key
```

Seed database:

```bash
npm run seed
```

Start:

```bash
npm run dev
```

The app will run at:

`http://localhost:3000`

## Technical Decisions

### 1. Node.js and Express.js

Node.js dipilih agar frontend dan backend dapat dikembangkan menggunakan JavaScript. Selain itu, Node.js memiliki ekosistem yang luas, cukup ringan, dan mudah untuk dikembangkan. Sedangkan, Express.js digunakan karena cukup ringan dan mudah digunakan untuk membuat REST API yang dibutuhkan oleh aplikasi ini.

### 2. SQLite

SQLite dipilih karena mudah digunakan dan dikonfigurasi. Selain itu, SQLite sangat cocok digunakan untuk membangun aplikasi kecil seperti ini.

## Limitations

- Hanya terdapat satu akun login
- Tidak ada data nama sales
- Tidak bisa menghapus data
- Data aktivitas yang bisa diubah hanya atribut status
- Tidak ada registrasi akun

## AI Usage

Bantuan AI digunakan dalam membangun aplikasi ini dengan persentase 20%. AI digunakan dalam penyempurnaan konfigurasi database, seeding, fungsi autentikasi, api entitas, autocomplete, dan penulisan dokumentasi pada README.

## Notes

FE: https://github.com/zulfiqarshafar/visit-flow-fe
