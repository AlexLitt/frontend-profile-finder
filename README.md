# Profile Finder

A modern React application for finding and managing professional profiles with advanced search capabilities.

## 🚀 Features

- **Advanced Profile Search**: Chat-first search interface for finding professionals
- **User Authentication**: Secure login/logout with Supabase
- **Role-based Access**: Admin and user roles with different permissions
- **Results Management**: Save, organize, and export search results
- **Search History**: Keep track of previous searches and templates
- **Responsive Design**: Modern UI that works on desktop and mobile
- **Real-time Data**: Live search results and updates
- **Caching System**: Intelligent caching for better performance

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Library**: HeroUI, TailwindCSS, Framer Motion
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **State Management**: React Context, TanStack Query
- **Routing**: React Router v6

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account and project

## ⚙️ Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd frontend-profile-finder
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   # Copy the example environment file
   cp .env.example .env.local
   
   # Edit .env.local with your actual values
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_ADMIN_EMAIL=your_admin_email@example.com
   ```

4. **Database Setup**
   - Set up your Supabase project at [https://supabase.com/](https://supabase.com/)
   - Run the database migrations (see `supabase/migrations/`)
   - Configure Row Level Security (RLS) policies

5. **Start Development Server**
   ```bash
   npm run dev
   ```

## 🔐 Authentication

The application uses Supabase for authentication and user management:

### Setup

1. Create a Supabase project at [https://supabase.com/](https://supabase.com/)
2. Set environment variables in `.env`:
```
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-key
```

### Role-based Access

- Users can have either `user` or `admin` roles
- New users get the `user` role by default
- To create an admin user, run:
```bash
npm run seed:admin
```

This will create an admin user with email `oleksii@example.com`. You can change the default email and password in the seeding script or by setting these environment variables:
```
ADMIN_EMAIL=youradmin@example.com
ADMIN_INITIAL_PASSWORD=SecurePassword123!
```

### Authentication Flow

- Users can sign up with email/password or OAuth (Google, LinkedIn)
- On first login, a profile is automatically created with `user` role
- Admin users have access to additional routes and features

### API Endpoints

- `GET /api/me` - Returns current user info (requires authentication)
- `POST /api/logout` - Logs out the current user
- `GET /api/admin/users` - Lists all users (requires admin role)

## Getting Started

### Prerequisites

- Node.js 16+ and npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/frontend-profile-finder.git
cd frontend-profile-finder
```

2. Install dependencies:
```bash
npm install
```

3. Create your environment file:
```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration:
- `VITE_N8N_WEBHOOK_BASE`: Your n8n webhook base URL
- `VITE_N8N_WEBHOOK_PATH`: Your n8n webhook path
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

### Development

Start the development server:
```bash
npm run dev
```

### Building for Production

```bash
npm run build
```

### Running Tests

```bash
npm run test
```

## Project Structure

```
frontend-profile-finder/
├── src/
│   ├── api/           # API integration
│   ├── components/    # Reusable components
│   ├── contexts/      # React contexts
│   ├── hooks/         # Custom hooks
│   ├── layouts/       # Layout components
│   ├── pages/         # Page components
│   ├── App.tsx        # Main app component
│   └── main.tsx       # Entry point
├── public/            # Static assets
├── .env.example      # Environment variables template
└── README.md         # This file
```

## Features by Subscription Tier

### Free Tier
- 10 searches per month
- Basic filters
- CSV export
- Email support

### Pro Tier
- 100 searches per month
- Advanced filters
- All export formats
- Basic CRM integrations
- Priority support

### Enterprise Tier
- 500 searches per month
- All Pro features
- Team collaboration
- API access
- Custom integrations
- Dedicated account manager

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.
