import React, { useRef, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

interface GPSPoint {
  lat: number;
  lng: number;
  timestamp?: string;
}

interface OSMMapViewProps {
  gpsPoints: GPSPoint[];
  defaultCoords: { latitude: number; longitude: number };
}

export const OSMMapView: React.FC<OSMMapViewProps> = ({ gpsPoints, defaultCoords }) => {
  const webViewRef = useRef<any>(null);

  // HTML template using Leaflet + voyager clean tiles (memoized to prevent WebView reloads on state changes)
  const mapHtml = React.useMemo(() => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body, html, #map { height: 100%; margin: 0; padding: 0; background: #fff; }
        .truck-marker-div {
          width: 32px;
          height: 32px;
          background: #e8f5e9;
          border: 2px solid #008080;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', { zoomControl: false }).setView([${defaultCoords.latitude}, ${defaultCoords.longitude}], 13);
        
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        var marker;
        var polyline;

        var handleMessage = function(event) {
          try {
            var data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
            if (data.type === 'update') {
              var lat = data.lat;
              var lng = data.lng;
              var path = data.path;

              map.setView([lat, lng], 15);

              if (marker) {
                marker.setLatLng([lat, lng]);
              } else {
                marker = L.marker([lat, lng]).addTo(map);
              }

              if (path && path.length > 0) {
                if (polyline) {
                  polyline.setLatLngs(path);
                } else {
                  polyline = L.polyline(path, { color: '#008080', weight: 4 }).addTo(map);
                }
              }
            }
          } catch(e) {}
        };

        window.addEventListener("message", handleMessage);
        document.addEventListener("message", handleMessage);
      </script>
    </body>
    </html>
  `, [defaultCoords.latitude, defaultCoords.longitude]);

  const sendUpdate = () => {
    if (gpsPoints && gpsPoints.length > 0) {
      const lastPoint = gpsPoints[gpsPoints.length - 1];
      webViewRef.current?.postMessage(JSON.stringify({
        type: 'update',
        lat: lastPoint.lat,
        lng: lastPoint.lng,
        path: gpsPoints.map(p => [p.lat, p.lng])
      }));
    }
  };

  useEffect(() => {
    sendUpdate();
  }, [gpsPoints]);

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: mapHtml }}
        style={{ flex: 1 }}
        domStorageEnabled={true}
        javaScriptEnabled={true}
        onLoadEnd={sendUpdate}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  }
});
