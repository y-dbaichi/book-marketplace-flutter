import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Card, Badge } from 'react-bootstrap';
import LoadingSpinner from './LoadingSpinner';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons
const clientIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUiIGhlaWdodD0iNDEiIHZpZXdCb3g9IjAgMCAyNSA0MSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyLjUgMEMxOS40MDM2IDAgMjUgNS41OTY0NCAyNSAxMi41QzI1IDE5LjQwMzYgMTkuNDAzNiAyNSAxMi41IDI1QzUuNTk2NDQgMjUgMCAxOS40MDM2IDAgMTIuNUMwIDUuNTk2NDQgNS41OTY0NCAwIDEyLjUgMFoiIGZpbGw9IiM2NjdlZWEiLz4KPHBhdGggZD0iTTEyLjUgNDFMMTIuNSAyNSIgc3Ryb2tlPSIjNjY3ZWVhIiBzdHJva2Utd2lkdGg9IjIiLz4KPC9zdmc+',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const supplierIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUiIGhlaWdodD0iNDEiIHZpZXdCb3g9IjAgMCAyNSA0MSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyLjUgMEMxOS40MDM2IDAgMjUgNS41OTY0NCAyNSAxMi41QzI1IDE5LjQwMzYgMTkuNDAzNiAyNSAxMi41IDI1QzUuNTk2NDQgMjUgMCAxOS40MDM2IDAgMTIuNUMwIDUuNTk2NDQgNS41OTY0NCAwIDEyLjUgMFoiIGZpbGw9IiNmMDkzZmIiLz4KPHBhdGggZD0iTTEyLjUgNDFMMTIuNSAyNSIgc3Ryb2tlPSIjZjA5M2ZiIiBzdHJva2Utd2lkdGg9IjIiLz4KPC9zdmc+',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

export default function LocationMap({ 
  points = [], 
  center = [33.5731, -7.5898], 
  zoom = 10,
  type = 'clients', // 'clients' or 'suppliers'
  loading = false,
  title = 'Location Map'
}) {
  const [mapCenter, setMapCenter] = useState(center);

  useEffect(() => {
    if (points.length > 0) {
      // Calculate center based on all points
      const avgLat = points.reduce((sum, point) => sum + point.latitude, 0) / points.length;
      const avgLng = points.reduce((sum, point) => sum + point.longitude, 0) / points.length;
      setMapCenter([avgLat, avgLng]);
    }
  }, [points]);

  const getMarkerIcon = () => {
    return type === 'clients' ? clientIcon : supplierIcon;
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      confirmed: 'info',
      completed: 'success',
      active: 'success',
      inactive: 'secondary'
    };
    return variants[status] || 'secondary';
  };

  if (loading) {
    return (
      <Card className="map-container d-flex align-items-center justify-content-center">
        <LoadingSpinner size="lg" />
      </Card>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">
          <i className={`bi ${type === 'clients' ? 'bi-people' : 'bi-shop'} me-2`}></i>
          {title}
        </h5>
        <Badge bg="primary">{points.length} {type}</Badge>
      </div>
      
      <div className="map-container">
        <MapContainer
          center={mapCenter}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {points.map((point, index) => (
            <Marker
              key={point.id || index}
              position={[point.latitude, point.longitude]}
              icon={getMarkerIcon()}
            >
              <Popup>
                <div className="location-popup">
                  <div className="d-flex align-items-center mb-2">
                    <i className={`bi ${type === 'clients' ? 'bi-person-circle' : 'bi-shop'} fs-4 text-primary me-2`}></i>
                    <div>
                      <h6 className="mb-0">{point.name}</h6>
                      <small className="text-muted">{point.email}</small>
                    </div>
                  </div>
                  
                  <div className="mb-2">
                    <i className="bi bi-geo-alt me-1"></i>
                    <small>{point.address}</small>
                  </div>
                  
                  {point.phone && (
                    <div className="mb-2">
                      <i className="bi bi-telephone me-1"></i>
                      <small>{point.phone}</small>
                    </div>
                  )}
                  
                  {point.totalOrders && (
                    <div className="mb-2">
                      <i className="bi bi-cart me-1"></i>
                      <small>{point.totalOrders} orders</small>
                    </div>
                  )}
                  
                  {point.totalSpent && (
                    <div className="mb-2">
                      <i className="bi bi-currency-euro me-1"></i>
                      <small>{point.totalSpent}€ total</small>
                    </div>
                  )}
                  
                  {point.status && (
                    <div className="mb-2">
                      <Badge bg={getStatusBadge(point.status)} className="text-capitalize">
                        {point.status}
                      </Badge>
                    </div>
                  )}
                  
                  {point.lastOrder && (
                    <div>
                      <small className="text-muted">
                        Last order: {new Date(point.lastOrder).toLocaleDateString()}
                      </small>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
      
      {points.length === 0 && (
        <div className="text-center mt-4">
          <i className={`bi ${type === 'clients' ? 'bi-people' : 'bi-shop'} fs-1 text-muted mb-3`}></i>
          <p className="text-muted">No {type} found</p>
        </div>
      )}
    </div>
  );
}
