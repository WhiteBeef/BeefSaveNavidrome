package nativeapi

import (
	"encoding/json"
	"net/http"
	"sort"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/navidrome/navidrome/plugins"
	"github.com/navidrome/navidrome/plugins/capabilities"
	"github.com/navidrome/navidrome/server"
)

const maxMusicDownloadBody = 64 * 1024

func (api *Router) addMusicRoute(r chi.Router) {
	r.Route("/music", func(r chi.Router) {
		r.Use(pluginsEnabledMiddleware)
		r.Get("/providers", api.musicProviders)
		r.Get("/search", api.musicSearch)
		r.Post("/download", api.musicDownload)
	})
}

func (api *Router) musicProviders(w http.ResponseWriter, _ *http.Request) {
	names := api.pluginManager.PluginNames(string(plugins.CapabilityMusic))
	sort.Strings(names)
	writeMusicJSON(w, http.StatusOK, map[string]any{"providers": names})
}

func (api *Router) musicSearch(w http.ResponseWriter, r *http.Request) {
	pluginID := strings.TrimSpace(r.URL.Query().Get("plugin"))
	query := strings.TrimSpace(r.URL.Query().Get("q"))
	if pluginID == "" || query == "" {
		writeMusicJSON(w, http.StatusBadRequest, map[string]string{"message": "plugin and q are required"})
		return
	}
	response, err := api.pluginManager.MusicSearch(r.Context(), pluginID, capabilities.MusicSearchRequest{
		Query:    query,
		Provider: strings.TrimSpace(r.URL.Query().Get("provider")),
	})
	if err != nil {
		writeMusicJSON(w, http.StatusBadGateway, map[string]string{"message": err.Error()})
		return
	}
	writeMusicJSON(w, http.StatusOK, response)
}

func (api *Router) musicDownload(w http.ResponseWriter, r *http.Request) {
	var request struct {
		Plugin   string `json:"plugin"`
		Key      string `json:"key"`
		Query    string `json:"query"`
		Provider string `json:"provider"`
		Quality  string `json:"quality"`
	}
	if !server.DecodeJSONBody(w, r, maxMusicDownloadBody, &request) {
		return
	}
	request.Plugin = strings.TrimSpace(request.Plugin)
	request.Key = strings.TrimSpace(request.Key)
	request.Query = strings.TrimSpace(request.Query)
	if request.Plugin == "" || (request.Key == "" && request.Query == "") {
		writeMusicJSON(w, http.StatusBadRequest, map[string]string{"message": "plugin and key or query are required"})
		return
	}
	response, err := api.pluginManager.MusicDownload(r.Context(), request.Plugin, capabilities.MusicDownloadRequest{
		Key:      request.Key,
		Query:    request.Query,
		Provider: request.Provider,
		Quality:  request.Quality,
	})
	if err != nil {
		writeMusicJSON(w, http.StatusBadGateway, map[string]string{"message": err.Error()})
		return
	}
	writeMusicJSON(w, http.StatusOK, response)
}

func writeMusicJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}
