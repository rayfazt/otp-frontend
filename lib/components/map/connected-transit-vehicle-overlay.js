/* eslint-disable react/prop-types */
/**
 * shows realtime positions of vehicles on a route using the otp-ui/transit-vehicle-overlay.
 */

import { FormattedMessage, FormattedNumber, injectIntl } from 'react-intl'
import TransitVehicleOverlay, {
  Circle,
  withCaret,
  withRouteColorBackground
} from '@opentripplanner/transit-vehicle-overlay'

import { capitalizeFirst } from '../../util/ui'
import { connect } from 'react-redux'
import { formatDuration } from '../util/formatted-duration'
import FormattedTransitVehicleStatus from '../util/formatted-transit-vehicle-status'

import React from 'react'

function VehicleTooltip(props) {
  const { intl, vehicle } = props

  let vehicleLabel = vehicle?.label || vehicle?.vehicleId
  if (
    vehicleLabel !== null &&
    (vehicleLabel?.length <= 5 || vehicle?.vehicleId)
  ) {
    vehicleLabel = intl.formatMessage(
      { id: 'components.TransitVehicleOverlay.vehicleName' },
      { vehicleNumber: vehicleLabel }
    )
  } else if (vehicle?.label) {
    vehicleLabel = vehicle?.label
  }

  const stopStatus = vehicle?.stopStatus || 'in_transit_to'

  return (
    <>
      <div>
        <strong>{vehicleLabel}</strong>
      </div>
      <div>
        {capitalizeFirst(
          intl.formatMessage(
            { id: 'common.time.durationAgo' },
            {
              duration: formatDuration(
                Math.floor(Date.now() / 1000 - vehicle?.seconds),
                intl,
                true
              )
            }
          )
        )}
      </div>
      {stopStatus !== 'STOPPED_AT' && vehicle?.speed > 0 && (
        <div>
          <FormattedMessage
            id="components.TransitVehicleOverlay.travelingAt"
            values={{
              milesPerHour: (
                <FormattedNumber
                  // eslint-disable-next-line react/style-prop-object
                  style="unit"
                  unit="mile-per-hour"
                  value={Math.round(vehicle.speed)}
                />
              )
            }}
          />
        </div>
      )}
      {vehicle?.nextStopName && (
        <div>
          <FormattedTransitVehicleStatus
            stop={vehicle.nextStopName}
            stopStatus={stopStatus.toLowerCase()}
          />
        </div>
      )}
    </>
  )
}

const CaretTouchingBorder = withCaret(Circle, {
  height: 5,
  offset: 1.5,
  width: 10
})

// Round vehicle symbol with arrow on the border
const IconContainer = withRouteColorBackground(CaretTouchingBorder, {
  alphaHex: 'aa',
  display: 'onhover'
})

// connect to redux store
const mapStateToProps = (state) => {
  const viewedRoute = state.otp.ui.viewedRoute
  const route = state.otp.transitIndex?.routes?.[viewedRoute?.routeId]

  const ConfiguredIconContainer =
    state.otp.config?.routeViewer?.vehicleIconHighlight === false
      ? CaretTouchingBorder
      : IconContainer

  let vehicleList = []

  // add missing fields to vehicle list
  if (viewedRoute?.routeId) {
    vehicleList = route?.vehicles?.map((vehicle) => {
      vehicle.routeType = route?.mode
      vehicle.routeColor =
        route.color && !route.color.includes('#')
          ? '#' + route.color
          : route?.color || '#5A5A5A'
      vehicle.routeShortName = vehicle.routeShortName || route?.shortName
      vehicle.routeLongName = vehicle.routeLongName || route?.longName
      vehicle.textColor = route?.routeTextColor
      return vehicle
    })

    // remove all vehicles not on pattern being currently viewed
    if (viewedRoute.patternId && vehicleList) {
      vehicleList = vehicleList.filter(
        (vehicle) => vehicle.patternId === viewedRoute.patternId
      )
    }
  }
  return {
    color: route?.color ? '#' + route.color : null,
    IconContainer: ConfiguredIconContainer,
    iconPadding: state.otp.config?.routeViewer?.vehicleIconPadding,
    maxVehicleAge: state.otp.config?.routeViewer?.maxRealtimeVehicleAge,
    TooltipSlot: injectIntl(VehicleTooltip),
    vehicles: vehicleList
  }
}

const mapDispatchToProps = {}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(TransitVehicleOverlay)
