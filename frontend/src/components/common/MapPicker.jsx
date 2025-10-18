import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Form, InputGroup, Button, Alert } from 'react-bootstrap';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icon
const customIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to handle map clicks
function LocationMarker({ position, setPosition, setAddress }) {
  const map = useMapEvents({
    click(e) {
      const newPosition = [e.latlng.lat, e.latlng.lng];
      setPosition(newPosition);

      // Reverse geocoding to get address
      reverseGeocode(e.latlng.lat, e.latlng.lng, setAddress);
    },
  });

  return position === null ? null : (
    <Marker position={position} icon={customIcon} />
  );
}

// Reverse geocoding function
const reverseGeocode = async (lat, lng, setAddress) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
    );
    const data = await response.json();

    if (data && data.display_name) {
      setAddress(data.display_name);
    }
  } catch (error) {
    console.error('Reverse geocoding error:', error);
  }
};

// Forward geocoding function
const forwardGeocode = async (address) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
    );
    const data = await response.json();

    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        display_name: data[0].display_name
      };
    }
    return null;
  } catch (error) {
    console.error('Forward geocoding error:', error);
    return null;
  }
};

// Search suggestions function
const searchSuggestions = async (query) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
    );
    const data = await response.json();

    return data.map(item => ({
      display_name: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      type: item.type,
      importance: item.importance
    }));
  } catch (error) {
    console.error('Search suggestions error:', error);
    return [];
  }
};

export default function MapPicker({
  onLocationSelect,
  initialPosition = [33.5731, -7.5898], // Default to Casablanca
  initialAddress = ''
}) {
  const [position, setPosition] = useState(initialPosition);
  const [address, setAddress] = useState(initialAddress);
  const [searchAddress, setSearchAddress] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const mapRef = useRef();
  const searchTimeoutRef = useRef();
  const isInitialMount = useRef(true);

  // Initialize with reverse geocode if no initial address provided
  useEffect(() => {
    if (!initialAddress && initialPosition) {
      reverseGeocode(initialPosition[0], initialPosition[1], setAddress);
    }
  }, []); // Only run once on mount

  // Call onLocationSelect when position or address changes (but not on initial mount)
  useEffect(() => {
    // Skip on initial mount to prevent infinite loop
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (position && address) {
      onLocationSelect({
        latitude: position[0],
        longitude: position[1],
        address: address
      });
    }
  }, [position, address]);

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchAddress(value);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.trim().length > 2) {
      // Debounce search suggestions
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const results = await searchSuggestions(value);
          setSuggestions(results);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Error fetching suggestions:', error);
        }
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    const newPosition = [suggestion.lat, suggestion.lng];
    setPosition(newPosition);
    setAddress(suggestion.display_name);
    setSearchAddress(suggestion.display_name);
    setSuggestions([]);
    setShowSuggestions(false);

    // Pan map to new location
    if (mapRef.current) {
      mapRef.current.setView(newPosition, 15);
    }
  };

  const handleSearch = async () => {
    if (!searchAddress.trim()) return;

    setLoading(true);
    setError('');
    setShowSuggestions(false);

    try {
      const result = await forwardGeocode(searchAddress);
      if (result) {
        const newPosition = [result.lat, result.lng];
        setPosition(newPosition);
        setAddress(result.display_name);

        // Pan map to new location
        if (mapRef.current) {
          mapRef.current.setView(newPosition, 15);
        }
      } else {
        setError('Location not found. Please try a different search term.');
      }
    } catch (err) {
      setError('Error searching for location. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGetCurrentLocation = () => {
    setLoading(true);
    setError('');

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newPosition = [position.coords.latitude, position.coords.longitude];
          setPosition(newPosition);
          reverseGeocode(position.coords.latitude, position.coords.longitude, setAddress);

          // Pan map to current location
          if (mapRef.current) {
            mapRef.current.setView(newPosition, 15);
          }
          setLoading(false);
        },
        (error) => {
          setError('Unable to get your current location. Please search manually or click on the map.');
          setLoading(false);
        }
      );
    } else {
      setError('Geolocation is not supported by this browser.');
      setLoading(false);
    }
  };

  return (
    <div className="map-picker">
      <div className="mb-3">
        <Form.Label className="fw-semibold">
          <i className="bi bi-geo-alt me-2"></i>
          Select Your Location
        </Form.Label>
        <p className="text-muted small mb-3">
          Search for an address, use your current location, or click on the map to pin your exact location.
        </p>

        {/* Search Bar */}
        <div className="position-relative mb-3">
          <InputGroup>
            <Form.Control
              type="text"
              placeholder="Search for an address (e.g., Casablanca, Morocco)"
              value={searchAddress}
              onChange={handleSearchInputChange}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            />
            <Button
              variant="outline-primary"
              onClick={handleSearch}
              disabled={loading}
            >
              <i className="bi bi-search"></i>
            </Button>
            <Button
              variant="outline-success"
              onClick={handleGetCurrentLocation}
              disabled={loading}
              title="Use my current location"
            >
              <i className="bi bi-geo-alt-fill"></i>
            </Button>
          </InputGroup>

          {/* Search Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="position-absolute w-100 bg-white border rounded shadow-lg search-suggestions" style={{ zIndex: 1000, top: '100%' }}>
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="p-3 border-bottom search-suggestion-item"
                  onClick={() => handleSuggestionClick(suggestion)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="d-flex align-items-start">
                    <i className="bi bi-geo-alt-fill text-primary me-3 mt-1"></i>
                    <div className="flex-grow-1">
                      <div className="fw-semibold text-truncate mb-1" style={{ maxWidth: '350px' }}>
                        {suggestion.display_name.split(',')[0]}
                      </div>
                      <small className="text-muted text-truncate d-block" style={{ maxWidth: '350px' }}>
                        {suggestion.display_name}
                      </small>
                    </div>
                    <i className="bi bi-arrow-right text-muted ms-2"></i>
                  </div>
                </div>
              ))}
              <div className="p-2 text-center border-top bg-light">
                <small className="text-muted">
                  <i className="bi bi-info-circle me-1"></i>
                  Click on a suggestion to select it
                </small>
              </div>
            </div>
          )}
        </div>

        {error && (
          <Alert variant="warning" className="mb-3">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </Alert>
        )}

        {/* Selected Address Display */}
        {address && (
          <div className="alert alert-info mb-3">
            <i className="bi bi-check-circle me-2"></i>
            <strong>Selected Location:</strong> {address}
          </div>
        )}
      </div>

      {/* Map */}
      <div className="map-container">
        <MapContainer
          center={position}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker
            position={position}
            setPosition={setPosition}
            setAddress={setAddress}
          />
        </MapContainer>
      </div>

      <div className="mt-3">
        <small className="text-muted">
          <i className="bi bi-info-circle me-1"></i>
          Click anywhere on the map to set your exact location, or use the search bar above.
        </small>
      </div>
    </div>
  );
}
