import { connect } from 'react-redux'
import { injectIntl, IntlShape } from 'react-intl'
import TransitiveCanvasOverlay from '@opentripplanner/transitive-overlay'

import { getActiveLeg, getTransitiveData } from '../../util/state'

type Props = {
  intl?: IntlShape
  labeledModes?: string[]
  styles?: {
    labels: Record<string, unknown>
    segmentLabels: Record<string, unknown>
  }
}

// connect to the redux store
const mapStateToProps = (state: Record<string, any>, ownProps: Props) => {
  const { labeledModes, styles } = state.otp.config.map.transitive || {}
  const { viewedRoute } = state.otp.ui
  if (state.otp.ui.mainPanelContent !== null && viewedRoute) {
    return {}
  }

  return {
    activeLeg: getActiveLeg(state),
    labeledModes,
    styles,
    // @ts-expect-error typescript
    transitiveData: getTransitiveData(state, ownProps)
  }
}

// @ts-expect-error state.js
export default injectIntl(connect(mapStateToProps)(TransitiveCanvasOverlay))
