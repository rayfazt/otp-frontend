import { ClassicLegIcon, ClassicModeIcon } from '@opentripplanner/icons'
import React from 'react'

import {
  BatchResultsScreen,
  BatchRoutingPanel,
  BatchSearchScreen,
  MetroItinerary
} from './index'

const ItineraryBody = MetroItinerary
const LegIcon = ClassicLegIcon
const ModeIcon = ClassicModeIcon
const ItineraryFooter = () => <div />

export function configure(otpConfig) {
  return {
    ItineraryBody,
    ItineraryFooter,
    LegIcon,
    MainPanel: BatchRoutingPanel,
    MobileResultsScreen: BatchResultsScreen,
    MobileSearchScreen: BatchSearchScreen,
    ModeIcon
  }
}
