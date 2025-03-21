/*

WHY THE FUCK DOES THIS WORK

https://github.com/Turfjs/turf/issues/933#issuecomment-1249056346

*/
//TODO: ADD TYPES and make rewrite later

function dist2d(coord1, coord2) {
  let dx = coord1[0] - coord2[0]
  let dy = coord1[1] - coord2[1]
  return Math.sqrt(dx * dx + dy * dy)
}
function equals(coord1, coord2) {
  let equals = true
  for (let i = coord1.length - 1; i >= 0; --i) {
    if (coord1[i] != coord2[i]) {
      equals = false
      break
    }
  }
  return equals
}
function offsetCoords(coords, offset) {
  var path = []
  var N = coords.length - 1
  var max = N
  var mi, mi1, li, li1, ri, ri1, si, si1, Xi1, Yi1
  var p0, p1, p2
  var isClosed = equals(coords[0], coords[N])
  if (!isClosed) {
    p0 = coords[0]
    p1 = coords[1]
    p2 = [
      p0[0] + ((p1[1] - p0[1]) / dist2d(p0, p1)) * offset,
      p0[1] - ((p1[0] - p0[0]) / dist2d(p0, p1)) * offset
    ]
    path.push(p2)
    coords.push(coords[N])
    N++
    max--
  }
  for (var i = 0; i < max; i++) {
    p0 = coords[i]
    p1 = coords[(i + 1) % N]
    p2 = coords[(i + 2) % N]
    mi = (p1[1] - p0[1]) / (p1[0] - p0[0])
    mi1 = (p2[1] - p1[1]) / (p2[0] - p1[0])
    // Prevent alignements
    if (Math.abs(mi - mi1) > 1e-10) {
      li = Math.sqrt((p1[0] - p0[0]) * (p1[0] - p0[0]) + (p1[1] - p0[1]) * (p1[1] - p0[1]))
      li1 = Math.sqrt((p2[0] - p1[0]) * (p2[0] - p1[0]) + (p2[1] - p1[1]) * (p2[1] - p1[1]))
      ri = p0[0] + (offset * (p1[1] - p0[1])) / li
      ri1 = p1[0] + (offset * (p2[1] - p1[1])) / li1
      si = p0[1] - (offset * (p1[0] - p0[0])) / li
      si1 = p1[1] - (offset * (p2[0] - p1[0])) / li1
      Xi1 = (mi1 * ri1 - mi * ri + si - si1) / (mi1 - mi)
      Yi1 = (mi * mi1 * (ri1 - ri) + mi1 * si - mi * si1) / (mi1 - mi)
      // Correction for vertical lines
      if (p1[0] - p0[0] == 0) {
        Xi1 = p1[0] + (offset * (p1[1] - p0[1])) / Math.abs(p1[1] - p0[1])
        Yi1 = mi1 * Xi1 - mi1 * ri1 + si1
      }
      if (p2[0] - p1[0] == 0) {
        Xi1 = p2[0] + (offset * (p2[1] - p1[1])) / Math.abs(p2[1] - p1[1])
        Yi1 = mi * Xi1 - mi * ri + si
      }
      path.push([Xi1, Yi1])
    }
  }
  if (isClosed) {
    path.push(path[0])
  } else {
    coords.pop()
    p0 = coords[coords.length - 1]
    p1 = coords[coords.length - 2]
    p2 = [
      p0[0] - ((p1[1] - p0[1]) / dist2d(p0, p1)) * offset,
      p0[1] + ((p1[0] - p0[0]) / dist2d(p0, p1)) * offset
    ]
    path.push(p2)
  }
  return path
}

export default offsetCoords
