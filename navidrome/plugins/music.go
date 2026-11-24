package plugins

import (
	"context"
	"fmt"

	"github.com/navidrome/navidrome/plugins/capabilities"
)

const CapabilityMusic Capability = "Music"

const (
	FuncMusicSearch   = "nd_music_search"
	FuncMusicDownload = "nd_music_download"
)

func init() {
	registerCapability(CapabilityMusic, FuncMusicSearch, FuncMusicDownload)
}

// MusicSearch searches an external provider through a loaded Music plugin.
func (m *Manager) MusicSearch(ctx context.Context, name string, req capabilities.MusicSearchRequest) (capabilities.MusicSearchResponse, error) {
	p, ok := loadPlugin(m, name, CapabilityMusic, func(p *plugin) *plugin { return p })
	if !ok {
		return capabilities.MusicSearchResponse{}, fmt.Errorf("music plugin %q is not loaded", name)
	}
	return callPluginFunction[capabilities.MusicSearchRequest, capabilities.MusicSearchResponse](ctx, p, FuncMusicSearch, req)
}

// MusicDownload downloads a track through a loaded Music plugin.
func (m *Manager) MusicDownload(ctx context.Context, name string, req capabilities.MusicDownloadRequest) (capabilities.MusicDownloadResponse, error) {
	p, ok := loadPlugin(m, name, CapabilityMusic, func(p *plugin) *plugin { return p })
	if !ok {
		return capabilities.MusicDownloadResponse{}, fmt.Errorf("music plugin %q is not loaded", name)
	}
	return callPluginFunction[capabilities.MusicDownloadRequest, capabilities.MusicDownloadResponse](ctx, p, FuncMusicDownload, req)
}
