# YarobSMS - Professional SMS Campaign Manager

A modern, high-performance SMS management dashboard built with Next.js 15, designed for efficient bulk messaging with dynamic variable support and AI-powered content enhancement.

## 🚀 Features

- **Bulk SMS Sending**: Upload Excel files (.xlsx) to send messages to thousands of customers instantly.
- **Dynamic Variables**: personalized messages using column data (e.g., `[Name]`, `[Product]`, `[City]`).
- **AI-Powered Enhancement**: Integrate with Mistral AI to rewrite and optimize message content for better engagement.
- **Smart Message Editor**: Advanced editor with syntax highlighting for variables and real-time character counting.
- **Multi-Sender Support**: Toggle between different sender IDs (e.g., AgronaSeeds, AgronaFarm) with ease.
- **Secure Authentication**: Password-protected dashboard with session management.
- **Responsive Design**: Fully responsive UI built with Tailwind CSS and a modern glassmorphism aesthetic.
- **Arabic First**: optimized for RTL (Right-to-Left) interfaces and Arabic content.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **SMS Provider**: [httpsms](https://httpsms.com/)
- **AI Integration**: [Mistral AI](https://mistral.ai/)
- **File Handling**: [SheetJS (xlsx)](https://sheetjs.com/)

## ⚡ Getting Started

### Prerequisites

- Node.js 18+ installed.
- API Keys for httpsms and Mistral AI.

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd yarobsms
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory:
   ```env
   APP_PASSWORD="your_secure_password"
   HTTPSMS_API_KEY="your_httpsms_api_key"
   Mistral="your_mistral_api_key"
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open the dashboard:**
   Navigate to [http://localhost:3000](http://localhost:3000).

## 📖 Usage Guide

1. **Login**: Enter the configured `APP_PASSWORD` to access the dashboard.
2. **Import Data**: Upload an Excel file containing at least `المستلم` (Name) and `الهاتف` (Phone) columns.
3. **Compose Message**:
   - Write your message in the editor.
   - Click variable chips (e.g., `[الولاية]`) to insert dynamic data.
   - Use the **AI Enhance** button to polish your text.
4. **Select Sender**: Choose the appropriate sender ID.
5. **Send**: Click "Send to All" to dispatch messages. You can monitor the progress in real-time.

## 📄 License

This project is proprietary and confidential.
