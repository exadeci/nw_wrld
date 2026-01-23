const fs = require("fs");
const path = require("path");
const os = require("os");

/**
 * Rekordbox integration for reading track information
 */

// Default Rekordbox paths
const REKORDBOX_PATHS = {
  mac: {
    database: path.join(os.homedir(), "Library", "Pioneer", "rekordbox", "master.db"),
    xml: path.join(os.homedir(), "Library", "Pioneer", "rekordbox", "rekordbox.xml"),
  },
  win: {
    database: path.join(os.homedir(), "AppData", "Roaming", "Pioneer", "rekordbox", "master.db"),
    xml: path.join(os.homedir(), "AppData", "Roaming", "Pioneer", "rekordbox", "rekordbox.xml"),
  },
};

function getRekordboxPaths() {
  const platform = process.platform;
  if (platform === "darwin") {
    return REKORDBOX_PATHS.mac;
  } else if (platform === "win32") {
    return REKORDBOX_PATHS.win;
  }
  return { database: null, xml: null };
}

/**
 * Parse Rekordbox XML export file
 */
function parseRekordboxXML(xmlPath) {
  try {
    if (!fs.existsSync(xmlPath)) {
      return { ok: false, error: "XML_FILE_NOT_FOUND" };
    }

    const xmlContent = fs.readFileSync(xmlPath, "utf-8");
    
    // Simple XML parsing for track information
    // This is a basic implementation - you may want to use a proper XML parser
    const tracks = [];
    const trackMatches = xmlContent.matchAll(/<TRACK[^>]*>([\s\S]*?)<\/TRACK>/g);
    
    for (const match of trackMatches) {
      const trackXml = match[1];
      const track = {};
      
      // Extract common fields
      const fields = {
        Name: "name",
        Artist: "artist",
        Album: "album",
        Genre: "genre",
        BPM: "bpm",
        Key: "key",
        Rating: "rating",
        Location: "location",
        TrackID: "trackId",
      };
      
      for (const [xmlField, jsField] of Object.entries(fields)) {
        const regex = new RegExp(`<${xmlField}[^>]*>([^<]*)</${xmlField}>`, "i");
        const fieldMatch = trackXml.match(regex);
        if (fieldMatch) {
          let value = fieldMatch[1].trim();
          if (xmlField === "BPM" || xmlField === "Rating") {
            value = parseFloat(value) || null;
          }
          track[jsField] = value;
        }
      }
      
      if (track.name || track.artist) {
        tracks.push(track);
      }
    }
    
    return { ok: true, tracks };
  } catch (error) {
    return { ok: false, error: error.message || "PARSE_ERROR" };
  }
}

/**
 * Get currently playing track from Rekordbox (if available via database)
 * This would require SQLite support - placeholder for now
 */
function getCurrentTrack() {
  // TODO: Implement database reading when SQLite dependency is added
  return { ok: false, error: "NOT_IMPLEMENTED" };
}

/**
 * Search tracks by name, artist, or other criteria
 */
function searchTracks(criteria = {}) {
  const paths = getRekordboxPaths();
  const xmlResult = parseRekordboxXML(paths.xml);
  
  if (!xmlResult.ok) {
    return xmlResult;
  }
  
  let tracks = xmlResult.tracks || [];
  
  // Filter by criteria
  if (criteria.name) {
    const nameLower = String(criteria.name).toLowerCase();
    tracks = tracks.filter((t) => 
      t.name && t.name.toLowerCase().includes(nameLower)
    );
  }
  
  if (criteria.artist) {
    const artistLower = String(criteria.artist).toLowerCase();
    tracks = tracks.filter((t) => 
      t.artist && t.artist.toLowerCase().includes(artistLower)
    );
  }
  
  if (criteria.genre) {
    const genreLower = String(criteria.genre).toLowerCase();
    tracks = tracks.filter((t) => 
      t.genre && t.genre.toLowerCase().includes(genreLower)
    );
  }
  
  if (criteria.minBpm !== undefined) {
    tracks = tracks.filter((t) => t.bpm && t.bpm >= criteria.minBpm);
  }
  
  if (criteria.maxBpm !== undefined) {
    tracks = tracks.filter((t) => t.bpm && t.bpm <= criteria.maxBpm);
  }
  
  if (criteria.key) {
    tracks = tracks.filter((t) => t.key && t.key === criteria.key);
  }
  
  return { ok: true, tracks };
}

/**
 * Get all tracks from Rekordbox
 */
function getAllTracks() {
  const paths = getRekordboxPaths();
  return parseRekordboxXML(paths.xml);
}

/**
 * Check if Rekordbox data is available
 */
function isRekordboxAvailable() {
  const paths = getRekordboxPaths();
  return {
    xml: fs.existsSync(paths.xml),
    database: fs.existsSync(paths.database),
    xmlPath: paths.xml,
    databasePath: paths.database,
  };
}

module.exports = {
  parseRekordboxXML,
  getCurrentTrack,
  searchTracks,
  getAllTracks,
  isRekordboxAvailable,
  getRekordboxPaths,
};
