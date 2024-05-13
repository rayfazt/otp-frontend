/* eslint-disable react/prop-types */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { connect } from 'react-redux'
import { injectIntl } from 'react-intl'
import { NavigationControl } from 'react-map-gl'
import BaseMap from '@opentripplanner/base-map'
import generateOTP2TileLayers from '@opentripplanner/otp2-tile-overlay'
import React, { Component } from 'react'
import styled from 'styled-components'

import {
  assembleBasePath,
  bikeRentalQuery,
  carRentalQuery,
  vehicleRentalQuery
} from '../../actions/api'
import { ComponentContext } from '../../util/contexts'
import { getActiveItinerary, getActiveSearch } from '../../util/state'
import { MainPanelContent } from '../../actions/ui-constants'
import { setLocation, setMapPopupLocationAndGeocode } from '../../actions/map'
import { setViewedStop } from '../../actions/ui'
import { updateOverlayVisibility } from '../../actions/config'

import ElevationPointMarker from './elevation-point-marker'
import EndpointsOverlay from './connected-endpoints-overlay'
import GeoJsonLayer from './connected-geojson-layer'
import ItinSummaryOverlay from './itinerary-summary-overlay'
import NearbyViewDotOverlay from './nearby-view-dot-overlay'
import ParkAndRideOverlay from './connected-park-and-ride-overlay'
import PointPopup from './point-popup'
import RoutePreviewOverlay from './route-preview-overlay'
import RouteViewerOverlay from './connected-route-viewer-overlay'
import StopsOverlay from './connected-stops-overlay'
import TransitiveOverlay from './connected-transitive-overlay'
import TransitVehicleOverlay from './connected-transit-vehicle-overlay'
import TripViewerOverlay from './connected-trip-viewer-overlay'
import VehicleRentalOverlay from './connected-vehicle-rental-overlay'
import withMap from './with-map'

const MapContainer = styled.div`
  height: 100%;
  width: 100%;

  .map {
    height: 100%;
    width: 100%;
  }

  * {
    box-sizing: unset;
  }

  .maplibregl-popup-content,
  .mapboxgl-popup-content {
    border-radius: 10px;
    box-shadow: 0 3px 14px 4px rgb(0 0 0 / 20%);
  }
`

/**
 * Determines the localized name of a map layer by its type.
 */
function getLayerName(overlay, config, intl) {
  const { name, type } = overlay

  switch (name) {
    case 'Streets':
      return intl.formatMessage({ id: 'components.MapLayers.streets' })
    case 'Satellite':
      return intl.formatMessage({ id: 'components.MapLayers.satellite' })
    default:
      if (name) return name
  }

  // If overlay.name is not specified, use the type to determine the name.
  switch (type) {
    case 'streets':
      return intl.formatMessage({ id: 'components.MapLayers.streets' })
    case 'satellite':
      return intl.formatMessage({ id: 'components.MapLayers.satellite' })
    case 'stops':
      return intl.formatMessage({ id: 'components.MapLayers.stops' })
    case 'otp2':
      return type
    default:
      console.warn(`No name found for overlay type ${type}.`)
      return type
  }
}

class DefaultMap extends Component {
  static contextType = ComponentContext

  constructor(props) {
    super(props)
    const {
      initLat: lat = null,
      initLon: lon = null,
      initZoom: zoom = 13
    } = props.mapConfig || {}
    this.state = {
      lat,
      lon,
      zoom
    }
  }

  /**
   * Checks whether the modes have changed between old and new queries and
   * whether to update the map overlays accordingly
   */
  _handleQueryChange = (oldQuery, newQuery) => {
    const { overlays = [] } = this.props.mapConfig || {}
    if (oldQuery.mode) {
      // Determine any added/removed modes
      const oldModes = oldQuery.mode.split(',')
      const newModes = newQuery.mode.split(',')
      const removed = oldModes.filter((m) => !newModes.includes(m))
      const added = newModes.filter((m) => !oldModes.includes(m))
      const overlayVisibility = []
      for (const oConfig of overlays) {
        if (!oConfig.modes || oConfig.modes.length !== 1) continue
        const overlayMode = oConfig.modes[0]
        if (added.includes(overlayMode)) {
          overlayVisibility.push({
            overlay: oConfig,
            visible: true
          })
        }
        if (removed.includes(overlayMode)) {
          overlayVisibility.push({
            overlay: oConfig,
            visible: false
          })
        }
      }

      // Only trigger update action if there are overlays to update.
      if (overlayVisibility.length > 0) {
        this.props.updateOverlayVisibility(overlayVisibility)
      }
    }
  }

  onMapClick = (e) => {
    this.props.setMapPopupLocationAndGeocode(e)
  }

  componentDidMount() {
    // Set state lat and lon to null to prevent re-rendering of the map.
    this.setState({
      lat: null,
      lon: null
    })
  }

  componentDidUpdate(prevProps) {
    // Check if any overlays should be toggled due to mode change
    this._handleQueryChange(prevProps.query, this.props.query)
  }

  render() {
    const {
      config,
      intl,
      itinerary,
      mapConfig,
      nearbyViewActive,
      pending,
      setLocation,
      setViewedStop
    } = this.props
    const { getCustomMapOverlays, getTransitiveRouteLabel, ModeIcon } =
      this.context
    const { baseLayers, maxZoom, overlays } = mapConfig || {}
    const { lat, lon, zoom } = this.state
    const vectorTilesEndpoint = `${assembleBasePath(config)}${
      config.api?.path
    }/vectorTiles`

    const baseLayersWithNames = baseLayers?.map((baseLayer) => ({
      ...baseLayer,
      name: getLayerName(baseLayer, config, intl)
    }))
    const baseLayerUrls = baseLayersWithNames?.map((bl) => bl.url)
    const baseLayerNames = baseLayersWithNames?.map((bl) => bl.name)

    return (
      <MapContainer className="percy-hide">
        <BaseMap
          baseLayer={
            baseLayerUrls?.length > 1 ? baseLayerUrls : baseLayerUrls?.[0]
          }
          baseLayerNames={baseLayerNames}
          center={[lat, lon]}
          mapLibreProps={{ reuseMaps: true }}
          maxZoom={maxZoom}
          onContextMenu={this.onMapClick}
          showEverything={nearbyViewActive}
          zoom={zoom}
        >
          <PointPopup />
          <NearbyViewDotOverlay />
          <ItinSummaryOverlay />
          <RoutePreviewOverlay />
          <EndpointsOverlay />
          <RouteViewerOverlay />
          <TransitVehicleOverlay ModeIcon={ModeIcon} />
          <TransitiveOverlay
            getTransitiveRouteLabel={getTransitiveRouteLabel}
          />
          <TripViewerOverlay />
          <ElevationPointMarker />

          {overlays?.map((overlayConfig, k) => {
            const namedLayerProps = {
              ...overlayConfig,
              id: k,
              key: k,
              name: getLayerName(overlayConfig, config, intl)
            }
            switch (overlayConfig.type) {
              case 'stops':
                return <StopsOverlay {...namedLayerProps} />
              case 'otp2':
                return generateOTP2TileLayers(
                  overlayConfig.layers.map((l) => ({
                    ...l,
                    name: getLayerName(l, config, intl) || l.network || l.type
                  })),
                  vectorTilesEndpoint,
                  setLocation,
                  setViewedStop,
                  config.companies
                )
              default:
                return null
            }
          })}
          {/* If set, custom overlays are shown if no active itinerary is shown or pending. */}
          {typeof getCustomMapOverlays === 'function' &&
            getCustomMapOverlays(!itinerary && !pending)}
          <NavigationControl position="bottom-right" />
        </BaseMap>
      </MapContainer>
    )
  }
}

// connect to the redux store

const mapStateToProps = (state) => {
  const activeSearch = getActiveSearch(state)

  return {
    config: state.otp.config,
    itinerary: getActiveItinerary(state),
    mapConfig: state.otp.config.map,
    nearbyViewActive:
      state.otp.ui.mainPanelContent === MainPanelContent.NEARBY_VIEW,
    pending: activeSearch ? Boolean(activeSearch.pending) : false,
    query: state.otp.currentQuery
  }
}

const mapDispatchToProps = {
  setLocation,
  setMapPopupLocationAndGeocode,
  setViewedStop,
  updateOverlayVisibility
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(injectIntl(withMap(DefaultMap)))
