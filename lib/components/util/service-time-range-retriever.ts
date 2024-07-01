import { connect } from 'react-redux'
import { useEffect } from 'react'

import apiActionsV2 from '../../actions/apiV2'

interface Props {
  retrieveServiceTimeRange: () => void
}

/**
 * Invisible component that retrieves the date range available
 * for OTP planning and schedule retrieval.
 */
const ServiceTimeRangeRetriever = ({
  retrieveServiceTimeRange
}: Props): null => {
  // If not already done, retrieve the OTP available date range on mount.
  useEffect(() => {
    retrieveServiceTimeRange()
  }, [retrieveServiceTimeRange])

  // Component renders nothing
  return null
}

// Connect to redux
const mapDispatchToProps = {
  retrieveServiceTimeRange: apiActionsV2.retrieveServiceTimeRange
}

export default connect(null, mapDispatchToProps)(ServiceTimeRangeRetriever)
