package nativeapi

import (
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path"
	"path/filepath"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/navidrome/navidrome/core/artwork"
	"github.com/navidrome/navidrome/log"
	"github.com/navidrome/navidrome/model"
)

const maxSongMetadataFieldLength = 1000

type songMetadata struct {
	Title  string
	Artist string
	Album  string
}

func (api *Router) updateSongMetadata(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	r.Body = http.MaxBytesReader(w, r.Body, artwork.MaxImageUploadSize()+(1<<20))
	defer func() {
		if r.MultipartForm != nil {
			if err := r.MultipartForm.RemoveAll(); err != nil {
				log.Warn(ctx, "Error removing song metadata temp files", err)
			}
		}
	}()
	if err := r.ParseMultipartForm(1 << 20); err != nil {
		status := http.StatusBadRequest
		var maxBytesErr *http.MaxBytesError
		if errors.As(err, &maxBytesErr) {
			status = http.StatusRequestEntityTooLarge
		}
		writeMusicJSON(w, status, map[string]string{"message": "invalid metadata form or cover image too large"})
		return
	}

	metadata := songMetadata{
		Title:  strings.TrimSpace(r.FormValue("title")),
		Artist: strings.TrimSpace(r.FormValue("artist")),
		Album:  strings.TrimSpace(r.FormValue("album")),
	}
	if metadata.Title == "" || metadata.Artist == "" {
		writeMusicJSON(w, http.StatusBadRequest, map[string]string{"message": "title and artist are required"})
		return
	}
	if len(metadata.Title) > maxSongMetadataFieldLength || len(metadata.Artist) > maxSongMetadataFieldLength || len(metadata.Album) > maxSongMetadataFieldLength {
		writeMusicJSON(w, http.StatusBadRequest, map[string]string{"message": "metadata fields are too long"})
		return
	}
	if api.ffmpeg == nil || api.scanner == nil {
		writeMusicJSON(w, http.StatusServiceUnavailable, map[string]string{"message": "song editing is unavailable"})
		return
	}

	id := chi.URLParam(r, "id")
	song, err := api.ds.MediaFile().Get(ctx, id)
	if err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, model.ErrNotFound) {
			status = http.StatusNotFound
		}
		log.Error(ctx, "Error getting song for metadata update", "id", id, err)
		writeMusicJSON(w, status, map[string]string{"message": "song is unavailable"})
		return
	}
	if song.Missing {
		writeMusicJSON(w, http.StatusConflict, map[string]string{"message": "missing songs cannot be edited"})
		return
	}

	var coverPath string
	cover, header, err := r.FormFile("cover")
	if err == nil {
		if !supportsEmbeddedCover(song.Suffix) {
			_ = cover.Close()
			writeMusicJSON(w, http.StatusUnprocessableEntity, map[string]string{"message": "cover embedding supports MP3, FLAC and M4A files"})
			return
		}
		coverPath, err = saveSongCover(cover, header.Filename)
		_ = cover.Close()
		if err != nil {
			log.Error(ctx, "Error storing song cover", err)
			writeMusicJSON(w, http.StatusBadRequest, map[string]string{"message": "could not read cover image"})
			return
		}
		defer os.Remove(coverPath)
	} else if !errors.Is(err, http.ErrMissingFile) {
		writeMusicJSON(w, http.StatusBadRequest, map[string]string{"message": "could not read cover image"})
		return
	}

	if err := api.rewriteSongMetadata(ctx, song.AbsolutePath(), metadata, coverPath); err != nil {
		log.Error(ctx, "Error updating song metadata", "id", id, err)
		writeMusicJSON(w, http.StatusUnprocessableEntity, map[string]string{"message": "could not update audio file metadata"})
		return
	}

	folderPath := path.Dir(filepath.ToSlash(song.Path))
	_, scanErr := api.scanner.ScanFolders(ctx, false, []model.ScanTarget{{
		LibraryID:  song.LibraryID,
		FolderPath: folderPath,
	}})
	scanPending := errors.Is(scanErr, model.ErrAlreadyScanning)
	if scanErr != nil && !scanPending {
		log.Error(ctx, "Error scanning edited song", "id", id, scanErr)
		writeMusicJSON(w, http.StatusInternalServerError, map[string]string{"message": "metadata saved, but library scan failed"})
		return
	}

	updatedSong, err := api.ds.MediaFile().Get(ctx, id)
	if err != nil {
		updatedSong = song
		updatedSong.Title = metadata.Title
		updatedSong.Artist = metadata.Artist
		updatedSong.Album = metadata.Album
	}
	status := http.StatusOK
	if scanPending {
		status = http.StatusAccepted
	}
	writeMusicJSON(w, status, updatedSong)
}

func saveSongCover(source io.Reader, fileName string) (string, error) {
	ext := strings.ToLower(filepath.Ext(fileName))
	if !model.IsImageFile(fileName) {
		return "", fmt.Errorf("unsupported cover image type")
	}
	temporaryFile, err := os.CreateTemp("", "navidrome-song-cover-*"+ext)
	if err != nil {
		return "", err
	}
	temporaryPath := temporaryFile.Name()
	defer func() {
		_ = temporaryFile.Close()
	}()
	if _, err := io.Copy(temporaryFile, source); err != nil {
		_ = os.Remove(temporaryPath)
		return "", err
	}
	if err := temporaryFile.Close(); err != nil {
		_ = os.Remove(temporaryPath)
		return "", err
	}
	return temporaryPath, nil
}

func (api *Router) rewriteSongMetadata(ctx context.Context, filePath string, metadata songMetadata, coverPath string) error {
	commandPath, err := api.ffmpeg.CmdPath()
	if err != nil {
		return err
	}
	info, err := os.Stat(filePath)
	if err != nil {
		return err
	}
	temporaryFile, err := os.CreateTemp(filepath.Dir(filePath), ".metadata-*"+filepath.Ext(filePath))
	if err != nil {
		return err
	}
	temporaryPath := temporaryFile.Name()
	if err := temporaryFile.Close(); err != nil {
		_ = os.Remove(temporaryPath)
		return err
	}
	defer os.Remove(temporaryPath)

	args := songMetadataCommand(filePath, temporaryPath, metadata, coverPath)
	command := exec.CommandContext(ctx, commandPath, args...)
	output, err := command.CombinedOutput()
	if err != nil {
		return fmt.Errorf("ffmpeg metadata update: %w: %s", err, strings.TrimSpace(string(output)))
	}
	if err := os.Chmod(temporaryPath, info.Mode().Perm()); err != nil {
		return err
	}
	return os.Rename(temporaryPath, filePath)
}

func songMetadataCommand(inputPath, outputPath string, metadata songMetadata, coverPath string) []string {
	args := []string{"-v", "error", "-y", "-i", inputPath}
	if coverPath != "" {
		args = append(args, "-i", coverPath)
	}
	args = append(args, "-map", "0")
	if coverPath != "" {
		args = append(args, "-map", "-0:v?", "-map", "1:v")
	}
	args = append(args,
		"-map_metadata", "0",
		"-map_chapters", "0",
		"-c", "copy",
		"-metadata", "title="+metadata.Title,
		"-metadata", "artist="+metadata.Artist,
		"-metadata", "album="+metadata.Album,
	)
	if coverPath != "" {
		switch strings.ToLower(strings.TrimPrefix(filepath.Ext(inputPath), ".")) {
		case "m4a", "m4b", "mp4":
			args = append(args, "-c:v:0", "png", "-disposition:v:0", "attached_pic")
		case "mp3":
			args = append(args, "-id3v2_version", "3")
		}
		args = append(args,
			"-metadata:s:v", "title=Album cover",
			"-metadata:s:v", "comment=Cover (front)",
		)
	}
	return append(args, outputPath)
}

func supportsEmbeddedCover(suffix string) bool {
	switch strings.ToLower(suffix) {
	case "mp3", "flac", "m4a", "m4b", "mp4":
		return true
	default:
		return false
	}
}
