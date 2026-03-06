# Stockcard - Inventory & Demo Management

Stockcard is a specialized inventory management system built with **React**, **TypeScript**, and **Vite**, integrated with **Supabase** for a real-time database and serverless automation.

## 🚀 Key Features

### 1. Inventory Management
- **Universal Inventory List**: Centralized view of all stock items.
- **Advanced Filtering**: Filter items by Category, Location, Year, Size, and Stock Status (Low/Good).
- **Excel Import**: Quickly bootstrap your inventory by importing .xlsx or .csv files.
- **Stock Thresholds**: Automatic visual indicators for low stock items.

### 2. Demo Tracker
- **Asset Tracking**: Keep track of items that are currently out with customers or being used for demonstrations.
- **Workflow Management**: Transition items from "Active Demo" back to "Stock" with a single click.
- **Metadata Stashing**: Stores customer phone numbers, expected return dates, and condition feedback within the transaction history.

### 3. WhatsApp Automation
- **Automated Reminders**: Integrated with WhatsApp Business API via Supabase Edge Functions.
- **Follow-ups**: Send automated messages to customers to remind them about demo returns or stock availability.
- **Official Templates**: Supports `reminder_automation` template for professional and reliable messaging.

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, TypeScript
- **Styling**: Vanilla CSS with modern Design Tokens
- **Icons**: Lucide React
- **Backend/Database**: [Supabase](https://supabase.com/)
- **API**: WhatsApp Business API (Meta)

## 📦 Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd stockcard
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Launch Development Server**:
   ```bash
   npm run dev
   ```

## 🛠️ Deployment

### Local Network Access
To allow others on the same WiFi to access the site:
```bash
npm run dev -- --host
```

### Production Deployment
The app is optimized for deployment on **Vercel**, **Netlify**, or any static hosting provider.
```bash
npm run build
```

## 📝 License
Proprietary - Developed for internal company use.
