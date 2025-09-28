# 📚 Vidyavichar  

Vidyavichar is a **MERN-based interactive learning platform** that enables students to ask questions, teaching assistants (TAs) to manage and mark queries, and teachers to provide structured guidance.  

---

## 🚀 Tech Stack  
- **MongoDB** – Database for storing users, classes, and questions.  
- **Express.js** – Backend framework to handle routes and APIs.  
- **React.js** – Frontend framework for building interactive UI.  
- **Node.js** – Runtime environment for server-side code.  

---

## 📂 Project Structure  

```
vidyavichar_project/
    ├── backend/
        ├── .env
        ├── package-lock.json
        ├── package.json
        └── server.js
        ├── config/
            └── db.js
        ├── controllers/
            ├── authController.js
            ├── classController.js
            └── questionController.js
        ├── middleware/
            └── auth.js
        ├── models/
            ├── Class.js
            ├── Question.js
            └── User.js
        ├── routes/
            ├── auth.js
            ├── classes.js
            └── questions.js
    ├── frontend/
        ├── .env
        └── package.json
        ├── public/
            └── index.html
        ├── src/
            ├── App.js
            └── index.js
            ├── components/
                ├── Auth/
                    ├── Login.js
                    └── Register.js
                ├── Classes/
                    ├── ClassCreationForm.js
                    └── ClassSelector.js
                ├── Dashboard/
                    ├── StudentDashboard.js
                    ├── TADashboard.js
                    └── TeacherDashboard.js
                ├── Layout/
                    └── Navbar.js
                ├── Questions/
                    ├── QuestionForm.js
                    ├── StudentStickyNote.js
                    ├── TAStickyNote.js
                    └── TeacherStickyNote.js
            ├── contexts/
                └── AuthContext.js
            ├── services/
                └── api.js
            ├── styles/
                └── index.css
```
---

## ⚙️ Setup Instructions  

### 1️⃣ Clone the Repository  
```bash
git clone https://github.com/Caerus256/VidyaVichar.git
cd VidyaVichar
```

### 2️⃣ Backend Setup  
```bash
cd backend
npm install
```

- Run the backend server:  
```bash
npm start
```

### 3️⃣ Frontend Setup  
```bash
cd frontend
npm install
```

- Run the frontend:  
```bash
npm start
```

### 4️⃣ Access Application  
Open: **[http://localhost:3000](http://localhost:3000)**  

---

## 🏗️ Design Decisions  

The **VidyaVichar** platform was designed with a focus on **scalability, maintainability, and clarity**.  

### 1. Technology Stack (MERN)  
- **MongoDB**: Flexible schema, supports scaling, and well-suited for nested objects like class → questions.  
- **Express.js**: Clean routing & middleware handling.  
- **React.js**: Component-driven frontend for modular UIs.  
- **Node.js**: Asynchronous, ideal for handling concurrent requests.  

👉 Provides **end-to-end JavaScript development**, reducing context switching and enabling rapid prototyping.  

### 2. Backend Architecture  
- **MVC pattern** for separation of concerns:  
  - **Models**: Data schema definitions.  
  - **Controllers**: Business logic.  
  - **Routes**: RESTful APIs.  
- **Middleware** (auth) ensures consistent authentication across APIs.  

### 3. Authentication & Authorization  
- **JWT (stateless, scalable)** chosen for authentication.  
- **Role-based access control (RBAC)**:  
  - **Student** → Ask questions, view answers.  
  - **TA** → Manage & prioritize.  
  - **Teacher** → Final authority over answers.  

### 4. Frontend Architecture  
- **Component-based React**: Auth, Classes, Dashboard split into independent units.  
- **Conditional rendering** of dashboards based on role.  
- **State management** is local but extendable with Redux/Context API.  

### 5. Database Schema Design  
- **User** → role, name, email, password.  
- **Class** → maintains mapping between students, TAs, teachers.  
- **Question** → text, author, status (`pending`, `answered`, `important`, `deleted`).  

👉 Ensures **minimal redundancy**, **normalized structure**, and **easy role checks**.  

### 6. Question Lifecycle Management  
- Workflow:  
  - **Pending** → submitted.  
  - **Answered** → marked by Teacher.  
  - **Important** → flagged for attention.  
  - **Deleted** → hidden but retained.  

Provides **traceability** and supports real-world classroom Q&A flow.  

### 7. Solution Scalability  
- RESTful APIs (stateless, integrable with mobile).  
- MongoDB supports **replication/sharding** for growth.  
- Prepared for **WebSocket-based real-time Q&A** in future.  

### 8. Error Handling & Security  
- Centralized error-handling middleware.  
- Input validation.  
- JWT expiry strategy with refresh tokens.  

### 9. Deployment Readiness  
- `.env` for secrets → no hardcoded configs.
- Works with **Heroku/Vercel + MongoDB Atlas**.  

---

## 🔄 Solution Diagram  

![Solution Diagram]("/soln_diagram.png")

## 📖 Interpretations  

The following assumptions and constraints apply in **Vidyavichar’s design**:  

- Once a **doubt/question** is asked, it **cannot be updated** by the student.  
- **TAs cannot change the status** of a question; only Teachers have this authority.  
- **Classes are open** to all students and TAs — anyone can join any class.  
- Once a question is **deleted**, it **cannot be restored**.  
- Questions must be between **10 and 500 characters**.  
- **Classes can only be created by Teachers**; TAs cannot create new classes.  

---

## 🔌 API Routes  

### 🔑 Authentication (`/api/auth`)  
- `POST /register` → Register new user (Student/TA/Teacher).  
- `POST /login` → Authenticate user and return JWT.  

### 🏫 Classes (`/api/classes`)  
- `POST /` → Create a new class (**Teacher only**).  
- `GET /` → Get all classes.

### ❓ Questions (`/api/questions`)  
- `POST /` → Ask a question (**Student**).  
- `GET /class/:classId` → Get all questions in a class.  
- `PATCH /:id/answer` → Mark a question as answered (**Teacher only**).  
- `PATCH /:id/important` → Mark a question as important (**Teacher only**).  
- `DELETE /:id` → Delete a question (**Teacher only**).  
