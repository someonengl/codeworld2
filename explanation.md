# CodeWorld LMS 2.0 | Documentation & Explanation

CodeWorld is a next-generation Learning Management System (LMS) specifically designed for competitive programming, algorithmic learning, and classroom management. It provides a high-performance environment for students to master algorithms and for teachers to manage educational groups.

---

## 🚀 Core Architecture

- **Framework**: Next.js 15+ (App Router)
- **Database**: Supabase (PostgreSQL + Auth + Real-time)
- **Styling**: Tailwind CSS v4 + Vanilla CSS for premium aesthetics
- **Animations**: Framer Motion for high-impact visual feedback
- **Components**: Lucide React for iconography

---

## 📂 Page-by-Page Explanation

### 1. Landing Page (`/`)
The entry point of the application. It features a high-end, futuristic design with vertical animations and a "Bento Grid" showcasing core features.
- **Key Features**: Direct CTAs to Register/Login, high-level overview of the platform's capabilities.
- **Responsive**: Fully optimized for mobile with adaptive typography.

### 2. Authentication (`/login`, `/register`, `/auth/*`)
Custom-built authentication flows powered by Supabase.
- **Registration**: Users can sign up and are then prompted to choose a role (Teacher or Student).
- **Username Setup**: A dedicated onboarding step to ensure every user has a unique identity.

### 3. Dashboard (`/dashboard`)
The central hub for all users, dynamically adapting based on the user's role.
- **Student View**:
    - **Stats**: Real-time tracking of problems solved, XP earned, and contributions made.
    - **Classrooms**: List of joined groups with status indicators (Pending/Approved).
    - **Announcements**: Global updates from admins.
- **Teacher View**:
    - **Group Management**: Teachers can create new "Classroom Hubs" with unique join codes.
    - **Pending Requests**: Visual badges showing how many students are waiting to join their groups.

### 4. Global Archive (`/archive`)
A public repository of algorithmic challenges contributed by the community.
- **Discovery**: Search and filter through problems created by various teachers.
- **Contribution**: Any authorized user can "Contribute" a new problem to the global archive, including test cases and descriptions.

### 5. Learning Topics (`/topics`)
A curated curriculum designed to take students from beginners to elite competitors.
- **Roadmap**: Categorized sections (e.g., Basic Syntax, Data Structures, Advanced Algorithms).
- **Resources**: Each topic links to high-quality external resources and internal practice problems.

### 6. Classroom Hubs (`/group/[id]`)
Private learning environments where teachers have full control.
- **Teacher Controls**: Post exclusive problems, moderate students, and view detailed submission histories for every student.
- **Student Experience**: Access group-specific challenges and track progress within that specific curriculum.

### 7. Contest Arena (`/contest/[id]`)
A specialized environment for time-limited competitive programming contests.
- **Live Mode**: Problems are hidden until the contest starts. A countdown shows remaining time.
- **Upsolving Mode**: After a contest ends, students can still solve the problems for practice.
- **Ranking**: Integrated tracking of submissions within the contest timeframe.

### 8. Problem Solving Interface (`/solve/[problem_id]`)
The "Battleground" where the actual coding happens.
- **Multi-Language Support**: Submit solutions in C++, Python, Java, etc.
- **Real-Time Judging**: Solutions are executed against hidden test cases in a sandboxed environment.
- **Instant Feedback**: Verdicts like `AC` (Accepted), `WA` (Wrong Answer), `TLE` (Time Limit Exceeded), etc.
- **History**: Students can view their past attempts, while teachers can see all students' code.

### 9. User Profiles (`/profile/[username]`)
Public-facing pages for users to showcase their achievements.
- **Stats & Badges**: Displaying the user's solved problems and contribution history.

### 10. Admin Control Panel (`/admin`)
A restricted area for Super-Admins to manage the platform.
- **Moderation**: Approve or reject contributed problems and translations.
- **User Management**: Handle bans and permission elevations.

---

## 🛠️ Specialized Features

### Community Translations
Problems can be translated into multiple languages by the community. This allows CodeWorld to be a truly global platform where logic is universal, but explanations are localized.

### Multi-Language Judging
A robust backend system (often using a judge-api or serverless functions) that handles code execution with strict time and memory limits.

### Custom Aesthetic Engine
The site uses a custom "Noise Texture" overlay and dynamic "Blob" backgrounds to create a premium, state-of-the-art feel that differentiates it from traditional, "boring" LMS platforms.

---

## 📱 Mobile Support
The entire platform is built with a mobile-first mindset:
- **Hamburger Menu**: Accessible navigation on small screens.
- **Smart Pointer Detection**: Custom cursor effects are disabled on touch devices to ensure native fluidity.
- **Adaptive Grids**: Bento grids and stats rows automatically stack on phones.
