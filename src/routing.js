export async function route (points, mode) {
  var pointsArg = ''
  points.forEach(function (point) {
    if (pointsArg.length > 0) pointsArg += '&'
    pointsArg += 'point=' + point.lat + '%2C' + point.lng
  })

  const routingUrl = 'https://graphhopper.com/api/1/route?' +
    pointsArg +
    '&vehicle=' + mode +
    '&avoid=motorway;ferry' +
    // + "&details=street_name;time;distance;max_speed;toll;road_class;road_class_link;road_access;road_environment;lanes;surface"
    '&optimize=true' + // meilleur ordre de passage
    '&elevation=false' +
    '&instructions=false' +
    // + "&turn_costs=false"
    '&locale=fr' +
    '&calc_points=true' +
    '&key=8981bcd5-eaab-459b-9aa0-af1eb64b35e4'

  const response = await fetch(routingUrl)
  const data = await response.json()

  if (data.paths && data.paths.length > 0) {
    return data.paths[0]
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
