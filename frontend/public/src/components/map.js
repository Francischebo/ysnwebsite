document.addEventListener("DOMContentLoaded", function() {
    if (document.getElementById('map')) {
        const map = L.map('map').setView([-1.2921, 36.8219], 7);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        // Add markers dynamically here...
    }
});

if (!window.mapInitialized) {
    window.mapInitialized = true;
    // initialize map here
}