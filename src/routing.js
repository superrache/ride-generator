var openrouteservice = require('openrouteservice-js')
var Directions = new openrouteservice.Directions({ api_key: '5b3ce3597851110001cf6248deda538e760e496ebf9fa229cbb09ec3' })

export async function route (points, mode) {
  var coordinates = []
  points.forEach(function (point) {
    coordinates.push([point.lng, point.lat])
  })

  const calculation = await Directions.calculate({
    coordinates: coordinates,
    profile: mode,
    //avoidables: ['highways', 'tollways', 'ferries', 'fords'],
    format: 'json'
  })

  if(calculation.routes && calculation.routes.length > 0) {
    return calculation.routes[0]
  } else {
    return null
  }
}

export function decodeGeometry (encoded, precision) {
  precision = precision || 5
  precision = Math.pow(10, -precision)
  var len = encoded.length; var index = 0; var lat = 0; var lng = 0; var array = []
  while (index < len) {
    var b; var shift = 0; var result = 0
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
    array.push([lng * precision, lat * precision])
  }
  return array
}
