import { RouterState } from 'connected-react-router'

import {
  ItineraryExistence,
  MonitoredTrip,
  User
} from '../components/user/types'

import { AppConfig } from './config-types'

export interface OtpState {
  activeSearchId?: string
  config: AppConfig
  filter: {
    sort: {
      type: string
    }
  }
  overlay: any
  serviceTimeRange?: {
    end: number
    start: number
  }
  transitIndex: any
  ui: any
}

export interface UserState {
  itineraryExistence?: ItineraryExistence
  localUser?: any
  loggedInUser: User
  loggedInUserMonitoredTrips?: MonitoredTrip[]
}

export interface AppReduxState {
  calltaker?: any
  otp: OtpState
  router: RouterState
  user: UserState
}
