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
      panel: null,
      spinner: {
        id: 'spinner',
        center: null,
        radius: 0,
        source: null,
        i: 0,
        timerId: 0
      }
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

      const numberOfCircleVertex = 30 // le nombre de vertex sélectionnables pour la balade sur le cercle
      var options = {steps: numberOfCircleVertex, units: 'kilometers', properties: {}}
      var circle = turf.circle([expectedCircleCenter.lng, expectedCircleCenter.lat], expectedCircleRadius, options)
      if(DEBUG) this.addGeojson(circle, 'fill', {'fill-color': '#088', 'fill-opacity': 0.1})

      this.spinner.center = expectedCircleCenter
      this.spinner.radius = 0.002
      this.startSpinner()

      // on prend au hazard n points sur le cercle
      // les points doivent être éloignés et dans l'ordre
      const n = 3
      var p = Math.round(Math.random() * numberOfCircleVertex)
      console.log('p0=' + p)
      const steps = [from] // liste des étapes de la balade
      for(var s = 0; s < n; s++) {
        const dp = Math.round(Math.random() * numberOfCircleVertex / n)
        console.log('dp=' + dp)
        p += dp
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
      
      const coords = routing.decodeGeometry(path.points)

      if(!DEBUG && this.lastPolylineLayerId !== null) {
        console.log('removing layer ' + this.lastPolylineLayerId)
        this.removePolyline(this.lastPolylineLayerId)
      }
      this.lastPolylineLayerId = this.addPolyline(coords)
      console.log('added layer ' + this.lastPolylineLayerId)

      this.stopSpinner()

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
    },
    startSpinner() {
      if(this.spinner.timerId != 0) this.stopSpinner()
      this.map.addSource(this.spinner.id, { 
        type: 'geojson',
        data: this.getSpinnerPoint(0)
      })
      this.map.addLayer({
        id: this.spinner.id,
        source: this.spinner.id,
        type: 'circle',
        paint: {
          'circle-radius': 5,
          'circle-color': '#ff5000'
        }
      })

      this.spinner.source = this.map.getSource(this.spinner.id)
      
      this.spinner.i = 0
      this.animateSpinner()
    },
    getSpinnerPoint(angle) {
      return {
        type: 'Point',
        coordinates: [this.spinner.center.lng + Math.cos(-angle) * this.spinner.radius, this.spinner.center.lat + Math.sin(-angle) * this.spinner.radius]
      }
    },
    animateSpinner() {
      this.spinner.source.setData(this.getSpinnerPoint(this.spinner.i))
      this.spinner.timerId = setTimeout(this.animateSpinner, 10)
      this.spinner.i++
      if(this.spinner.i > 360) this.spinner.i = 0
    },
    stopSpinner() {
      clearTimeout(this.spinner.timerId)
      this.spinner.timerId = 0
      console.log(this.map.getLayer(this.spinner.id))
      if(this.map.getLayer(this.spinner.id) !== undefined) this.map.removeLayer(this.spinner.id)
      if(this.map.getSource(this.spinner.id) !== undefined) this.map.removeSource(this.spinner.id)
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
