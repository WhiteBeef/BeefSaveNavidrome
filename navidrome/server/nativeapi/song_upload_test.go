package nativeapi

import (
	"bytes"
	"context"
	"encoding/json"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"

	"github.com/navidrome/navidrome/db"
	"github.com/navidrome/navidrome/model"
	"github.com/navidrome/navidrome/persistence"
	"github.com/navidrome/navidrome/persistence/persistencetest"
	"github.com/navidrome/navidrome/tests"
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

var _ = Describe("Song upload", func() {
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
		router = &Router{ds: ds, scanner: scanner}
	})

	upload := func(fileName, contents string) *httptest.ResponseRecorder {
		GinkgoHelper()
		body := new(bytes.Buffer)
		writer := multipart.NewWriter(body)
		part, err := writer.CreateFormFile("file", fileName)
		Expect(err).ToNot(HaveOccurred())
		_, err = part.Write([]byte(contents))
		Expect(err).ToNot(HaveOccurred())
		Expect(writer.Close()).To(Succeed())

		request := httptest.NewRequest(http.MethodPost, "/song/upload", body)
		request.Header.Set("Content-Type", writer.FormDataContentType())
		request = request.WithContext(ctx)
		response := httptest.NewRecorder()
		router.uploadSong(response, request)
		return response
	}

	It("stores an audio file and scans its upload folder", func() {
		response := upload("../track.mp3", "ID3 audio data")

		Expect(response.Code).To(Equal(http.StatusCreated))
		var result struct {
			FileName string `json:"fileName"`
			Path     string `json:"path"`
			Size     int64  `json:"size"`
		}
		Expect(json.Unmarshal(response.Body.Bytes(), &result)).To(Succeed())
		Expect(result.FileName).To(Equal("track.mp3"))
		Expect(result.Path).To(Equal("Uploads/track.mp3"))
		Expect(result.Size).To(Equal(int64(len("ID3 audio data"))))
		contents, err := os.ReadFile(filepath.Join(libraryPath, "Uploads", "track.mp3"))
		Expect(err).ToNot(HaveOccurred())
		Expect(string(contents)).To(Equal("ID3 audio data"))

		calls := scanner.GetScanFoldersCalls()
		Expect(calls).To(HaveLen(1))
		Expect(calls[0].FullScan).To(BeFalse())
		Expect(calls[0].Targets).To(Equal([]model.ScanTarget{{
			LibraryID:  model.DefaultLibraryID,
			FolderPath: "Uploads",
		}}))
	})

	It("rejects unsupported and empty files", func() {
		unsupported := upload("notes.txt", "not audio")
		empty := upload("empty.mp3", "")

		Expect(unsupported.Code).To(Equal(http.StatusBadRequest))
		Expect(empty.Code).To(Equal(http.StatusBadRequest))
		Expect(scanner.GetScanFoldersCallCount()).To(Equal(0))
		entries, err := os.ReadDir(filepath.Join(libraryPath, "Uploads"))
		Expect(err).ToNot(HaveOccurred())
		Expect(entries).To(BeEmpty())
	})

	It("does not overwrite an existing file", func() {
		first := upload("track.mp3", "original")
		second := upload("track.mp3", "replacement")

		Expect(first.Code).To(Equal(http.StatusCreated))
		Expect(second.Code).To(Equal(http.StatusConflict))
		contents, err := os.ReadFile(filepath.Join(libraryPath, "Uploads", "track.mp3"))
		Expect(err).ToNot(HaveOccurred())
		Expect(string(contents)).To(Equal("original"))
		Expect(scanner.GetScanFoldersCallCount()).To(Equal(1))
	})
})
