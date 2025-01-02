# Elongatd 🧵

Elongatd transforms X (Twitter) threads into beautiful, easy-to-read blog posts. The browser extension automatically detects when you're viewing a thread and allows you to convert it into a clean, distraction-free reading experience that can be shared easily.

## Project Structure 📂

The project consists of two main parts:

- **browser-extension/**: Chrome extension that detects threads and sends them to the web service
- **website/**: Next.js web application that receives threads from the extension and displays them as blog posts

## Features ✨

- **One-Click Conversion**: Convert any X thread into a blog post with a single click
- **Clean Reading Experience**: Enjoy threads in a beautiful, distraction-free format
- **Original Content Link**: Easy access to the original thread
- **Responsive Design**: Perfect reading experience on any device
- **Dark/Light Mode**: Automatic theme switching based on your system preferences

## Installation 🚀

### Chrome Web Store (Not yet live)

1. Visit [Elongatd on the Chrome Web Store]()
2. Click "Add to Chrome"
3. Click "Add Extension" when prompted

### Manual Installation

1. Clone this repository:

   ```bash
   git clone https://github.com/yourusername/elongatd.git
   cd elongatd/browser-extension
   ```

2. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked"
   - Select the `browser-extension` directory

## Development 🛠️

### Browser Extension Development

```bash
cd browser-extension

# Install dependencies (only needed for building)
npm install

# Build for production
npm run build

# For development:
# 1. Load the extension unpacked from the browser-extension directory
# 2. Edit config.js to switch between development and production APIs:
#    - development: uses localhost:3000
#    - production: uses elongatd.com
```

### Website Development

If you want to work on the web application:

1. Set up the local environment:

   ```bash
   cd website

   # Install dependencies
   npm install

   # Start local database
   npm run db:start

   # Run database migrations
   npm run db:push
   ```

2. Start the development server:

   ```bash
   npm run dev
   ```

3. Additional commands:

   ```bash
   # View database with Drizzle Studio
   npm run db:studio

   # Run production database migrations
   npm run db:push:prod
   ```

## Environment Variables 🔑

### Website

The project uses environment variables for database connections and Azure OpenAI configuration. We provide an `.env.example` file with configurations for both environments:

- For local development: Copy relevant sections to `.env.local`
- For production: Copy relevant sections to `.env`

The project uses Azure OpenAI's GPT-4 Turbo for converting threads into blog posts. This choice was made because:

- Fast response times for better user experience
- Cost-effective for processing threads
- High-quality blog post generation

You'll need an Azure OpenAI account with GPT-4 Turbo access to run the blog conversion feature locally.

### Browser Extension

The environment is controlled in `config.js`:

```javascript
// development: uses localhost:3000
// production: uses elongatd.com
const ENV = "development";
```

## How It Works 🔄

1. When you visit a thread on X, the extension automatically detects it
2. Click the extension icon or use the notification to convert the thread
3. The extension processes the thread and creates a clean blog post version
4. You're redirected to the blog post for a better reading experience

## Contributing 🤝

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License 📄

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments 🙏

- Built with Next.js, Drizzle ORM, and Tailwind CSS
- Powered by Vercel and Neon Database
