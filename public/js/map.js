const map = new maplibregl.Map({
  container: "map",
  style: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
  center: listingCoords.length ? listingCoords : [77.209, 28.6139],
  zoom: 9,
});

map.addControl(new maplibregl.NavigationControl(), "top-right");

// Marker Element
const el = document.createElement("div");
el.className = "marker-container";
el.innerHTML = `
<div class="pulse"></div>
<i class="fa-solid fa-house fa-2x" style="color:red; position: relative; z-index: 2"></i>`;

const marker = new maplibregl.Marker({ element: el })
  .setLngLat(listingCoords) // [lng, lat]
  .setPopup(
    new maplibregl.Popup({ offset: 25 }).setHTML(
      `<h5><b>${listingTitle}</b></h5><p>${listingLocation}</p>`
    )
  ) // click popup
  .addTo(map);
