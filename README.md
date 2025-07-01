# Profile Finder

A modern web application for discovering and managing professional profiles. Built with React, TypeScript, and Tailwind CSS.

## Features

- 🔍 Chat-first search interface
- 💾 Search history and templates
- 📊 Results management
- 🔄 Caching system
- 🎨 Modern UI with dark/light mode
- 📱 Responsive design

## Tech Stack

- React + Vite
- TypeScript
- Tailwind CSS
- React Query
- HeroUI Components
- Framer Motion

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
