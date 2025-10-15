/* eslint-disable custom/no-export-only-files */

/**
 * MQTT Entity Types
 * TypeScript type definitions for MQTT entities and Home Assistant Discovery
 */

import { PlaylistData } from "@spotify-to-plex/shared-types/dashboard/PlaylistData";
import { SavedItem } from "@spotify-to-plex/shared-types/spotify/SavedItem";

export type MQTTConfig = {
  brokerUrl: string;
  username?: string;
  password?: string;
  topicPrefix: string;
  discoveryPrefix: string;
};

export type MQTTEntity = {
  id: string;
  category: string;
  category_id: string;
  name: string;
  media_content_id: string;
  thumb: string;
  icon: string;
  friendly_name: string;
};

export type HomeAssistantDiscoveryConfig = {
  name: string;
  unique_id: string;
  state_topic: string;
  value_template: string;
  json_attributes_topic: string;
  icon: string;
  device: {
    identifiers: string[];
    name: string;
    manufacturer: string;
    model: string;
  };
};

export type MQTTPublishOptions = {
  qos: 0 | 1 | 2;
  retain: boolean;
};

export type PublishedItem = {
  id: string;
  entity_id: string;
  category: string;
};

export type TrackLink = {
  spotify_id: string;
  plex_id?: string[];
  [key: string]: unknown;
};

export type LoadedData = {
  savedItems: SavedItem[];
  playlists: PlaylistData;
  trackLinks: TrackLink[];
};
