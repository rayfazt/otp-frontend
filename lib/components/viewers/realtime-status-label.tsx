/* eslint-disable @typescript-eslint/ban-ts-comment */
import { connect } from 'react-redux'
import { FormattedMessage, FormattedTime } from 'react-intl'
import { InvisibleAdditionalDetails } from '@opentripplanner/itinerary-body/lib/styled'
import React from 'react'
import styled from 'styled-components'

import { AppReduxState } from '../../util/state-types'
import { getTripStatus, REALTIME_STATUS } from '../../util/viewer'
import FormattedDuration from '../util/formatted-duration'
import FormattedRealtimeStatusLabel from '../util/formatted-realtime-status-label'

export const DelayText = styled.span`
  white-space: nowrap;
`

export const MainContent = styled.div``

const Container = styled.div<{ withBackground?: boolean }>`
  ${(props) =>
    props.withBackground
      ? `background-color: ${props.color};`
      : `color: ${props.color};`}
`

const TimeStruck = styled.div`
  text-decoration: line-through;
  opacity: 0.5;
`

const TimeBlock = styled.div`
  line-height: 1em;
  margin-bottom: 4px;
`

const STATUS = {
  EARLY: {
    color: '#337ab7',
    label: 'early'
  },
  LATE: {
    color: '#D92923',
    label: 'late'
  },
  ON_TIME: {
    color: '#028602',
    label: 'onTime'
  },
  SCHEDULED: {
    label: 'scheduled'
  }
}

const RealtimeStatusLabel = ({
  className,
  delay,
  isRealtime,
  onTimeThresholdSeconds,
  originalTime,
  showScheduleDeviation,
  time,
  withBackground
}: {
  className?: string
  delay: number
  isRealtime?: boolean
  onTimeThresholdSeconds?: number
  originalTime?: number
  showScheduleDeviation?: boolean
  time?: number
  withBackground?: boolean
}): JSX.Element => {
  // @ts-ignore getTripStatus not typed
  const status: typeof REALTIME_STATUS = getTripStatus(
    isRealtime,
    delay,
    onTimeThresholdSeconds
  )
  const isEarlyOrLate =
    // @ts-ignore getTripStatus not typed
    status === REALTIME_STATUS.EARLY || status === REALTIME_STATUS.LATE
  // @ts-ignore getTripStatus is not typed yet
  const color = STATUS[status].color || (withBackground && '#6D6C6C')
  let renderedTime
  if (time) {
    renderedTime = isEarlyOrLate ? (
      <TimeBlock>
        <TimeStruck aria-hidden>
          <FormattedTime timeStyle="short" value={originalTime} />
        </TimeStruck>
        <div>
          <FormattedTime timeStyle="short" value={time} />
        </div>
      </TimeBlock>
    ) : (
      <div>
        <FormattedTime timeStyle="short" value={time} />
      </div>
    )
  }
  return (
    <Container
      className={className}
      color={color}
      withBackground={withBackground}
    >
      {renderedTime}
      <MainContent>
        {showScheduleDeviation && (
          <FormattedRealtimeStatusLabel
            minutes={
              isEarlyOrLate ? (
                <DelayText>
                  <FormattedDuration
                    duration={Math.abs(delay)}
                    includeSeconds={false}
                  />
                </DelayText>
              ) : (
                <>{null}</>
              )
            }
            // @ts-ignore getTripStatus not typed
            status={STATUS[status].label}
          />
        )}
        {isEarlyOrLate && (
          <InvisibleAdditionalDetails>
            <FormattedMessage
              id="components.MetroUI.originallyScheduledTime"
              values={{
                originalTime: (
                  <FormattedTime timeStyle="short" value={originalTime} />
                )
              }}
            />
          </InvisibleAdditionalDetails>
        )}
      </MainContent>
    </Container>
  )
}

const mapStateToProps = (state: AppReduxState) => ({
  onTimeThresholdSeconds: state.otp.config.onTimeThresholdSeconds,
  showScheduleDeviation: state.otp.config.showScheduleDeviation
})

export default connect(mapStateToProps)(RealtimeStatusLabel)
