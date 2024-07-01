import { Route } from '@opentripplanner/types'

import { Pattern, StopData, StopTime } from '../components/util/types'

import { extractHeadsignFromPattern, getRouteIdForPattern } from './viewer'
import { isBlank } from './ui'

interface StopTimesForPattern {
  id: string
  pattern: Pattern
  route?: Route
  times: StopTime[]
}

export interface DetailedStopTime extends StopTime {
  blockId?: string
  headsign: string
  route?: Route
}

/**
 * determine if a stopId corresponds to the last stop time of a pattern
 */
export function isLastStop(stopId: string, pattern: Pattern): boolean {
  if (!pattern.stops) return false
  const position = pattern.stops.findIndex((stop) => stop.gtfsId === stopId)
  return position === pattern.stops.length - 1
}

function getStopTimesByPattern(
  stopData: StopData
): Record<string, StopTimesForPattern> {
  const stopTimesByPattern: Record<string, StopTimesForPattern> = {}
  if (stopData && stopData.routes && stopData.stoptimesForPatterns) {
    const { routes, stoptimesForPatterns } = stopData
    stoptimesForPatterns.forEach(({ pattern, stoptimes }) => {
      const routeId = getRouteIdForPattern(pattern)

      let headsign = stoptimes[0] && stoptimes[0].headsign
      if (isBlank(headsign)) {
        headsign = extractHeadsignFromPattern(pattern)
      }
      pattern.headsign = headsign

      const id = `${routeId}-${headsign}`
      if (!(id in stopTimesByPattern)) {
        const route = routes.find((r) => r.id === routeId)
        stopTimesByPattern[id] = {
          id,
          pattern,
          route,
          times: []
        }
      }
      stopTimesByPattern[id].times =
        stopTimesByPattern[id].times.concat(stoptimes)
    })
  }
  return stopTimesByPattern
}

/**
 * sort stop times by departure times
 */
function stopTimeComparator(a: StopTime, b: StopTime) {
  const aTime = a.serviceDay + (a.realtimeDeparture ?? a.scheduledDeparture)
  const bTime = b.serviceDay + (b.realtimeDeparture ?? b.scheduledDeparture)
  return aTime - bTime
}

/**
 * merges and sorts stop time entries from the patterns in stopData object
 */
export function mergeAndSortStopTimes(stopData: StopData): DetailedStopTime[] {
  const stopTimesByPattern = getStopTimesByPattern(stopData)
  let mergedStopTimes: DetailedStopTime[] = []
  Object.values(stopTimesByPattern).forEach(({ pattern, route, times }) => {
    const timesWithHeadsign = times.map((stopTime) => {
      const headsign = isBlank(stopTime.headsign)
        ? pattern.headsign
        : stopTime.headsign
      return {
        ...stopTime,
        blockId: stopTime.trip.blockId,
        headsign,
        route
      } as DetailedStopTime
    })
    mergedStopTimes = mergedStopTimes.concat(timesWithHeadsign)
  })

  return mergedStopTimes.sort(stopTimeComparator)
}
