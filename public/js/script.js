const socket = io();

const map = L.map("map").setView([0, 0], 16);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "OpenStreetMap"
}).addTo(map);

const markers = {};
const paths = {};

// Green Marker (Current User)
const greenIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Red Marker (Other Users)
const redIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Send Location
if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude } = position.coords;

            socket.emit("send-location", {
                latitude,
                longitude
            });
        },
        (error) => {
            console.error(error);
        },
        {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
        }
    );
}

// Receive Location
socket.on("receive-location", (data) => {
    const { id, latitude, longitude } = data;

    map.setView([latitude, longitude]);

    const icon = (id === socket.id) ? greenIcon : redIcon;

    if (markers[id]) {
        markers[id].setLatLng([latitude, longitude]);
    } else {
        markers[id] = L.marker([latitude, longitude], {
            icon: icon
        }).addTo(map);

        markers[id].bindPopup(
            id === socket.id ? "🟢 You" : "🔴 Other User"
        );
    }

    // Route History
    if (!paths[id]) {
        paths[id] = L.polyline([[latitude, longitude]], {
          color: id === socket.id ? "green" : "red",
           weight: 4
    }).addTo(map);
    } else {
        paths[id].addLatLng([latitude, longitude]);
    }
});

// Remove disconnected users
socket.on("user-disconnected", (id) => {
    if (markers[id]) {
        map.removeLayer(markers[id]);
        delete markers[id];
    }

    if (paths[id]) {
        map.removeLayer(paths[id]);
        delete paths[id];
    }
});