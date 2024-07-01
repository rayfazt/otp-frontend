import { FormattedMessage } from 'react-intl'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore typescript
import coreUtils from '@opentripplanner/core-utils'
import React, { Component, createRef } from 'react'
import styled from 'styled-components'

import { FETCH_STATUS } from '../../util/constants'
import { getFirstDepartureFromNow } from '../../util/viewer'
import { isBlank } from '../../util/ui'
import { mergeAndSortStopTimes } from '../../util/stop-times'
import { StopData } from '../util/types'
import Loading from '../narrative/loading'

import DepartureTime from './departure-time'

const StyledTable = styled.table`
  box-sizing: border-box;
  height: 100%;
  width: 100%;
  th {
    background-color: var(--main-base-color, white);
    box-shadow: 0 1px 0px 0px #ccc;
    font-size: 75%;
    position: sticky;
    top: 0px;
  }
  tr > * {
    border-bottom: 1px solid #ccc;
    padding: 2px 0 2px 10px;
    vertical-align: top;
  }
  td:first-child,
  th:first-child {
    padding-left: 0;
  }
`

const BlockCell = styled.td`
  max-width: 100px;
  overflow-x: hidden;
  text-overflow: ellipsis;
`
const RouteCell = styled.td`
  font-weight: bold;
`
const TimeCell = styled.td`
  font-weight: bold;
  text-align: right;
  white-space: nowrap;
`

class StopScheduleTable extends Component<{
  date: string
  homeTimezone: string
  showBlockIds?: boolean
  stopData: StopData
}> {
  targetDepartureRef = createRef<HTMLTableRowElement>()

  _scrollToFirstDeparture = (): void => {
    const { current } = this.targetDepartureRef
    if (current) {
      current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  componentDidMount(): void {
    this._scrollToFirstDeparture()
  }

  componentDidUpdate(): void {
    this._scrollToFirstDeparture()
  }

  render(): JSX.Element {
    const { date, homeTimezone, showBlockIds, stopData } = this.props
    if (stopData.fetchStatus === FETCH_STATUS.FETCHING) {
      return <Loading small />
    }
    const mergedStopTimes = mergeAndSortStopTimes(stopData)

    const today = coreUtils.time.getCurrentDate(homeTimezone)

    const shouldHighlightFirstDeparture =
      mergedStopTimes.length && date === today
    const highlightedStopTime = shouldHighlightFirstDeparture
      ? getFirstDepartureFromNow(mergedStopTimes)
      : null

    return (
      <StyledTable>
        <thead>
          <tr>
            {showBlockIds && (
              <th scope="col">
                <FormattedMessage id="components.StopScheduleTable.block" />
              </th>
            )}
            <th scope="col">
              <FormattedMessage id="components.StopScheduleTable.route" />
            </th>
            <th scope="col">
              <FormattedMessage id="components.StopScheduleTable.destination" />
            </th>
            <th scope="col">
              <FormattedMessage id="components.StopScheduleTable.departure" />
            </th>
          </tr>
        </thead>
        <tbody>
          {mergedStopTimes.map((stopTime, index) => {
            const { blockId, headsign, route } = stopTime
            const highlightRow = stopTime === highlightedStopTime
            const className = highlightRow ? 'highlighted-item' : ''
            const nextStopTime = mergedStopTimes[index + 1]
            const scrollToRow = nextStopTime
              ? nextStopTime === highlightedStopTime
              : highlightRow
            const routeName = route
              ? !isBlank(route.shortName)
                ? route.shortName
                : route.longName
              : ''

            const refProp = scrollToRow ? this.targetDepartureRef : undefined

            return (
              <tr className={className} key={index} ref={refProp}>
                {showBlockIds && (
                  <BlockCell title={blockId}>{blockId}</BlockCell>
                )}
                <RouteCell>{routeName}</RouteCell>
                <td>{headsign}</td>
                <TimeCell>
                  <DepartureTime stopTime={stopTime} />
                </TimeCell>
              </tr>
            )
          })}
        </tbody>
      </StyledTable>
    )
  }
}

export default StopScheduleTable
