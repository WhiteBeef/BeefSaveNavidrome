package nativeapi

import (
	"bytes"
	"context"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"

	"github.com/go-chi/chi/v5"
	"github.com/navidrome/navidrome/core/ffmpeg"
	"github.com/navidrome/navidrome/db"
	"github.com/navidrome/navidrome/model"
	"github.com/navidrome/navidrome/persistence"
	"github.com/navidrome/navidrome/persistence/persistencetest"
	"github.com/navidrome/navidrome/tests"
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

type songEditTestFFmpeg struct {
	ffmpeg.FFmpeg
	commandPath string
}

func (f songEditTestFFmpeg) CmdPath() (string, error) {
	return f.commandPath, nil
}

var _ = Describe("Song metadata editing", func() {
	var (
		ctx         context.Context
		libraryPath string
		scanner     *tests.MockScanner
		router      *Router
	)

	BeforeEach(func() {
		ctx = GinkgoT().Context()
		ds := persistence.New(db.Db())
		libraryPath = GinkgoT().TempDir()
		persistencetest.SetLibraries(ctx, ds, libraryPath)
		scanner = tests.NewMockScanner()
		commandPath := filepath.Join(GinkgoT().TempDir(), "ffmpeg")
		script := "#!/bin/sh\nfor output do :; done\nprintf updated > \"$output\"\n"
		Expect(os.WriteFile(commandPath, []byte(script), 0o755)).To(Succeed())
		router = &Router{
			ds:      ds,
			scanner: scanner,
			ffmpeg:  songEditTestFFmpeg{commandPath: commandPath},
		}
	})

	update := func(fields map[string]string, coverName string) *httptest.ResponseRecorder {
		GinkgoHelper()
		body := new(bytes.Buffer)
		writer := multipart.NewWriter(body)
		for name, value := range fields {
			Expect(writer.WriteField(name, value)).To(Succeed())
		}
		if coverName != "" {
			part, err := writer.CreateFormFile("cover", coverName)
			Expect(err).ToNot(HaveOccurred())
			_, err = part.Write([]byte("image"))
			Expect(err).ToNot(HaveOccurred())
		}
		Expect(writer.Close()).To(Succeed())
		request := httptest.NewRequest(http.MethodPut, "/song/song-1/metadata", body)
		request.Header.Set("Content-Type", writer.FormDataContentType())
		routeContext := chi.NewRouteContext()
		routeContext.URLParams.Add("id", "song-1")
		request = request.WithContext(context.WithValue(ctx, chi.RouteCtxKey, routeContext))
		response := httptest.NewRecorder()
		router.updateSongMetadata(response, request)
		return response
	}

	It("rewrites the audio file and scans its folder", func() {
		songPath := filepath.Join(libraryPath, "Uploads", "track.mp3")
		Expect(os.MkdirAll(filepath.Dir(songPath), 0o755)).To(Succeed())
		Expect(os.WriteFile(songPath, []byte("original"), 0o640)).To(Succeed())
		Expect(router.ds.MediaFile().Put(ctx, &model.MediaFile{
			ID:        "song-1",
			LibraryID: model.DefaultLibraryID,
			Path:      "Uploads/track.mp3",
			Title:     "Old title",
			Artist:    "Old artist",
			Album:     "Old album",
			Suffix:    "mp3",
		})).To(Succeed())

		response := update(map[string]string{
			"title":  "New title",
			"artist": "New artist",
			"album":  "New album",
		}, "cover.jpg")

		Expect(response.Code).To(Equal(http.StatusOK))
		contents, err := os.ReadFile(songPath)
		Expect(err).ToNot(HaveOccurred())
		Expect(string(contents)).To(Equal("updated"))
		info, err := os.Stat(songPath)
		Expect(err).ToNot(HaveOccurred())
		Expect(info.Mode().Perm()).To(Equal(os.FileMode(0o640)))
		calls := scanner.GetScanFoldersCalls()
		Expect(calls).To(HaveLen(1))
		Expect(calls[0].Targets).To(Equal([]model.ScanTarget{{
			LibraryID:  model.DefaultLibraryID,
			FolderPath: "Uploads",
		}}))
	})

	It("requires title and artist", func() {
		response := update(map[string]string{"album": "New album"}, "")

		Expect(response.Code).To(Equal(http.StatusBadRequest))
		Expect(scanner.GetScanFoldersCallCount()).To(Equal(0))
	})

	It("builds a stream-copy command that replaces embedded artwork", func() {
		args := songMetadataCommand("input.mp3", "output.mp3", songMetadata{
			Title:  "Title",
			Artist: "Artist",
			Album:  "Album",
		}, "cover.jpg")

		Expect(args).To(ContainElements("-0:v?", "1:v", "title=Title", "artist=Artist", "album=Album"))
		Expect(args[len(args)-1]).To(Equal("output.mp3"))
	})

	It("encodes M4A covers as attached PNG pictures", func() {
		args := songMetadataCommand("input.m4a", "output.m4a", songMetadata{}, "cover.jpg")

		Expect(args).To(ContainElements("png", "attached_pic"))
		Expect(args).ToNot(ContainElement("-id3v2_version"))
	})
})
