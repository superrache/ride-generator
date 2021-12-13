export function getRandomDegreeDelta (max) {
  return Math.random() * max * 2 - max
}

export function newUniqueId () {
  return Math.random().toString(36).substr(2, 9)
}

export function distance (from, to) {
  const earthRadiusKm = 6371

  const dLat = (to.lat - from.lat) * 180 / Math.PI
  const dLon = (to.lng - from.lng) * 180 / Math.PI

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.sin(dLon / 2) * Math.sin(dLon / 2) *
            Math.cos(from.lat * 180 / Math.PI) * Math.cos(to.lat * 180 / Math.PI)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return earthRadiusKm * c
}
