package main

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/url"
	"strings"

	"github.com/navidrome/navidrome/plugins/pdk/go/host"
	"github.com/navidrome/navidrome/plugins/pdk/go/music"
	"github.com/navidrome/navidrome/plugins/pdk/go/pdk"
)

const (
	searchTimeoutMs   = 30000
	downloadTimeoutMs = 600000
	maxTrackBytes     = 50 * 1024 * 1024
)

type apiConfig struct {
	baseURL string
	apiKey  string
}

type inlineTrack struct {
	FileName string `json:"fileName"`
	Mime     string `json:"mime"`
	Size     int64  `json:"size"`
	Base64   string `json:"base64"`
	Data     []byte `json:"-"`
}

func getAPIConfig() (apiConfig, error) {
	baseURL, _ := pdk.GetConfig("baseUrl")
	apiKey, _ := pdk.GetConfig("apiKey")
	baseURL = strings.TrimRight(strings.TrimSpace(baseURL), "/")
	apiKey = strings.TrimSpace(apiKey)
	if baseURL == "" || apiKey == "" {
		return apiConfig{}, fmt.Errorf("baseUrl and apiKey must be configured")
	}
	parsed, err := url.Parse(baseURL)
	if err != nil || parsed.Host == "" || (parsed.Scheme != "http" && parsed.Scheme != "https") {
		return apiConfig{}, fmt.Errorf("baseUrl must be an absolute HTTP or HTTPS URL")
	}
	return apiConfig{baseURL: baseURL, apiKey: apiKey}, nil
}

func searchTracks(query, provider string) ([]music.Track, error) {
	config, err := getAPIConfig()
	if err != nil {
		return nil, err
	}
	values := url.Values{"q": {query}}
	if provider = strings.TrimSpace(provider); provider != "" {
		values.Set("provider", provider)
	}
	response, err := apiRequest(config, "GET", "/api/v1/music/search?"+values.Encode(), nil, searchTimeoutMs)
	if err != nil {
		return nil, err
	}
	var tracks []music.Track
	if err := json.Unmarshal(response, &tracks); err != nil {
		return nil, fmt.Errorf("decoding BeefSaveBot search response: %w", err)
	}
	return tracks, nil
}

func downloadTrack(request music.MusicDownloadRequest) (inlineTrack, error) {
	config, err := getAPIConfig()
	if err != nil {
		return inlineTrack{}, err
	}
	quality := strings.TrimSpace(request.Quality)
	if quality == "" {
		quality, _ = pdk.GetConfig("quality")
	}
	if quality == "" {
		quality = "MEDIUM"
	}
	body, err := json.Marshal(map[string]string{
		"key":      request.Key,
		"query":    request.Query,
		"provider": request.Provider,
		"quality":  quality,
		"deliver":  "inline",
	})
	if err != nil {
		return inlineTrack{}, err
	}
	response, err := apiRequest(config, "POST", "/api/v1/music", body, downloadTimeoutMs)
	if err != nil {
		return inlineTrack{}, err
	}
	var track inlineTrack
	if err := json.Unmarshal(response, &track); err != nil {
		return inlineTrack{}, fmt.Errorf("decoding BeefSaveBot download response: %w", err)
	}
	track.Data, err = base64.StdEncoding.DecodeString(track.Base64)
	if err != nil {
		return inlineTrack{}, fmt.Errorf("decoding MP3 data: %w", err)
	}
	if len(track.Data) == 0 {
		return inlineTrack{}, fmt.Errorf("BeefSaveBot returned an empty file")
	}
	if len(track.Data) > maxTrackBytes {
		return inlineTrack{}, fmt.Errorf("MP3 file is larger than %d bytes", maxTrackBytes)
	}
	if track.Size != 0 && track.Size != int64(len(track.Data)) {
		return inlineTrack{}, fmt.Errorf("MP3 size mismatch: declared %d bytes, received %d", track.Size, len(track.Data))
	}
	track.Size = int64(len(track.Data))
	return track, nil
}

func apiRequest(config apiConfig, method, path string, body []byte, timeoutMs int32) ([]byte, error) {
	headers := map[string]string{
		"X-Api-Key": config.apiKey,
		"Accept":    "application/json",
	}
	if len(body) > 0 {
		headers["Content-Type"] = "application/json"
	}
	response, err := host.HTTPSend(host.HTTPRequest{
		Method:    method,
		URL:       config.baseURL + path,
		Headers:   headers,
		Body:      body,
		TimeoutMs: timeoutMs,
	})
	if err != nil {
		return nil, fmt.Errorf("BeefSaveBot request failed: %w", err)
	}
	if response == nil {
		return nil, fmt.Errorf("BeefSaveBot returned no response")
	}
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		var apiError struct {
			Error string `json:"error"`
		}
		_ = json.Unmarshal(response.Body, &apiError)
		if apiError.Error == "" {
			apiError.Error = strings.TrimSpace(string(response.Body))
		}
		return nil, fmt.Errorf("BeefSaveBot returned HTTP %d: %s", response.StatusCode, apiError.Error)
	}
	return response.Body, nil
}
