import { Alert, Button } from 'react-bootstrap'
import { ArrowLeft } from '@styled-icons/fa-solid/ArrowLeft'
import { connect } from 'react-redux'
import { ExclamationCircle } from '@styled-icons/fa-solid/ExclamationCircle'
import { format, parse } from 'date-fns'
import { FormattedMessage, injectIntl, IntlShape } from 'react-intl'
import { MagnifyingGlass } from '@styled-icons/fa-solid/MagnifyingGlass'
import { MapRef } from 'react-map-gl'
import { utcToZonedTime } from 'date-fns-tz'
import coreUtils from '@opentripplanner/core-utils'
import React, { Component, FormEvent } from 'react'
import styled from 'styled-components'

import * as apiActions from '../../actions/api'
import * as mapActions from '../../actions/map'
import { AppReduxState } from '../../util/state-types'
import { IconWithText } from '../util/styledIcon'
import { isBlank, navigateBack } from '../../util/ui'
import { StopData, ZoomToPlaceHandler } from '../util/types'
import { stopIsFlex } from '../../util/viewer'
import { TransitOperatorConfig } from '../../util/config-types'
import PageTitle from '../util/page-title'
import ServiceTimeRangeRetriever from '../util/service-time-range-retriever'
import withMap from '../map/with-map'

import { CardBody, CardHeader } from './nearby/styled'
import FavoriteStopToggle from './favorite-stop-toggle'
import FromToPicker from './nearby/from-to-picker'
import StopCardHeader from './nearby/stop-card-header'
import StopScheduleTable from './stop-schedule-table'
import TimezoneWarning from './timezone-warning'

interface Props {
  calendarMax: string
  calendarMin: string
  findStopTimesForStop: (arg: { date: string; stopId: string }) => void
  hideBackButton?: boolean
  homeTimezone: string
  intl: IntlShape
  map?: MapRef
  showBlockIds?: boolean
  stopData?: StopData
  stopId?: string
  transitOperators: TransitOperatorConfig[]
  zoomToPlace: ZoomToPlaceHandler
}

interface State {
  date: string
}

const { getCurrentDate, getUserTimezone } = coreUtils.time

const inputDateFormat = 'yyyy-MM-dd'

function getDefaultState(timeZone: string) {
  return {
    date: getCurrentDate(timeZone)
  }
}

const Scrollable = styled.div`
  margin-right: -12px;
  overflow-y: auto;
  padding-right: 12px;
`

const StyledAlert = styled(Alert)`
  /* 'clear: both' prevents the date selector from overlapping with the alert. */
  clear: both;
  margin: 10px 0;
  padding: 5px 10px;
  text-align: center;
`

const HeaderCard = styled.div`
  display: flex;
  flex-direction: column;
  margin: 5px 0 0;

  ${CardBody} {
    margin: 25px 0 0;
  }

  input[type='date'] {
    background: inherit;
    border: none;
    clear: right;
    cursor: pointer;
    outline: none;
    width: 125px;
  }
  /* Remove arrows on date input */
  input[type='date']::-webkit-inner-spin-button {
    -webkit-appearance: none;
  }
  /* For Chromium browsers, remove extra space between date and the calendar icon. */
  input[type='date']::-webkit-calendar-picker-indicator {
    margin: 0;
  }
`

const StyledFromToPicker = styled(FromToPicker)`
  button {
    color: inherit;
  }
  span {
    border-color: currentColor;
  }
  svg {
    color: inherit;
    fill: inherit;
  }
`

class StopScheduleViewer extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = getDefaultState(props.homeTimezone)
  }

  _backClicked = () => navigateBack()

  componentDidMount() {
    this._findStopTimesForDate(this.state.date)
  }

  componentDidUpdate() {
    this._zoomToStop()
  }

  _findStopTimesForDate = (date: string) => {
    const { findStopTimesForStop, stopId } = this.props
    if (stopId) {
      findStopTimesForStop({ date, stopId })
    }
  }

  getOperator = () => {
    const { stopData, transitOperators } = this.props

    return transitOperators.find(
      (o) => o.agencyId === stopData?.routes?.[0]?.agency.gtfsId
    )
  }

  getTitle = () => {
    const { intl, stopData } = this.props
    const operator = this.getOperator()
    return [
      (operator ? `${operator.name} ` : '') +
        intl.formatMessage(
          { id: 'components.StopViewer.titleBarStopId' },
          {
            stopId: stopData && coreUtils.itinerary.getDisplayedStopId(stopData)
          }
        ),
      intl.formatMessage({ id: 'components.StopViewer.schedule' })
    ]
  }

  _isDateWithinRange = (date: string) => {
    const { calendarMax, calendarMin } = this.props
    return !isBlank(date) && date >= calendarMin && date <= calendarMax
  }

  handleDateChange = (evt: FormEvent<HTMLInputElement>) => {
    const date = (evt.target as HTMLInputElement).value
    if (this._isDateWithinRange(date)) {
      this._findStopTimesForDate(date)
    }
    this.setState({ date })
  }

  _zoomToStop = () => {
    const { map, stopData, zoomToPlace } = this.props
    zoomToPlace(map, stopData)
  }

  _renderHeader = (agencyCount: number) => {
    const { hideBackButton, stopData, stopId } = this.props
    return (
      <div className="stop-viewer-header">
        {!hideBackButton && (
          <div className="back-button-container">
            <Button bsSize="small" onClick={this._backClicked}>
              <IconWithText Icon={ArrowLeft}>
                <FormattedMessage id="common.forms.back" />
              </IconWithText>
            </Button>
          </div>
        )}

        <HeaderCard>
          {stopData?.name ? (
            <StopCardHeader
              actionIcon={MagnifyingGlass}
              actionParams={{ entityId: stopId }}
              actionPath={`/nearby/${stopData.lat},${stopData.lon}`}
              actionText={
                <FormattedMessage id="components.StopViewer.viewNearby" />
              }
              fromToSlot={this._renderControls()}
              onZoomClick={this._zoomToStop}
              stopData={stopData}
              titleAs="h1"
            />
          ) : (
            <CardHeader>
              <h1>
                <FormattedMessage id="components.StopViewer.loadingText" />
              </h1>
            </CardHeader>
          )}
        </HeaderCard>
        <FavoriteStopToggle stopData={stopData} />

        <div style={{ clear: 'both' }} />
      </div>
    )
  }

  _renderControls = () => {
    const { calendarMax, calendarMin, homeTimezone, intl, stopData } =
      this.props
    const { date } = this.state
    const inHomeTimezone = homeTimezone && homeTimezone === getUserTimezone()

    let warning
    if (inHomeTimezone && this._isDateWithinRange(date)) {
      warning = (
        <StyledAlert bsStyle="info">
          <TimezoneWarning
            date={parse(date, inputDateFormat, new Date())}
            homeTimezone={homeTimezone}
          />
        </StyledAlert>
      )
    }

    if (!this._isDateWithinRange(date)) {
      warning = (
        <StyledAlert bsStyle="warning">
          <IconWithText Icon={ExclamationCircle}>
            <FormattedMessage id="components.StopViewer.noStopsFound" />
          </IconWithText>
        </StyledAlert>
      )
    }

    return (
      <div role="group" style={{ marginBottom: '10px' }}>
        {stopData ? <StyledFromToPicker place={stopData} /> : null}
        <input
          aria-label={intl.formatMessage({
            id: 'components.StopViewer.findSchedule'
          })}
          className="pull-right"
          max={calendarMax}
          min={calendarMin}
          onChange={this.handleDateChange}
          required
          type="date"
          value={this.state.date}
        />

        {warning}
      </div>
    )
  }

  render() {
    const { homeTimezone, showBlockIds, stopData } = this.props
    const { date } = this.state
    const agencyCount = new Set(stopData?.routes?.map((r) => r.agency.gtfsId))
      .size

    return (
      <div className="stop-viewer base-color-bg">
        <PageTitle title={this.getTitle()} />
        <ServiceTimeRangeRetriever />
        {/* Header Block */}
        {this._renderHeader(agencyCount)}

        {stopData && (
          <div className="stop-viewer-body">
            <Scrollable tabIndex={0}>
              {stopIsFlex(stopData) && (
                <div style={{ lineHeight: 'normal' }}>
                  <FormattedMessage id="components.StopViewer.flexStop" />
                </div>
              )}
              {this._isDateWithinRange(date) && (
                <StopScheduleTable
                  date={date}
                  homeTimezone={homeTimezone}
                  showBlockIds={showBlockIds}
                  stopData={stopData}
                />
              )}
            </Scrollable>
          </div>
        )}
      </div>
    )
  }
}

// connect to redux store
const mapStateToProps = (state: AppReduxState) => {
  const {
    config,
    serviceTimeRange = { end: 0, start: 0 },
    transitIndex,
    ui
  } = state.otp
  const {
    homeTimezone,
    stopViewer: stopViewerConfig,
    transitOperators = [] as TransitOperatorConfig[]
  } = config
  const stopLookup = transitIndex.stops
  const stopId = ui.viewedStop.stopId
  const stopData = stopLookup[stopId]
  const now = new Date()
  const thisYear = now.getFullYear()
  const { end, start } = serviceTimeRange
  const calendarMin = format(
    start
      ? utcToZonedTime(start * 1000, homeTimezone)
      : new Date(thisYear, 0, 1),
    inputDateFormat
  )
  const calendarMax = format(
    end
      ? utcToZonedTime((end - 1) * 1000, homeTimezone)
      : new Date(thisYear + 1, 11, 31),
    inputDateFormat
  )

  return {
    calendarMax,
    calendarMin,
    homeTimezone,
    showBlockIds: stopViewerConfig?.showBlockIds,
    stopData,
    stopId,
    transitOperators
  }
}

const mapDispatchToProps = {
  findStopTimesForStop: apiActions.findStopTimesForStop,
  zoomToPlace: mapActions.zoomToPlace
}

export default injectIntl(
  withMap(connect(mapStateToProps, mapDispatchToProps)(StopScheduleViewer))
)
