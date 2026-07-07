// نظام الخرائط
class MapSystem {
    constructor() {
        this.maps = new Map();
        this.markers = new Map();
        this.init();
    }

    init() {
        this.loadLeaflet();
    }

    loadLeaflet() {
        if (typeof L === 'undefined') {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);

            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.onload = () => {
                console.log('✅ Leaflet loaded successfully');
                this.initializeAllMaps();
            };
            document.head.appendChild(script);
        } else {
            this.initializeAllMaps();
        }
    }

    initializeAllMaps() {
        this.initializeMap('liveMap');
        this.initializeMap('adminMap');
    }

    initializeMap(mapId, center = [33.5138, 36.2765], zoom = 12) {
        const mapElement = document.getElementById(mapId);
        if (!mapElement) return null;

        try {
            // تنظيف الخريطة السابقة إذا كانت موجودة
            if (this.maps.has(mapId)) {
                this.maps.get(mapId).remove();
                this.maps.delete(mapId);
            }

            const map = L.map(mapId).setView(center, zoom);
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 18
            }).addTo(map);

            this.maps.set(mapId, map);
            console.log(`✅ Map ${mapId} initialized successfully`);
            return map;
        } catch (error) {
            console.error(`❌ Error initializing map ${mapId}:`, error);
            this.showMapPlaceholder(mapId);
            return null;
        }
    }

    showMapPlaceholder(mapId) {
        const mapElement = document.getElementById(mapId);
        if (mapElement) {
            mapElement.innerHTML = `
                <div class="map-placeholder">
                    <i class="fas fa-map-marked-alt"></i>
                    <h3>خريطة التتبع</h3>
                    <p>لتفعيل الخريطة، يرجى التأكد من اتصال الإنترنت</p>
                    <button class="btn btn-primary" onclick="mapSystem.initializeMap('${mapId}')">
                        <i class="fas fa-sync"></i> إعادة تحميل الخريطة
                    </button>
                </div>
            `;
        }
    }

    addMarker(mapId, latlng, popupContent, options = {}) {
        const map = this.maps.get(mapId);
        if (!map) return null;

        const marker = L.marker(latlng, options).addTo(map);
        
        if (popupContent) {
            marker.bindPopup(popupContent);
        }

        if (!this.markers.has(mapId)) {
            this.markers.set(mapId, new Map());
        }
        const markerId = `marker-${Date.now()}`;
        this.markers.get(mapId).set(markerId, marker);

        return { marker, id: markerId };
    }

    updateMarker(mapId, markerId, newLatlng, newPopupContent = null) {
        const mapMarkers = this.markers.get(mapId);
        if (!mapMarkers) return false;

        const marker = mapMarkers.get(markerId);
        if (marker) {
            marker.setLatLng(newLatlng);
            if (newPopupContent) {
                marker.setPopupContent(newPopupContent);
            }
            return true;
        }
        return false;
    }

    removeMarker(mapId, markerId) {
        const mapMarkers = this.markers.get(mapId);
        if (!mapMarkers) return false;

        const marker = mapMarkers.get(markerId);
        if (marker) {
            marker.remove();
            mapMarkers.delete(markerId);
            return true;
        }
        return false;
    }

    clearAllMarkers(mapId) {
        const mapMarkers = this.markers.get(mapId);
        if (mapMarkers) {
            mapMarkers.forEach(marker => marker.remove());
            mapMarkers.clear();
        }
    }

    setView(mapId, center, zoom) {
        const map = this.maps.get(mapId);
        if (map) {
            map.setView(center, zoom);
        }
    }

    trackLocationOnMap(mapId, location, popupContent = 'الموقع الحالي') {
        const map = this.maps.get(mapId);
        if (!map) return null;

        const latlng = [location.lat, location.lng];
        
        this.clearAllMarkers(mapId);
        
        const markerResult = this.addMarker(mapId, latlng, popupContent);
        
        map.setView(latlng, 15);
        
        return markerResult;
    }

    updateLocationOnMap(mapId, markerId, newLocation, newPopupContent = null) {
        const latlng = [newLocation.lat, newLocation.lng];
        return this.updateMarker(mapId, markerId, latlng, newPopupContent);
    }

    addEmployeeMarkers(mapId, employees) {
        employees.forEach(employee => {
            if (employee.lastLocation) {
                const popupContent = `
                    <b>${employee.name}</b><br>
                    ${employee.title}<br>
                    ${this.formatTime(employee.lastLocation.timestamp)}<br>
                    دقة: ${Math.round(employee.lastLocation.accuracy)}م
                `;
                
                this.addMarker(mapId, 
                    [employee.lastLocation.lat, employee.lastLocation.lng], 
                    popupContent,
                    { 
                        title: employee.name
                    }
                );
            }
        });
    }

    // دالة مساعدة للتنسيق
    formatTime(date) {
        if (!date) return 'غير محدد';
        const d = new Date(date);
        return d.toLocaleString('ar-SA', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// إنشاء نظام الخرائط
const mapSystem = new MapSystem();
window.mapSystem = mapSystem;