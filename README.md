# 🏛️ Pune Hidden Gems

A beautiful React web application to discover Pune's hidden places, scary roads, mysterious locations, treks, and cafes based on your preferred vibe.

## ✨ Features

- **Category Filtering**: Hidden Hangouts, Scary Roads, Treks, Mysterious Places, Cafes & Food
- **👻 Spooky Mode**: Filter for haunted and mysterious locations
- **🎲 Surprise Me**: Random place discovery with smooth animations
- **🗝️ Secret Tip of the Week**: Weekly rotating insider tips
- **📱 Responsive Design**: Works on desktop, tablet, and mobile
- **🎨 Modern UI**: Glassmorphism design with beautiful gradients

## 🚀 Quick Start

### Prerequisites
- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. **Download and extract the project files**
2. **Navigate to the project directory:**
   ```bash
   cd pune-hidden-gems
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Start the development server:**
   ```bash
   npm start
   ```

5. **Open your browser and visit:** `http://localhost:3000`

## 📦 Deployment Options

### Option 1: Static Hosting (Recommended)
The build folder contains optimized static files that can be hosted on:
- **Netlify**: Drag and drop the `build` folder
- **Vercel**: Connect your GitHub repo or upload the build folder
- **GitHub Pages**: Upload the build folder contents
- **Any web server**: Upload the build folder contents

### Option 2: Local Server
```bash
npm install -g serve
serve -s build
```

## 📁 Project Structure

```
pune-hidden-gems/
├── public/
│   ├── index.html
│   └── places (1).csv          # Your places data
├── src/
│   ├── App.js                  # Main application component
│   ├── index.js               # React entry point
│   └── index.css              # Styles
├── build/                     # Production build (after npm run build)
├── package.json
└── README.md
```

## 🗂️ Data Format

The application reads from `places (1).csv` with these columns:
- `id`: Unique identifier
- `name`: Place name
- `category`: Type of place
- `description`: Brief description
- `location`: Address/location
- `coordinates`: GPS coordinates
- `facts`: Interesting facts
- `rules`: Safety tips and rules
- `spooky`: Boolean for haunted places
- `distance_from_pune_km`: Distance from Pune
- `best_time_to_visit`: Recommended visiting time
- `map_link`: Google Maps link

## 🎨 Customization

### Adding New Places
Edit the `public/places (1).csv` file and add new rows with the required columns.

### Changing Categories
Modify the `categories` array in `src/App.js`:
```javascript
const categories = [
  { id: 'your-category', name: 'Your Category', icon: '🎯' },
  // ... other categories
];
```

### Updating Secret Tips
Edit the `secretTips` array in `src/App.js` to add your own tips.

## 🛠️ Available Scripts

- `npm start` - Start development server
- `npm run build` - Create production build
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

## 📱 Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## 🤝 Contributing

Feel free to fork this project and submit pull requests for improvements!

## 📄 License

This project is open source and available under the MIT License.

---

**Enjoy exploring Pune's hidden gems! 🏛️👻**