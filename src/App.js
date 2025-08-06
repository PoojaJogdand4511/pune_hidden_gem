import React, { useState, useEffect } from 'react';
import { MapPin, Clock, AlertTriangle, Info, Ghost, Shuffle, Mountain, Coffee } from 'lucide-react';
import Papa from 'papaparse';
import './index.css';

const App = () => {
  const [places, setPlaces] = useState([]);
  const [filteredPlaces, setFilteredPlaces] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [spookyMode, setSpookyMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Secret tips rotation
  const secretTips = [
    {
      title: "Pataleshwar Cave Temple",
      tip: "Visit early morning around 6 AM for the most serene experience. The temple has amazing acoustics - try whispering and hear it echo!"
    },
    {
      title: "Mulshi Lake Drive",
      tip: "Take the back road through small villages for Instagram-worthy shots of misty mountains. Pack hot tea in a thermos!"
    },
    {
      title: "Bhaja Caves Trek",
      tip: "Wear grip shoes! The rocks can be slippery. There's a hidden waterfall 10 minutes past the main caves - follow the sound of water."
    },
    {
      title: "Local Food Secret",
      tip: "Ask locals for 'Kanda Poha with extra chilam' at roadside stalls - it's a secret menu item that most tourists never discover!"
    },
    {
      title: "Night Photography",
      tip: "For spooky locations, use a flashlight with red filter to maintain night vision while getting amazing ghost-like photos."
    }
  ];

  const [currentTip, setCurrentTip] = useState(0);

  // Category mapping and icons
  const categories = [
    { id: 'all', name: 'All Places', icon: '🏛️' },
    { id: 'Hidden Hangout', name: 'Hidden Hangouts', icon: '🏞️' },
    { id: 'Scary Road', name: 'Scary Roads', icon: '🛣️' },
    { id: 'Hidden Hangout with Trek', name: 'Treks', icon: '🏔️' },
    { id: 'Mysterious Facts', name: 'Mysterious', icon: '🔮' },
    { id: 'cafe', name: 'Cafes & Food', icon: '☕' }
  ];

  // Load CSV data
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/places (1).csv');
        const csvText = await response.text();
        
        Papa.parse(csvText, {
          header: true,
          complete: (results) => {
            console.log('Parsed data:', results.data);
            setPlaces(results.data);
            setFilteredPlaces(results.data);
            setIsLoading(false);
          },
          error: (error) => {
            console.error('Error parsing CSV:', error);
            setIsLoading(false);
          }
        });
      } catch (error) {
        console.error('Error loading CSV:', error);
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter places based on category and spooky mode
  useEffect(() => {
    let filtered = places;

    // Filter by category
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'cafe') {
        // Filter for cafe/food related places
        filtered = filtered.filter(place => 
          place.name && place.name.toLowerCase().includes('cafe') ||
          place.name && place.name.toLowerCase().includes('thali') ||
          place.name && place.name.toLowerCase().includes('tea') ||
          place.category && place.category.toLowerCase().includes('cafe')
        );
      } else {
        filtered = filtered.filter(place => 
          place.category && place.category.includes(selectedCategory)
        );
      }
    }

    // Filter by spooky preference
    if (spookyMode) {
      filtered = filtered.filter(place => 
        place.spooky === 'true' || place.spooky === true
      );
    }

    setFilteredPlaces(filtered);
  }, [places, selectedCategory, spookyMode]);

  // Rotate secret tips weekly
  useEffect(() => {
    const weekNumber = Math.floor(Date.now() / (1000 * 60 * 60 * 24 * 7));
    setCurrentTip(weekNumber % secretTips.length);
  }, []);

  const handleSurpriseMe = () => {
    if (filteredPlaces.length > 0) {
      const randomPlace = filteredPlaces[Math.floor(Math.random() * filteredPlaces.length)];
      // Scroll to the place or highlight it
      const placeElement = document.getElementById(`place-${randomPlace.id}`);
      if (placeElement) {
        placeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        placeElement.style.transform = 'scale(1.05)';
        placeElement.style.boxShadow = '0 0 30px rgba(255,107,107,0.6)';
        setTimeout(() => {
          placeElement.style.transform = '';
          placeElement.style.boxShadow = '';
        }, 2000);
      }
    }
  };

  const PlaceCard = ({ place }) => {
    const isSpooky = place.spooky === 'true' || place.spooky === true;
    
    return (
      <div className="place-card" id={`place-${place.id}`}>
        <div className="place-header">
          <div>
            <h3 className="place-name">{place.name}</h3>
            <span className="place-category">
              {place.category}
            </span>
            {isSpooky && <span className="spooky-badge">👻 Spooky</span>}
          </div>
        </div>
        
        <p className="place-description">{place.description}</p>
        
        <div className="place-details">
          <div className="detail-item">
            <MapPin size={16} />
            <span>{place.location}</span>
          </div>
          <div className="detail-item">
            <Clock size={16} />
            <span>Best time: {place.best_time_to_visit || place.best_time}</span>
          </div>
          <div className="detail-item">
            <Mountain size={16} />
            <span>{place.distance_from_pune_km} km from Pune</span>
          </div>
        </div>

        {place.facts && (
          <div className="place-facts">
            <h4><Info size={14} /> Interesting Facts</h4>
            <p>{place.facts}</p>
          </div>
        )}

        {place.rules && (
          <div className="place-rules">
            <h4><AlertTriangle size={14} /> Rules & Tips</h4>
            <p>{place.rules}</p>
          </div>
        )}

        {place.map_link && (
          <a 
            href={place.map_link} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="map-link"
          >
            <MapPin size={16} />
            View on Map
          </a>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="app">
        <div className="container">
          <div style={{ textAlign: 'center', color: 'white', fontSize: '1.5rem', marginTop: '50px' }}>
            Loading Pune's Hidden Gems... 🏛️
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1>Pune Hidden Gems 🏛️👻</h1>
          <p>Discover mysterious places, scary roads, beautiful treks, and cozy spots</p>
        </header>

        <div className="filters">
          <div className="filter-section">
            <h3>Choose Your Vibe</h3>
            <div className="category-buttons">
              {categories.map(category => (
                <button
                  key={category.id}
                  className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.icon} {category.name}
                </button>
              ))}
            </div>
          </div>

          <div className="special-buttons">
            <button 
              className="surprise-btn"
              onClick={handleSurpriseMe}
            >
              <Shuffle size={20} />
              Surprise Me!
            </button>
            
            <button 
              className={`spooky-toggle ${spookyMode ? 'active' : ''}`}
              onClick={() => setSpookyMode(!spookyMode)}
            >
              <Ghost size={20} />
              {spookyMode ? 'Spooky Mode ON' : 'Spooky Preference'}
            </button>
          </div>
        </div>

        {filteredPlaces.length === 0 ? (
          <div className="no-places">
            No places found for your current filters. Try different options! 🔍
          </div>
        ) : (
          <div className="places-grid">
            {filteredPlaces.map((place, index) => (
              <PlaceCard key={place.id || index} place={place} />
            ))}
          </div>
        )}

        <div className="secret-tip">
          <h2>🗝️ Secret Tip of the Week</h2>
          <div className="tip-content">
            <h3>{secretTips[currentTip].title}</h3>
            <p>{secretTips[currentTip].tip}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;