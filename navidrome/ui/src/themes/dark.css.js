const stylesheet = `
.react-jinke-music-player-main .music-player-panel {
    background: rgba(8, 13, 12, 0.96);
    border-top: 1px solid rgba(45, 212, 191, 0.16);
    backdrop-filter: blur(20px);
}

.react-jinke-music-player-main svg:active, .react-jinke-music-player-main svg:hover {
    color: #14b8a6
}

.react-jinke-music-player-main .music-player-panel .panel-content .rc-slider-handle, .react-jinke-music-player-main .music-player-panel .panel-content .rc-slider-track {
    background-color: #14b8a6
}

.react-jinke-music-player-main ::-webkit-scrollbar-thumb {
    background-color: #14b8a6;
}

.react-jinke-music-player-main .music-player-panel .panel-content .rc-slider-handle:active {
    box-shadow: 0 0 2px #14b8a6
}

.react-jinke-music-player-main .audio-item.playing svg {
    color: #14b8a6
}

.react-jinke-music-player-main .audio-item.playing .player-singer {
    color: #14b8a6 !important
}

.audio-lists-panel {
    background: #0d1412;
}

.audio-lists-panel-content .audio-item.playing, .audio-lists-panel-content .audio-item.playing svg {
    color: #14b8a6
}
.audio-lists-panel-content .audio-item:active .group:not([class=".player-delete"]) svg, .audio-lists-panel-content .audio-item:hover .group:not([class=".player-delete"]) svg {
    color: #14b8a6
}
`

export default stylesheet
