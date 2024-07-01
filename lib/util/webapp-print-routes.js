import PrintFieldTripLayout from '../components/admin/print-field-trip-layout'
import PrintLayout from '../components/app/print-layout'

/**
 * mapping of the components to display for each URL printing route
 */
const routes = [
  {
    a11yIgnore: true,
    component: PrintLayout,
    path: '/print'
  },
  {
    a11yIgnore: true,
    component: PrintFieldTripLayout,
    path: '/printFieldTrip'
  }
]

export default routes
