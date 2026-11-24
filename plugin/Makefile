.PHONY: build clean

build:
	tinygo build -o plugin.wasm -target wasip1 -buildmode=c-shared .
	rm -f beefsave.ndp
	zip -j beefsave.ndp manifest.json plugin.wasm

clean:
	rm -f plugin.wasm beefsave.ndp
