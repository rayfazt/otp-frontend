import { FormattedTime } from 'react-intl'
import addSeconds from 'date-fns/addSeconds'
import React from 'react'

import type { StopTime, Time } from '../util/types'

interface Props {
  originDate?: Date
  realTime?: boolean
  stopTime: Time | StopTime
}

const DepartureTime = ({
  originDate,
  realTime,
  stopTime
}: Props): JSX.Element => {
  const startOfDate = originDate || new Date(stopTime.serviceDay * 1000)
  const departureTimestamp = addSeconds(
    startOfDate,
    realTime && stopTime.realtimeDeparture
      ? stopTime.realtimeDeparture
      : stopTime.scheduledDeparture
  )

  return <FormattedTime timeStyle="short" value={departureTimestamp} />
}

export default DepartureTime
