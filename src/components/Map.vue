<template>
    <div class="container">
      <div id="map" ref="map">
      </div>
      <div id="panel">
        <h1>Détails</h1>
        <div v-html="details"></div>
        <div v-html="instructions"></div>
      </div>
    </div>
</template>

<script>

import { Map, Marker, NavigationControl } from 'maplibre-gl';
//import turf from '@turf/turf'
import * as turf from '@turf/turf'

const DEBUG = true

export default {
  name: 'Map',
  data() {
    return {
      map: null,
      expectedTime: 0.5, // heures
      speed: 4, // km/h
      mode: 'foot',
      details: '',
      instructions: '',
      initMarker: null,
      stepMarkers: [],
      lastPolylineLayerId: null,
      zoom: 14,
      center: { lat: 47.2143, lng: -1.5587 }
    }
  },
  mounted() {
    this.map = new Map({
        container: this.$refs.map,
        style: "https://api.jawg.io/styles/3425c3c4-29a2-494c-a977-e9232dd8cf26.json?access-token=UG9wQV1RcEgsXwkTX9M9qfBUV0ZckAfUhlqa3W4hK16gVbTFDUSMXrn60H1hEE6d",
        center: [this.center.lng, this.center.lat],
        zoom: this.zoom
      })
    
    this.map.addControl(new NavigationControl(), 'top-right')

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
        color: "#FF00FF",
        draggable: true
      }).setLngLat(lngLat)
        .on('dragend', this.onDrag)
        .addTo(this.map)

      this.generateRide(lngLat)
    },
    generateSteps(from) {
      const expectedDistance = this.speed * this.expectedTime
      console.log("expectedDistance=" + expectedDistance + " km")
      
      // on considère un cercle dont le périmètre = expectedDistance
      const expectedCircleRadius = expectedDistance / (2 * Math.PI)
      console.log("expectedCircleRadius=" + expectedCircleRadius + " km")

      // on décentre aléatoirement ce cercle par rapport au point d'origine
      var dlng = this.getRandomDegreeDelta(0.001),
          dlat = this.getRandomDegreeDelta(0.001)
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

      const km = path.distance
      const h = path.time / 3600000
      this.instructions = path.instructions
      
      const coords = this.decodeGeometry(path.points)
      this.lastPolylineLayerId = this.addPolyline(coords)
      console.log('added layer ' + this.lastPolylineLayerId)

      this.details = "Distance : " + km + " km<br/>Temps : " + h + " h"
    },
    async getRoute(points) {
      var pointsArg = ""
      points.forEach(function(point) {
        if(pointsArg.length > 0) pointsArg += "&"
        pointsArg += "point=" + point.lat + "%2C" + point.lng
      })
      const routingUrl = "https://graphhopper.com/api/1/route?"
        + pointsArg
        + "&vehicle=" + this.mode
        + "&avoid=motorway;ferry"
        //+ "&details=street_name;time;distance;max_speed;toll;road_class;road_class_link;road_access;road_environment;lanes;surface"
        + "&optimize=true" // meilleur ordre de passage
        + "&elevation=false"
        + "&instructions=true"
        + "&turn_costs=false"
        + "&locale=fr"
        + "&calc_points=true"
        + "&key=8981bcd5-eaab-459b-9aa0-af1eb64b35e4"

      const response = await fetch(routingUrl)
      const data = await response.json()

      if(data.paths && data.paths.length > 0) {
        return data.paths[0]
      }
    },
    decodeGeometry(encoded, precision) {
      precision = precision || 5
      precision = Math.pow(10, -precision)
      var len = encoded.length, index=0, lat=0, lng = 0, array = []
      while (index < len) {
        var b, shift = 0, result = 0
        do {
          b = encoded.charCodeAt(index++) - 63
          result |= (b & 0x1f) << shift
          shift += 5
        } while (b >= 0x20)
        var dlat = ((result & 1) ? ~(result >> 1) : (result >> 1))
        lat += dlat
        shift = 0
        result = 0
        do {
          b = encoded.charCodeAt(index++) - 63
          result |= (b & 0x1f) << shift
          shift += 5
        } while (b >= 0x20)
        var dlng = ((result & 1) ? ~(result >> 1) : (result >> 1))
        lng += dlng
        array.push( [lng * precision, lat * precision] )
      }
      return array
    },
    getRandomDegreeDelta(max) {
      return Math.random() * max * 2 - max
    },
    newUniqueId() {
      return Math.random().toString(36).substr(2, 9)
    },
    distance(from, to) {
        const earthRadiusKm = 6371;

        const dLat = (to.lat - from.lat) * 180 / Math.PI
        const dLon = (to.lng - from.lng) * 180 / Math.PI

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.sin(dLon / 2) * Math.sin(dLon / 2) * 
                Math.cos(from.lat * 180 / Math.PI) * Math.cos(to.lat * 180 / Math.PI)

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return earthRadiusKm * c;
    },
    addGeojson(geojsonData, type, paint) {
      const layerId = this.newUniqueId()
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
          'line-color': '#FF00FF',
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

<!-- Add "scoped" attribute to limit CSS to this component only -->
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
  background-color: #00001290;
  left: 15px;
  top: 15px;
  width: 300px;
  height: 500px;
  color: white;
  text-align: left;
  padding: 10px;
  z-index: 1005;
}

</style>
