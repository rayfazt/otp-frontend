/* eslint-disable react/jsx-indent */
import { ArrowLeft } from '@styled-icons/fa-solid/ArrowLeft'
import { Label as BsLabel, Button } from 'react-bootstrap'
import { Circle } from '@styled-icons/fa-solid/Circle'
import { connect } from 'react-redux'
import { FormattedMessage, injectIntl } from 'react-intl'
import { toDate } from 'date-fns-tz'
import coreUtils from '@opentripplanner/core-utils'
import PropTypes from 'prop-types'
import React, { Component, createRef } from 'react'
import styled from 'styled-components'

import * as apiActions from '../../actions/api'
import * as mapActions from '../../actions/map'
import * as uiActions from '../../actions/ui'
import { getOperatorAndRoute } from '../../util/state'
import { StyledIconWrapper } from '../util/styledIcon'
import Alert from '../util/alert'
import InvisibleA11yLabel from '../util/invisible-a11y-label'
import PageTitle from '../util/page-title'
import Strong from '../util/strong-text'

import DepartureTime from './departure-time'
import ViewStopButton from './view-stop-button'

const { getCurrentDate } = coreUtils.time

const StopList = styled.ol`
  list-style: none;
  padding-left: 0;
`
const Stop = styled.li`
  align-items: center;
  display: flex;
`
const RouteName = styled.h2`
  font-size: inherit;
  margin: 0 0 1em 0;
`
const HeaderText = styled.h1`
  margin: 2px 0 0 0;
`
const FlexWrapper = styled.div`
  display: flex;
`

class TripViewer extends Component {
  static propTypes = {
    findTrip: apiActions.findTrip.type,
    hideBackButton: PropTypes.bool,
    homeTimezone: PropTypes.string,
    intl: PropTypes.object,
    setViewedTrip: uiActions.setViewedTrip.type,
    transitOperators: PropTypes.array,
    tripData: PropTypes.object,
    viewedTrip: PropTypes.object
  }

  firstStopRef = createRef()

  _backClicked = () => {
    this.props.setViewedTrip(null)
  }

  componentDidMount() {
    const { findTrip, viewedTrip } = this.props
    const { tripId } = viewedTrip
    findTrip({ tripId })
  }

  componentDidUpdate() {
    const { current } = this.firstStopRef
    if (current) {
      current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  getTitle = () => {
    const { intl, transitOperators, tripData } = this.props
    return [
      intl.formatMessage({ id: 'components.TripViewer.header' }),
      tripData?.route &&
        getOperatorAndRoute(tripData.route, transitOperators, intl)
    ]
  }

  render() {
    const { hideBackButton, homeTimezone, intl, tripData, viewedTrip } =
      this.props
    const startOfDay = toDate(getCurrentDate(homeTimezone), {
      timeZone: homeTimezone
    })

    const fromIndex = tripData?.stops?.findIndex(
      (stop) => stop.stopId === viewedTrip?.fromStopId
    )
    const toIndex = tripData?.stops?.findIndex(
      (stop) => stop.stopId === viewedTrip?.toStopId
    )

    return (
      <div className="trip-viewer">
        <PageTitle title={this.getTitle()} />
        <div className="trip-viewer-header">
          {!hideBackButton && (
            <div className="back-button-container">
              <Button bsSize="small" onClick={this._backClicked}>
                <StyledIconWrapper>
                  <ArrowLeft />
                </StyledIconWrapper>
                <FormattedMessage id="common.forms.back" />
              </Button>
            </div>
          )}

          <HeaderText className="header-text">
            <FormattedMessage id="components.TripViewer.header" />
          </HeaderText>
          <div style={{ clear: 'both', height: '0.25ch' }} />
          {tripData && (
            <div>
              <RouteName>
                {tripData.route && (
                  <FormattedMessage
                    id="components.TripViewer.routeHeader"
                    values={{
                      routeLongName: tripData.route.longName,
                      routeShortName: tripData.route.shortName,
                      strong: Strong
                    }}
                  />
                )}
              </RouteName>
              {fromIndex > -1 && (
                <Alert>
                  <FormattedMessage
                    id="components.TripViewer.tripDescription"
                    values={{
                      boardAtStop: (
                        <strong>{tripData.stops?.[fromIndex]?.name}</strong>
                      ),
                      disembarkAtStop: (
                        <strong>{tripData.stops?.[toIndex]?.name}</strong>
                      )
                    }}
                  />
                </Alert>
              )}
            </div>
          )}
        </div>

        <div className="trip-viewer-body">
          <StopList
            aria-label={intl.formatMessage({
              id: 'components.TripViewer.listOfRouteStops'
            })}
          >
            {tripData &&
              tripData.stops &&
              tripData.stopTimes &&
              tripData.stops.map((stop, i) => {
                let stripMapLineClass = 'strip-map-line'
                if (i === 0) stripMapLineClass = 'strip-map-line-first'
                else if (i === tripData.stops.length - 1) {
                  stripMapLineClass = 'strip-map-line-last'
                }

                let stopLabel = null
                let refProp = null
                if (fromIndex === i) {
                  stopLabel = (
                    <FormattedMessage id="components.TripViewer.startOfTrip" />
                  )
                  refProp = this.firstStopRef
                }
                if (toIndex === i) {
                  stopLabel = (
                    <FormattedMessage id="components.TripViewer.endOfTrip" />
                  )
                }

                let highlightClass
                if (i === fromIndex) {
                  highlightClass = 'strip-map-highlight-first'
                } else if (i > fromIndex && i < toIndex) {
                  highlightClass = 'strip-map-highlight'
                } else if (i === toIndex) {
                  highlightClass = 'strip-map-highlight-last'
                }

                return (
                  <Stop key={i}>
                    <FlexWrapper style={{ width: '80%' }}>
                      <FlexWrapper>
                        {stopLabel && (
                          <InvisibleA11yLabel>{stopLabel}</InvisibleA11yLabel>
                        )}
                        <div className="stop-time" ref={refProp}>
                          <DepartureTime
                            originDate={startOfDay}
                            stopTime={tripData.stopTimes[i]}
                          />
                        </div>
                        <div className="strip-map-container">
                          {highlightClass && <div className={highlightClass} />}
                          <div className={stripMapLineClass} />
                          <div className="strip-map-icon">
                            <StyledIconWrapper>
                              <Circle />
                            </StyledIconWrapper>
                          </div>
                        </div>
                      </FlexWrapper>
                      <div className="stop-name">{stop.name}</div>
                    </FlexWrapper>

                    <div className="stop-button-container">
                      <ViewStopButton
                        stop={stop}
                        text={
                          <FormattedMessage id="components.TripViewer.viewStop" />
                        }
                      />
                    </div>

                    <div style={{ clear: 'both' }} />
                  </Stop>
                )
              })}
          </StopList>
        </div>
      </div>
    )
  }
}

const mapStateToProps = (state) => {
  const viewedTrip = state.otp.ui.viewedTrip
  return {
    homeTimezone: state.otp.config.homeTimezone,
    transitOperators: state.otp.config.transitOperators,
    tripData: state.otp.transitIndex.trips[viewedTrip.tripId],
    viewedTrip
  }
}

const mapDispatchToProps = {
  findTrip: apiActions.findTrip,
  setLocation: mapActions.setLocation,
  setViewedTrip: uiActions.setViewedTrip
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(injectIntl(TripViewer))
