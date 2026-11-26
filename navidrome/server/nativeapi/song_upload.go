package nativeapi

import (
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"strings"
	"unicode"

	"github.com/navidrome/navidrome/log"
	"github.com/navidrome/navidrome/model"
)

const (
	maxSongUploadSize   = int64(500 << 20)
	songUploadDirectory = "Uploads"
)

func (api *Router) uploadSong(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	r.Body = http.MaxBytesReader(w, r.Body, maxSongUploadSize+(1<<20))
	defer func() {
		if r.MultipartForm != nil {
			if err := r.MultipartForm.RemoveAll(); err != nil {
				log.Warn(ctx, "Error removing multipart temp files", err)
			}
		}
	}()
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		status := http.StatusBadRequest
		var maxBytesErr *http.MaxBytesError
		if errors.As(err, &maxBytesErr) {
			status = http.StatusRequestEntityTooLarge
		}
		writeMusicJSON(w, status, map[string]string{"message": "invalid upload form or file too large"})
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		writeMusicJSON(w, http.StatusBadRequest, map[string]string{"message": "missing audio file"})
		return
	}
	defer file.Close()

	fileName, err := songUploadFileName(header.Filename)
	if err != nil || !model.IsAudioFile(fileName) {
		writeMusicJSON(w, http.StatusBadRequest, map[string]string{"message": "unsupported audio file type"})
		return
	}
	if header.Size > maxSongUploadSize {
		writeMusicJSON(w, http.StatusRequestEntityTooLarge, map[string]string{"message": "audio file is larger than 500 MiB"})
		return
	}

	library, err := api.ds.Library().Get(ctx, model.DefaultLibraryID)
	if err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, model.ErrNotFound) {
			status = http.StatusNotFound
		}
		log.Error(ctx, "Error getting upload library", err)
		writeMusicJSON(w, status, map[string]string{"message": "default music library is unavailable"})
		return
	}

	uploadDirectory := filepath.Join(library.Path, songUploadDirectory)
	if err := os.MkdirAll(uploadDirectory, 0o755); err != nil {
		log.Error(ctx, "Error creating song upload directory", err)
		writeMusicJSON(w, http.StatusInternalServerError, map[string]string{"message": "could not create upload directory"})
		return
	}

	temporaryFile, err := os.CreateTemp(uploadDirectory, ".upload-*")
	if err != nil {
		log.Error(ctx, "Error creating temporary song upload", err)
		writeMusicJSON(w, http.StatusInternalServerError, map[string]string{"message": "could not store uploaded file"})
		return
	}
	temporaryPath := temporaryFile.Name()
	defer func() {
		_ = temporaryFile.Close()
		_ = os.Remove(temporaryPath)
	}()

	written, copyErr := io.Copy(temporaryFile, file)
	closeErr := temporaryFile.Close()
	if copyErr != nil || closeErr != nil {
		log.Error(ctx, "Error writing uploaded song", "copyError", copyErr, "closeError", closeErr)
		writeMusicJSON(w, http.StatusInternalServerError, map[string]string{"message": "could not store uploaded file"})
		return
	}
	if written == 0 {
		writeMusicJSON(w, http.StatusBadRequest, map[string]string{"message": "audio file is empty"})
		return
	}

	relativePath := path.Join(songUploadDirectory, fileName)
	fullPath := filepath.Join(uploadDirectory, fileName)
	if err := os.Link(temporaryPath, fullPath); err != nil {
		if errors.Is(err, os.ErrExist) {
			writeMusicJSON(w, http.StatusConflict, map[string]string{"message": "a file with this name already exists"})
			return
		}
		log.Error(ctx, "Error moving uploaded song into library", err)
		writeMusicJSON(w, http.StatusInternalServerError, map[string]string{"message": "could not move uploaded file into library"})
		return
	}

	if api.scanner == nil {
		writeMusicJSON(w, http.StatusInternalServerError, map[string]string{"message": "file uploaded, but library scanner is unavailable"})
		return
	}
	_, scanErr := api.scanner.ScanFolders(ctx, false, []model.ScanTarget{{
		LibraryID:  library.ID,
		FolderPath: songUploadDirectory,
	}})
	if scanErr != nil && !errors.Is(scanErr, model.ErrAlreadyScanning) {
		log.Error(ctx, "Error scanning uploaded song", scanErr)
		writeMusicJSON(w, http.StatusInternalServerError, map[string]string{"message": fmt.Sprintf("file uploaded, but library scan failed: %v", scanErr)})
		return
	}

	status := http.StatusCreated
	if scanErr != nil {
		status = http.StatusAccepted
	}
	writeMusicJSON(w, status, map[string]any{
		"fileName":    fileName,
		"path":        relativePath,
		"size":        written,
		"scanPending": scanErr != nil,
	})
}

func songUploadFileName(value string) (string, error) {
	value = strings.ReplaceAll(value, "\\", "/")
	name := strings.Trim(path.Base(value), ". ")
	if name == "" {
		return "", errors.New("empty file name")
	}
	for _, r := range name {
		if unicode.IsControl(r) {
			return "", errors.New("file name contains control characters")
		}
	}
	return name, nil
}
