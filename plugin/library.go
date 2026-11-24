package main

import (
	"fmt"
	"os"
	"path"
	"path/filepath"
	"strconv"
	"strings"
	"unicode"

	"github.com/navidrome/navidrome/plugins/pdk/go/host"
	"github.com/navidrome/navidrome/plugins/pdk/go/music"
	"github.com/navidrome/navidrome/plugins/pdk/go/pdk"
)

func saveTrack(track inlineTrack) (music.MusicDownloadResponse, error) {
	libraryID := int32(1)
	if value, ok := pdk.GetConfig("libraryId"); ok && value != "" {
		parsed, err := strconv.ParseInt(value, 10, 32)
		if err != nil || parsed < 1 {
			return music.MusicDownloadResponse{}, fmt.Errorf("libraryId must be a positive integer")
		}
		libraryID = int32(parsed)
	}
	library, err := host.LibraryGetLibrary(libraryID)
	if err != nil {
		return music.MusicDownloadResponse{}, fmt.Errorf("getting library %d: %w", libraryID, err)
	}
	if library == nil || library.MountPoint == "" {
		return music.MusicDownloadResponse{}, fmt.Errorf("library %d has no filesystem mount", libraryID)
	}
	directory := "BeefSave"
	if value, ok := pdk.GetConfig("directory"); ok && strings.TrimSpace(value) != "" {
		directory = strings.TrimSpace(value)
	}
	directory, err = safeDirectory(directory)
	if err != nil {
		return music.MusicDownloadResponse{}, err
	}
	fileName := safeFileName(track.FileName)
	relativePath := path.Join(directory, fileName)
	fullDirectory := filepath.Join(library.MountPoint, filepath.FromSlash(directory))
	fullPath := filepath.Join(fullDirectory, fileName)
	if info, err := os.Stat(fullPath); err == nil {
		if info.IsDir() {
			return music.MusicDownloadResponse{}, fmt.Errorf("target %s is a directory", relativePath)
		}
		return music.MusicDownloadResponse{Path: relativePath, FileName: fileName, Size: info.Size()}, nil
	} else if !os.IsNotExist(err) {
		return music.MusicDownloadResponse{}, fmt.Errorf("checking target file: %w", err)
	}
	if err := os.MkdirAll(fullDirectory, 0755); err != nil {
		return music.MusicDownloadResponse{}, fmt.Errorf("creating target directory: %w", err)
	}
	temporaryPath := filepath.Join(fullDirectory, "."+fileName+".download")
	defer os.Remove(temporaryPath)
	if err := os.WriteFile(temporaryPath, track.Data, 0644); err != nil {
		return music.MusicDownloadResponse{}, fmt.Errorf("writing MP3 file: %w", err)
	}
	if err := os.Rename(temporaryPath, fullPath); err != nil {
		return music.MusicDownloadResponse{}, fmt.Errorf("moving MP3 file into library: %w", err)
	}
	return music.MusicDownloadResponse{Path: relativePath, FileName: fileName, Size: track.Size}, nil
}

func safeDirectory(value string) (string, error) {
	value = strings.ReplaceAll(value, "\\", "/")
	cleaned := path.Clean(value)
	if cleaned == "." || cleaned == "/" || path.IsAbs(cleaned) || cleaned == ".." || strings.HasPrefix(cleaned, "../") {
		return "", fmt.Errorf("directory must be a safe relative path")
	}
	return cleaned, nil
}

func safeFileName(value string) string {
	value = strings.TrimSpace(value)
	var result strings.Builder
	for _, r := range value {
		if unicode.IsControl(r) || strings.ContainsRune(`<>:"/\\|?*`, r) {
			result.WriteRune('_')
		} else {
			result.WriteRune(r)
		}
	}
	name := strings.Trim(result.String(), ". ")
	if name == "" {
		name = "track.mp3"
	}
	if !strings.HasSuffix(strings.ToLower(name), ".mp3") {
		name += ".mp3"
	}
	return name
}
