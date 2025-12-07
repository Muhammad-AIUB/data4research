# 🏥 Data4Research - Advanced Patient Management System

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-16.0.7-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue?style=for-the-badge&logo=postgresql)
![Prisma](https://img.shields.io/badge/Prisma-7.1.0-2D3748?style=for-the-badge&logo=prisma)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)

**A comprehensive, research-focused patient data management platform with intelligent features for medical professionals**

[Live Demo](https://data4research.vercel.app) • [Documentation](#features) • [Tech Stack](#tech-stack)

</div>

---

## 🎯 Quick Highlights - Why This Project Stands Out

**Keywords**: Full-Stack Development • Next.js 16 • React 19 • TypeScript • Real-Time Unit Conversion • Intelligent Automation • Medical Data Management • Performance Optimization • User Experience Design • Database Architecture • API Development • Business Impact • ROI Optimization

**Key Features Implemented**: 
- ⭐ **Field-Level Favourite System** - localStorage-based, mark individual fields as favourites
- 🔄 **Real-Time Unit Conversion** - Bidirectional auto-conversion (mg/dL↔mmol/L, °C↔°F, kg↔lbs)
- 🧮 **Auto-Calculations** - BMI, MAP, TSAT, eGFR automatically calculated
- 📊 **7 Test Categories** - 350+ medical fields with modal-based entry
- 🔍 **Advanced Search** - Multi-field search with PostgreSQL full-text
- 🛡️ **Data Validation** - Client + Server validation (Zod + Prisma)

**Technical Excellence**: 
- 🚀 **Modern Stack**: Next.js 16 (App Router), React 19, TypeScript 5
- 🛡️ **Type Safety**: 100% TypeScript coverage with custom types
- ⚡ **Performance**: Server Components, SWR caching, optimized queries
- 🎨 **UX Innovation**: Field-level favourites, real-time conversions, auto-calculations
- 🏗️ **Architecture**: Clean code, proper patterns, production-ready

**Unique Features**:
- ⭐ **Intelligent Favourite Fields** - Field-level granularity (not found in typical apps)
- 🔄 **Real-Time Unit Conversion** - Bidirectional auto-conversion (mg/dL↔mmol/L, °C↔°F, kg↔lbs)
- 🧮 **Auto-Calculations** - BMI, MAP, TSAT, eGFR, Ideal Body Weight
- 📊 **7 Test Categories** - 350+ medical fields with smart data entry
- 🔍 **Advanced Search** - Multi-field search with PostgreSQL full-text

---

## ✨ Unique Features (What Makes This Different?)

**Not just another CRUD app** - This solves real healthcare data entry problems with innovative automation.

### 🎯 Top 7 Innovations

1. **⭐ Field-Level Favourite System** - Mark individual input fields as favourites (not report-level). Uses localStorage for instant access. Implemented in `src/lib/favourites.ts` with field-level granularity.

2. **🔄 Real-Time Unit Conversion** - Auto bidirectional conversion implemented in modals: mg/dL↔mmol/L (Cardiology, RFT, LFT), °C↔°F (Disease History), kg↔lbs (Disease History), cm↔feet/inches (Disease History). See `src/components/modals/` for implementation.

3. **🧮 Auto-Calculations** - BMI (from height/weight), MAP (from BP), TSAT (from iron/TIBC), eGFR, Ideal Body Weight - all implemented with real-time calculation in modals.

4. **📊 7 Test Categories (350+ Fields)** - Autoimmuno Profile (80+ fields), Cardiology, RFT, LFT, Disease History, Imaging, Hematology. Each modal in `src/components/modals/` with 50+ specialized fields.

5. **📅 Smart Date Management** - Custom calendar component (`src/components/CalendarWithNavigation.tsx`) with quick navigation buttons. Individual date pickers in each modal (`src/components/ModalDatePicker.tsx`).

6. **🔍 Advanced Search** - Multi-field search implemented in `src/app/dashboard/patients/page.tsx` - searches Name, Mobile, Patient ID, Diagnosis, Tags. Uses PostgreSQL `contains` with case-insensitive mode.

7. **🛡️ Data Integrity** - Client validation with Zod schema (`src/app/dashboard/add-patient/page.tsx`), server validation in API routes (`src/app/api/patients/route.ts`). Auto Patient ID generation if not provided. Full TypeScript coverage.

---

## 💰 Business Value (How This Helps Users)

### ⏱️ Time Savings Features
- **Favourite Fields**: Quick access to frequently used fields saves repetitive typing
- **Auto Unit Conversion**: No manual calculation needed - saves time and prevents errors
- **Auto-Calculations**: BMI, MAP, TSAT calculated automatically - no manual math
- **Smart Date Navigation**: Quick date buttons (-1Y, -1M, -5d, etc.) for faster date selection

### 🎯 Error Prevention
- **Client + Server Validation**: Zod schema validation prevents invalid data entry
- **Type Safety**: TypeScript catches errors at compile time
- **Auto Unit Conversion**: Eliminates manual conversion calculation errors
- **Required Field Validation**: Ensures all critical data is captured

### 📈 Scalability Features
- **Efficient Data Entry**: Modal-based forms with favourite fields for faster input
- **Search Functionality**: Quick patient lookup by name, mobile, ID, diagnosis, or tags
- **Date-Grouped Reports**: Easy chronological tracking of test results
- **Organized Data Structure**: Proper database schema for easy querying and analysis

---

## 🚀 Tech Stack

### Frontend
- **Next.js 16.0.7** (App Router, Server Components, Turbopack)
- **React 19.2.0** (Latest features, Suspense boundaries)
- **TypeScript 5.0** (Full type safety)
- **Tailwind CSS 4.0** (Modern utility-first styling)
- **Shadcn/ui** (Accessible component library)
- **React Hook Form** + **Zod** (Form validation)
- **SWR** (Data fetching with caching)

### Backend
- **Next.js API Routes** (Serverless functions)
- **NextAuth v4** (Authentication with role-based access)
- **Prisma 7.1.0** (Type-safe ORM)
- **PostgreSQL** (Relational database)
- **bcryptjs** (Password hashing)

### DevOps & Deployment
- **Vercel** (Serverless deployment)
- **GitHub** (Version control)
- **Prisma Migrate** (Database migrations)

---

## 🎨 Core Features

**Authentication**: NextAuth v4 with role-based access (ADMIN/DOCTOR)  
**Patient Management**: Registration, auto ID generation, tags, search  
**Test Reports**: 7 categories, 350+ fields, modal-based entry, date-grouped  
**Favourite System**: Field-level favourites, localStorage, quick access  
**Unit Conversion**: Real-time bidirectional (mg/dL↔mmol/L, °C↔°F, kg↔lbs)  
**Auto-Calculations**: BMI, MAP, TSAT, eGFR, Ideal Body Weight  
**Data Display**: Readable format (not JSON), date-grouped, searchable  
**UX**: Responsive, loading states, error handling, success notifications

---

## 🏗️ Architecture

**Next.js Patterns**: Server/Client Components, Suspense, API Routes, Middleware  
**Database**: PostgreSQL with Prisma ORM, normalized schema, JSON fields, cascade deletes  
**Code Quality**: 100% TypeScript, ESLint, type-safe queries, Zod validation, error boundaries

---

## 📦 Project Structure

```
src/
├── app/
│   ├── api/              # REST API (patients, tests, auth)
│   ├── dashboard/        # Protected routes (add-patient, patients, favourites)
│   └── login/            # Authentication
├── components/
│   ├── modals/           # 7 test report modals
│   └── ui/               # Shadcn components
├── lib/                  # Utilities (prisma, auth, favourites, formatting)
└── types/                # TypeScript definitions
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/Muhammad-AIUB/data4research.git
cd data4research

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database URL and NextAuth secrets

# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# (Optional) Seed the database
npx prisma db seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

---

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/data4research"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

---

## 📈 Performance & Quality

**Optimizations**: Server Components, SWR caching, Prisma query optimization, code splitting, Turbopack  
**Quality**: 100% TypeScript, ESLint, type-safe operations, Zod validation, error boundaries

---

## 👨‍💻 Developer

**Muhammad Jubayer**  
*Full-Stack Developer*

- 🌐 [Portfolio](https://your-portfolio.com)
- 💼 [LinkedIn](https://linkedin.com/in/your-profile)
- 📧 Email: mjubayer.aiub@gmail.com
- 🐙 GitHub: [@Muhammad-AIUB](https://github.com/Muhammad-AIUB)

---

## 🏆 For Recruiters

### Technical Skills Demonstrated
✅ **Full-Stack**: Next.js 16, React 19, TypeScript, PostgreSQL, Prisma  
✅ **Modern Patterns**: Server Components, Suspense boundaries, API Routes, Type-safe database  
✅ **Problem-Solving**: Real-world solutions (favourite fields, unit conversion, auto-calculations)  
✅ **Code Quality**: 100% TypeScript, ESLint, clean architecture, proper error handling  
✅ **DevOps**: Vercel deployment, Prisma migrations, environment management  

### What Makes This Different
✅ **Innovation**: Field-level favourite system (not typical in CRUD apps)  
✅ **User-Centric**: Features designed to reduce repetitive work (favourites, auto-conversions)  
✅ **Data Quality**: Client + Server validation, type safety, error prevention  
✅ **Scalable Design**: Proper database schema, efficient queries, organized code structure

---

<div align="center">

**Built with ❤️ for Medical Research**

⭐ Star this repo if you find it interesting!

</div>
