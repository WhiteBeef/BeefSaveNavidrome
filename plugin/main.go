package main

import (
	"fmt"
	"strings"

	"github.com/navidrome/navidrome/plugins/pdk/go/music"
)

type beefSavePlugin struct{}

func init() {
	music.Register(&beefSavePlugin{})
}

func (p *beefSavePlugin) Search(request music.MusicSearchRequest) (music.MusicSearchResponse, error) {
	query := strings.TrimSpace(request.Query)
	if query == "" {
		return music.MusicSearchResponse{}, fmt.Errorf("search query is required")
	}
	tracks, err := searchTracks(query, request.Provider)
	if err != nil {
		return music.MusicSearchResponse{}, err
	}
	if tracks == nil {
		tracks = []music.Track{}
	}
	return music.MusicSearchResponse{Tracks: tracks}, nil
}

func (p *beefSavePlugin) Download(request music.MusicDownloadRequest) (music.MusicDownloadResponse, error) {
	request.Key = strings.TrimSpace(request.Key)
	request.Query = strings.TrimSpace(request.Query)
	if request.Key == "" && request.Query == "" {
		return music.MusicDownloadResponse{}, fmt.Errorf("track key or search query is required")
	}
	file, err := downloadTrack(request)
	if err != nil {
		return music.MusicDownloadResponse{}, err
	}
	return saveTrack(file)
}

func main() {}
