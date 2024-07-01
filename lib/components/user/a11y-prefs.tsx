import { Checkbox, FormGroup } from 'react-bootstrap'
import { FormattedMessage } from 'react-intl'
import React from 'react'

/**
 * Renders the accessibility preferences for the account settings page.
 */
const A11yPrefs = ({
  handleBlur, // Formik prop
  handleChange, // Formik prop
  values: userData
}: {
  handleBlur: () => void
  handleChange: () => void
  values: { accessibilityRoutingByDefault: boolean }
}): JSX.Element => {
  const { accessibilityRoutingByDefault } = userData
  return (
    <FormGroup>
      <Checkbox
        checked={accessibilityRoutingByDefault}
        name="accessibilityRoutingByDefault"
        onBlur={handleBlur}
        onChange={handleChange}
      >
        <FormattedMessage id="components.A11yPrefs.accessibilityRoutingByDefault" />
      </Checkbox>
    </FormGroup>
  )
}

export default A11yPrefs
