import { connect } from 'react-redux'
import { useCallback, useEffect, useState } from 'react'

import * as apiActions from '../../actions/api'

interface Props {
  getVehiclePositionsForRoute: (id: string) => void
  refreshSeconds: number
  routeId?: string
}

const VehiclePositionRetriever = ({
  getVehiclePositionsForRoute,
  refreshSeconds,
  routeId
}: Props) => {
  const [refreshTimer, setRefreshTimer] = useState<NodeJS.Timeout | null>(null)

  const refreshVehiclePositions = useCallback(() => {
    if (routeId) {
      getVehiclePositionsForRoute(routeId)
    }
  }, [routeId, getVehiclePositionsForRoute])

  useEffect(() => {
    // fetch vehicle positions when initially mounting component and route id is available
    if (routeId) {
      refreshVehiclePositions()

      if (!refreshTimer) {
        setRefreshTimer(
          setInterval(refreshVehiclePositions, refreshSeconds * 1000)
        )
      }
    }

    return () => {
      // stop refreshing vehicle positions component unmounts
      if (refreshTimer) {
        clearInterval(refreshTimer)
        setRefreshTimer(null)
      }
    }
  }, [routeId, refreshVehiclePositions, refreshTimer, refreshSeconds])

  return null
}

// connect to redux store
const mapStateToProps = (state: any) => {
  return {
    refreshSeconds:
      state.otp.config.routeViewer?.vehiclePositionRefreshSeconds || 30,
    routeId: state.otp.ui.viewedRoute?.routeId
  }
}

const mapDispatchToProps = {
  getVehiclePositionsForRoute: apiActions.getVehiclePositionsForRoute
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(VehiclePositionRetriever)
