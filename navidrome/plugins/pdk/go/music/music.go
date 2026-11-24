//go:build wasip1

package music

import (
	"github.com/navidrome/navidrome/plugins/pdk/go/pdk"
)

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

var provider Provider

func Register(impl Provider) {
	provider = impl
}

//go:wasmexport nd_music_search
func _NdMusicSearch() int32 {
	if provider == nil {
		return -2
	}
	var input MusicSearchRequest
	if err := pdk.InputJSON(&input); err != nil {
		pdk.SetError(err)
		return -1
	}
	output, err := provider.Search(input)
	if err != nil {
		pdk.SetError(err)
		return -1
	}
	if err := pdk.OutputJSON(output); err != nil {
		pdk.SetError(err)
		return -1
	}
	return 0
}

//go:wasmexport nd_music_download
func _NdMusicDownload() int32 {
	if provider == nil {
		return -2
	}
	var input MusicDownloadRequest
	if err := pdk.InputJSON(&input); err != nil {
		pdk.SetError(err)
		return -1
	}
	output, err := provider.Download(input)
	if err != nil {
		pdk.SetError(err)
		return -1
	}
	if err := pdk.OutputJSON(output); err != nil {
		pdk.SetError(err)
		return -1
	}
	return 0
}
