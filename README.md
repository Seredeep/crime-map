# 🗺️ Crime Map - Incident Map

> Platform for visualizing and reporting urban security incidents in Argentina. It allows citizens to report, view, and analyze incidents collaboratively with verification.

## ✨ Features

- 🗺️ **Interactive map** with real-time visualization
- 📱 **Responsive** - Optimized for mobile and desktop
- 🔐 **Authentication** with Google and credentials
- 📊 **Statistics** and temporal/geographical analysis
- 🏷️ **Tag system** and advanced filters
- 🖼️ **Evidence uploads** with Supabase Storage
- 👥 **User roles** (User, Editor, Admin)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ or Bun
- MongoDB (local or Atlas)
- Supabase account
- Google Maps API Key

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd crime-map

# Install dependencies
bun install
# or
npm install

# Set environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run in development
bun dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## ⚙️ Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/crime-map
# or MongoDB Atlas: mongodb+srv://user:pass@cluster.mongodb.net/crime-map

# Authentication
NEXTAUTH_SECRET=your-super-secure-secret
NEXTAUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Google Maps
GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Supabase (for file storage)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-key

# Alternative geocoding
MAPS_CO_API_KEY=your-maps-co-api-key
```

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── admin/             # Admin dashboard
│   └── components/        # React components
├── lib/                   # Utilities and services
│   ├── config/           # Configuration (roles, etc.)
│   └── hooks/            # Custom hooks
├── constants/            # Project constants
└── scripts/              # Utility/migration scripts
```

## 🛠️ Available Scripts

```bash
# Web development
bun dev                    # Web development server
npm run dev               # Alternative with npm

# Mobile development (Capacitor)
npm run dev:android:robust # Hot reload on Android (RECOMMENDED)
npm run dev:android:simple # Simple hot reload
npm run dev:android:advanced # With detailed instructions

# Troubleshooting
npm run fix-gradle-issue   # Complete solution for Gradle errors
npm run clean:android      # Android cleanup
npm run cap:restore        # Restore configuration

# Production
bun build                  # Web production build
npm run build:prod         # Mobile production build

# Utilities
bun lint                   # ESLint linter
bun run load-neighborhoods # Load neighborhood data
bun run import-incidents   # Import incidents (development)
```

## 📱 Mobile Development

For Android development with hot reload:

1. **Start:** `npm run dev:android:robust`
2. **Follow** the on-screen instructions
3. **Develop** with automatic hot reload
4. **Finish:** `npm run cap:restore`

📚 **Full documentation:** [docs/CAPACITOR/README.md](docs/CAPACITOR/README.md)

## 🗃️ Database

### Initial setup

1. **MongoDB**: Create a database named `crime-map`
2. **Main collections**:
   - `incidents` - Reported incidents
   - `users` - System users
   - `neighborhoods` - Neighborhood geographic data

3. **Load initial data**:
```bash
# Load neighborhoods (requires GeoJSON file)
cd scripts && node load-neighborhoods-local.js
```

### Supabase Storage
1. Create a project in [Supabase](https://supabase.com)
2. The `incident-evidence` bucket is created automatically
3. Configure access policies as needed

## 🔐 Roles and Permissions

- **User**: Can report and view incidents
- **Editor**: Can verify/edit incidents
- **Admin**: Full management of users and incidents

## 🤝 Contributing

1. Fork the project
2. Create a branch for your feature (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -m 'Add new functionality'`)
4. Push the branch (`git push origin feature/new-feature`)
5. Open a Pull Request

## 📄 License

This project is under the GNU Affero General Public License v3.0. See `LICENSE` for more details.

## 🆘 Support

- 📧 Email: [your-email@example.com]
- 🐛 Issues: [GitHub Issues](link-to-issues)
- 📖 Docs: [See full documentation](link-to-docs)

