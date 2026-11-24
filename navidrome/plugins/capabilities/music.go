package capabilities

// MusicSearchRequest describes an external music search.
type MusicSearchRequest struct {
	Query    string `json:"query"`
	Provider string `json:"provider,omitempty"`
}

// MusicDownloadRequest describes a track to download into a Navidrome library.
type MusicDownloadRequest struct {
	Key      string `json:"key,omitempty"`
	Query    string `json:"query,omitempty"`
	Provider string `json:"provider,omitempty"`
	Quality  string `json:"quality,omitempty"`
}

// MusicTrack is a track returned by an external music provider.
type MusicTrack struct {
	Key      string `json:"key"`
	Provider string `json:"provider"`
	Artist   string `json:"artist"`
	Title    string `json:"title"`
}

// MusicSearchResponse contains external music search results.
type MusicSearchResponse struct {
	Tracks []MusicTrack `json:"tracks"`
}

// MusicDownloadResponse describes a file saved in a Navidrome library.
type MusicDownloadResponse struct {
	Path     string `json:"path"`
	FileName string `json:"fileName"`
	Size     int64  `json:"size"`
}
