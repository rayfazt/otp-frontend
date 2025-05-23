import { connect } from 'react-redux'
import { FormattedMessage, useIntl } from 'react-intl'
import { Search } from '@styled-icons/fa-solid/Search'
import { TransitOperator } from '@opentripplanner/types'
import React, { ComponentType } from 'react'

import { AppReduxState } from '../../../util/state-types'
import { Icon, IconWithText } from '../../util/styledIcon'
import { StopData } from '../../util/types'
import InvisibleA11yLabel from '../../util/invisible-a11y-label'
import Link from '../../util/link'
import OperatorLogo from '../../util/operator-logo'
import Strong from '../../util/strong-text'

import { CardBody, CardHeader, CardTitle } from './styled'

type Props = {
  actionIcon: ComponentType
  actionParams?: Record<string, unknown>
  actionPath: string
  actionText: JSX.Element
  fromToSlot: JSX.Element
  onZoomClick?: () => void
  stopData: StopData & { distance?: number }
  titleAs?: string
  transitOperators?: TransitOperator[]
}

const Operator = ({ operator }: { operator?: TransitOperator }) => {
  const intl = useIntl()
  if (!operator) {
    return null
  } else {
    const operatorLogoAriaLabel = intl.formatMessage(
      {
        id: 'components.StopViewer.operatorLogoAriaLabel'
      },
      {
        operatorName: operator.name
      }
    )
    return operator.logo ? (
      <span
        className={
          operator.name ? operator.name.replace(/\s+/g, '-').toLowerCase() : ''
        }
      >
        <OperatorLogo alt={operatorLogoAriaLabel} operator={operator} />
      </span>
    ) : (
      <InvisibleA11yLabel>{operatorLogoAriaLabel}</InvisibleA11yLabel>
    )
  }
}

const StopCardHeader = ({
  actionIcon,
  actionParams,
  actionPath,
  actionText,
  fromToSlot,
  onZoomClick,
  stopData,
  titleAs,
  transitOperators
}: Props): JSX.Element => {
  const intl = useIntl()
  const agencies =
    stopData.stoptimesForPatterns?.reduce<Set<string>>((prev, cur) => {
      // @ts-expect-error agency type not compatible
      const agencyGtfsId = cur.pattern.route.agency?.gtfsId
      return agencyGtfsId ? prev.add(agencyGtfsId) : prev
    }, new Set()) || new Set()
  const zoomButtonText = onZoomClick
    ? intl.formatMessage({
        id: 'components.StopViewer.zoomToStop'
      })
    : undefined

  return (
    <>
      <CardHeader>
        {/* @ts-expect-error 'as' prop */}
        <CardTitle as={titleAs}>
          {transitOperators
            ?.filter((to) => Array.from(agencies).includes(to.agencyId))
            .filter(
              (to, index, arr) =>
                index === arr.findIndex((t) => t?.name === to?.name)
            )
            .map((to) => (
              <Operator key={to.agencyId} operator={to} />
            ))}
          <span>{stopData.name}</span>
        </CardTitle>
      </CardHeader>
      <CardBody>
        <div>
          <FormattedMessage
            id="components.StopViewer.displayStopId"
            values={{
              stopId: stopData.code || stopData.gtfsId,
              strong: Strong
            }}
          />
          {onZoomClick ? (
            <button
              className="link-button"
              onClick={onZoomClick}
              title={zoomButtonText}
            >
              <Icon Icon={Search} style={{ marginLeft: '0.2em' }} />
              <InvisibleA11yLabel>{zoomButtonText}</InvisibleA11yLabel>
            </button>
          ) : null}
          <Link
            className="pull-right"
            style={{ color: 'inherit', fontSize: 'small' }}
            to={actionPath}
            toParams={actionParams}
          >
            <IconWithText Icon={actionIcon}>{actionText}</IconWithText>
          </Link>
        </div>
        {fromToSlot}
      </CardBody>
    </>
  )
}

const mapStateToProps = (state: AppReduxState) => {
  const { config } = state.otp
  return {
    transitOperators: config.transitOperators
  }
}

export default connect(mapStateToProps)(StopCardHeader)
