import { format } from 'date-fns-tz'
import { FormattedMessage } from 'react-intl'
import { InfoCircle } from '@styled-icons/fa-solid/InfoCircle'
import dateFnsUSLocale from 'date-fns/locale/en-US'
import React from 'react'

import { IconWithText } from '../util/styledIcon'

interface Props {
  date?: number | Date
  homeTimezone: string
}

const TimezoneWarning = ({
  date = Date.now(),
  homeTimezone
}: Props): JSX.Element => {
  const timezoneCode = format(date, 'z', {
    locale: dateFnsUSLocale,
    timeZone: homeTimezone
  })

  return (
    <IconWithText Icon={InfoCircle}>
      <FormattedMessage
        id="components.StopViewer.timezoneWarning"
        values={{ timezoneCode: <strong>{timezoneCode}</strong> }}
      />
    </IconWithText>
  )
}

export default TimezoneWarning
