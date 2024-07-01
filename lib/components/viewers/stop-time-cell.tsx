import { Clock } from '@styled-icons/fa-regular/Clock'
import { connect } from 'react-redux'
import { format, getTimezoneOffset, utcToZonedTime } from 'date-fns-tz'
import { FormattedMessage, useIntl } from 'react-intl'
import { Rss } from '@styled-icons/fa-solid/Rss'
import coreUtils from '@opentripplanner/core-utils'
import isSameDay from 'date-fns/isSameDay'
import React from 'react'
import styled from 'styled-components'

import { AppReduxState } from '../../util/state-types'
import { getSecondsUntilDeparture, getTripStatus } from '../../util/viewer'
import { StyledIconWrapperTextAlign } from '../util/styledIcon'
import FormattedDayOfWeek from '../util/formatted-day-of-week'
import FormattedDuration from '../util/formatted-duration'
import getRealtimeStatusLabel, {
  status
} from '../util/get-realtime-status-label'
import InvisibleA11yLabel from '../util/invisible-a11y-label'
import type { Time } from '../util/types'

import DepartureTime from './departure-time'

const { getUserTimezone } = coreUtils.time
const ONE_HOUR_IN_SECONDS = 3600

const PulsingRss = styled(Rss)`
  animation: pulse-opacity 2s ease-in-out infinite;
  transform: scaleX(-1);
`

type Props = {
  homeTimezone?: string
  onlyShowCountdownForRealtime?: boolean
  stopTime: Time
}

/**
 * render stop time as schedule or countdown, with an optional status icon
 */
// eslint-disable-next-line complexity
const StopTimeCell = ({
  homeTimezone = getUserTimezone(),
  onlyShowCountdownForRealtime,
  stopTime
}: Props): JSX.Element => {
  const intl = useIntl()

  if (!homeTimezone || !stopTime) {
    console.warn(
      'Missing required prop(s) for StopTimeCell: homeTimezone, stopTime'
    )
    return (
      <div>
        <FormattedMessage id="common.forms.error" />
      </div>
    )
  }
  if (isNaN(getTimezoneOffset(homeTimezone))) {
    console.warn(`homeTimezone '${homeTimezone}' is invalid`)
    return (
      <div>
        <FormattedMessage id="common.forms.error" />
      </div>
    )
  }

  const secondsUntilDeparture = Math.round(
    getSecondsUntilDeparture(stopTime, false)
  )
  const departsInFuture = secondsUntilDeparture > 0
  const showCountdown =
    secondsUntilDeparture < ONE_HOUR_IN_SECONDS && departsInFuture
  const isDue = secondsUntilDeparture < 60

  const formattedDay = utcToZonedTime(stopTime.serviceDay * 1000, homeTimezone)

  const realtime = stopTime.realtimeState === 'UPDATED'
  const realtimeLabel = realtime
    ? intl.formatMessage({
        id: 'components.StopTimeCell.realtime'
      })
    : intl.formatMessage({
        id: 'components.StopTimeCell.scheduled'
      })
  return (
    <div className="percy-hide">
      <StyledIconWrapperTextAlign
        style={{
          fontSize: '0.6em',
          margin: 0,
          marginRight: 2
        }}
        title={realtimeLabel}
      >
        {realtime ? <PulsingRss /> : <Clock />}
      </StyledIconWrapperTextAlign>

      <span
        className="percy-hide"
        title={getRealtimeStatusLabel({
          intl,
          minutes: Math.abs(Math.ceil(stopTime.departureDelay / 60)),
          status: getTripStatus(realtime, stopTime.departureDelay, 30) as status
        })}
      >
        {(onlyShowCountdownForRealtime === true && realtime) ||
        (onlyShowCountdownForRealtime === false && showCountdown) ? (
          isDue ? (
            <FormattedMessage id="components.StopTimeCell.imminentArrival" />
          ) : (
            <FormattedDuration
              duration={secondsUntilDeparture}
              includeSeconds={false}
            />
          )
        ) : (
          <>
            {!isSameDay(new Date(), formattedDay) && (
              <InvisibleA11yLabel>
                <FormattedDayOfWeek
                  day={format(formattedDay, 'iiii', {
                    timeZone: homeTimezone
                  }).toLowerCase()}
                />{' '}
              </InvisibleA11yLabel>
            )}
            <DepartureTime realTime stopTime={stopTime} />
          </>
        )}
      </span>
    </div>
  )
}

const mapStateToProps = (state: AppReduxState) => {
  return {
    onlyShowCountdownForRealtime:
      state.otp.config?.itinerary?.onlyShowCountdownForRealtime || false
  }
}

const mapDispatchToProps = {}

export default connect(mapStateToProps, mapDispatchToProps)(StopTimeCell)
