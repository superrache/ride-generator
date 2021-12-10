<template>
    <div class="container">
      <div id="map" ref="map">
      </div>

      <Panel id="panel" ref="panel"/>
    </div>
</template>

<script>

import { Map, Marker, NavigationControl, GeolocateControl } from 'maplibre-gl';
import * as turf from '@turf/turf'

import Panel from './Panel.vue'
import * as routing from './routing.js'
import * as utils from './utils.js'

const DEBUG = false

export default {
  name: 'Map',
  components: {
    Panel
  },
  data() {
    return {
      map: null,
      initMarker: null,
      stepMarkers: [],
      lastPolylineLayerId: null,
      zoom: 14,
      center: { lat: 47.2143, lng: -1.5587 },
      panel: null
    }
  },
  mounted() {
    this.panel = this.$refs.panel

    this.map = new Map({
        container: this.$refs.map,
        style: "https://api.jawg.io/styles/3425c3c4-29a2-494c-a977-e9232dd8cf26.json?access-token=UG9wQV1RcEgsXwkTX9M9qfBUV0ZckAfUhlqa3W4hK16gVbTFDUSMXrn60H1hEE6d",
        center: [this.center.lng, this.center.lat],
        zoom: this.zoom
      })
    
    this.map.addControl(new NavigationControl(), 'top-right')

    this.map.addControl(
      new GeolocateControl({
        positionOptions: {
        enableHighAccuracy: true
      },
        trackUserLocation: true
      })
    )

    this.map.on('click', this.onClic)
  },
  methods: {
    onClic(e) {
        console.log('onClic')
        this.startAt(e.lngLat)        
    },
    onDrag(e) {
      console.log('onDrag')
      this.startAt(e.target._lngLat)
    },
    startAt(lngLat) {
      if(!DEBUG) {
        if(this.initMarker !== null) this.initMarker.remove()
        if(this.lastPolylineLayerId !== null) {
          console.log('removing layer ' + this.lastPolylineLayerId)
          this.removePolyline(this.lastPolylineLayerId)
        }
      }

      this.initMarker = new Marker({
        color: "#ff5000",
        draggable: true
      }).setLngLat(lngLat)
        .on('dragend', this.onDrag)
        .addTo(this.map)

      this.generateRide(lngLat)
    },
    generateSteps(from) {
      console.log("expectedTime=" + this.panel.getExpectedTime() + " h")
      console.log("speed=" + this.panel.speed + " km/h")
      const expectedDistance = this.panel.speed * this.panel.getExpectedTime()
      console.log("expectedDistance=" + expectedDistance + " km")
      
      // on considère un cercle dont le périmètre = expectedDistance
      const expectedCircleRadius = expectedDistance / (2 * Math.PI)
      console.log("expectedCircleRadius=" + expectedCircleRadius + " km")

      // on décentre aléatoirement ce cercle par rapport au point d'origine
      var dlng = utils.getRandomDegreeDelta(0.001),
          dlat = utils.getRandomDegreeDelta(0.001)
      const expectedCircleCenter = {lng: from.lng + dlng, lat: from.lat + dlat} 
      if(DEBUG) {
        new Marker({
          color: "#ff0000",
          draggable: false
          }).setLngLat(expectedCircleCenter)
          .addTo(this.map)
      }

      const numberOfCircleVertex = 30
      var options = {steps: numberOfCircleVertex * 1.8, units: 'kilometers', properties: {}}
      var circle = turf.circle([expectedCircleCenter.lng, expectedCircleCenter.lat], expectedCircleRadius, options)
      if(DEBUG) this.addGeojson(circle, 'fill', {'fill-color': '#088', 'fill-opacity': 0.1})

      // on prend au hazard n points sur le cercle
      // les points doivent être éloignés et dans l'ordre
      const n = 3
      var p = 0
      const steps = [from] // liste des étapes de la balade
      for(var s = 0; s < n; s++) {
        p += numberOfCircleVertex / n //Math.round(Math.random() * numberOfCircleVertex / 3)
        if(p > numberOfCircleVertex) p-= numberOfCircleVertex
        const step = {lng: circle.geometry.coordinates[0][p][0], lat: circle.geometry.coordinates[0][p][1]}
        
        if(DEBUG) {
          this.stepMarkers.push(new Marker({
            color: "#088",
            draggable: true
          }).setLngLat(step)
            .addTo(this.map))
        }

        steps.push(step)
      }
      steps.push(from)
      return steps
    },
    async generateRide(from) {
      const steps = this.generateSteps(from)
      
      const path = await this.getRoute(steps)
      console.log(path)
      
      const coords = routing.decodeGeometry(path.points)
      this.lastPolylineLayerId = this.addPolyline(coords)
      console.log('added layer ' + this.lastPolylineLayerId)

      this.panel.km = path.distance / 1000
      this.panel.h = path.time / 3600000
    },
    async getRoute(points) {
      return await routing.route(points, this.panel.mode)
    },
    addGeojson(geojsonData, type, paint) {
      const layerId = utils.newUniqueId()
      this.map.addSource(layerId, {
        type: 'geojson',
        data: geojsonData
      })
      this.map.addLayer({
        id: layerId,
        type: type,
        source: layerId,
        layout: {},
        paint: paint
      })
      return layerId
    },
    addPolyline(coords) {
      const geojsonData = {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: coords
        }
      }
      const paint = {
          'line-color': '#ff5000',
          'line-opacity': 0.50,
          'line-width': 3
        }
      return this.addGeojson(geojsonData, 'line', paint)
    },
    removePolyline(layerId) {
      if(this.map.getLayer(layerId))this.map.removeLayer(layerId)
      if(this.map.getSource(layerId)) this.map.removeSource(layerId)
    }
  }
}

</script>

<style scoped>

@import '~maplibre-gl/dist/maplibre-gl.css';

.container {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  text-align: center;
  overflow: hidden;
}

li {
  cursor: pointer;
}

a {
  color: #5eb793;
}

#map {
  margin-left: 0px;
  width: 100%;
  height: 100%;
  z-index: 1;
}

#panel {
  position: absolute;
  background-color: #000012bb;
  bottom: 0px;
  width: 100%;
  color: white;
  text-align: left;
  padding: 10px;
  z-index: 1005;
  height: auto;
  max-height: 300px;
  overflow-y: scroll;
}

@media only screen and (min-width: 768px) {
  #panel {
    left: 0px;
    top: 0px;
    width: 300px;
    max-height: 100%;
  }
}

</style>
