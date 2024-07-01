import { connect } from 'react-redux'
import { Stop } from '@opentripplanner/types'
import StopsOverlay from '@opentripplanner/stops-overlay'

import * as apiActions from '../../actions/api'
import * as mapActions from '../../actions/map'
import * as uiActions from '../../actions/ui'
import { AppReduxState } from '../../util/state-types'
import { MainPanelContent } from '../../actions/ui-constants'

// connect to redux store
const mapStateToProps = (state: AppReduxState) => {
  const { highlightedStop, mainPanelContent, viewedRoute } = state.otp.ui
  const { patternId, routeId } = viewedRoute || {}
  const { patterns, v2 }: { patterns: Record<string, any>; v2: boolean } =
    state.otp.transitIndex.routes?.[routeId] || {}

  let minZoom = 15
  let stops = []

  if (
    (mainPanelContent === MainPanelContent.ROUTE_VIEWER ||
      mainPanelContent === MainPanelContent.PATTERN_VIEWER) &&
    patterns
  ) {
    const stopsById: Record<string, Stop> = {}
    // display stops for the selected pattern for a route.
    if (v2 && !patternId) {
      Object.values(patterns).forEach((p) => {
        p?.stops
          ?.filter((s: Stop) => s.geometries?.geoJson?.type === 'Polygon')
          ?.forEach((s: Stop) => (stopsById[s.id] = s))
      })
    } else if (patternId) {
      patterns?.[patternId]?.stops?.forEach((s: Stop) => (stopsById[s.id] = s))
    }

    stops = Object.values(stopsById)

    minZoom = 2
  } else {
    // display all stops if no route is shown
    stops = state.otp.overlay.transit.stops
  }

  const highlightedStopColor = getComputedStyle(
    document.documentElement
  ).getPropertyValue('--main-base-color')

  return {
    highlightedStop,
    highlightedStopColor,
    minZoom,
    stops
  }
}

const mapDispatchToProps = {
  refreshStops: apiActions.findStopsWithinBBox,
  setLocation: mapActions.setLocation,
  setViewedStop: uiActions.setViewedStop
}

export default connect(mapStateToProps, mapDispatchToProps)(StopsOverlay)
