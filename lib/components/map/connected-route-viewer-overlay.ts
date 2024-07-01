import { connect } from 'react-redux'
import RouteViewerOverlay from '@opentripplanner/route-viewer-overlay'

/**
 * extract route object from the state
 */
const extractRoute = (state: any) => {
  const { routeId } = state.otp.ui.viewedRoute || {}
  const { routes } = state.otp.transitIndex
  return routeId && routes ? routes[routeId] : {}
}

/**
 * get displayed route data.
 */
const getRouteData = (state: any) => {
  const { patternId } = state.otp.ui.viewedRoute || {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { patterns, vehicles, ...otherRouteData } = extractRoute(state)

  const filteredPatterns =
    patternId && patterns
      ? {
          [patternId]: patterns[patternId]
        }
      : patterns || []

  return { ...otherRouteData, patterns: filteredPatterns }
}

const cache: {
  id?: string | null
  routeData: any
} = {
  id: null,
  routeData: null
}

// connect to redux store
const mapStateToProps = (state: any) => {
  const { patterns = {}, pending } = extractRoute(state)
  let routeData
  const shouldCache = !pending && Object.keys(patterns).length !== 0
  if (shouldCache) {
    const { patternId, routeId } = state.otp.ui.viewedRoute || {}
    const id = `${routeId}-${patternId || ''}`
    if (id !== cache.id) {
      cache.id = id
      cache.routeData = getRouteData(state)
    }
    routeData = cache.routeData
  } else {
    routeData = getRouteData(state)
  }

  return {
    clipToPatternStops:
      state.otp.config.routeViewer?.hideRouteShapesWithinFlexZones,
    routeData
  }
}

export default connect(mapStateToProps)(RouteViewerOverlay)
