//go:build !wasip1

package music

type MusicSearchRequest struct {
	Query    string `json:"query"`
	Provider string `json:"provider,omitempty"`
}

type MusicDownloadRequest struct {
	Key      string `json:"key,omitempty"`
	Query    string `json:"query,omitempty"`
	Provider string `json:"provider,omitempty"`
	Quality  string `json:"quality,omitempty"`
}

type Track struct {
	Key      string `json:"key"`
	Provider string `json:"provider"`
	Artist   string `json:"artist"`
	Title    string `json:"title"`
}

type MusicSearchResponse struct {
	Tracks []Track `json:"tracks"`
}

type MusicDownloadResponse struct {
	Path     string `json:"path"`
	FileName string `json:"fileName"`
	Size     int64  `json:"size"`
}

type Provider interface {
	Search(MusicSearchRequest) (MusicSearchResponse, error)
	Download(MusicDownloadRequest) (MusicDownloadResponse, error)
}

func Register(_ Provider) {}
