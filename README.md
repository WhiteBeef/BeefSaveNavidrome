# BeefSaveNavidrome

Поиск и скачивание музыки через [BeefSaveBot](https://github.com/WhiteBeef/BeefSaveBot) прямо в интерфейсе Navidrome.

Проект содержит:

- `plugin/` — WASM-плагин `beefsave.ndp`;
- `navidrome/` — Navidrome с новой capability `Music`, REST API и страницей «Скачать музыку».

Обычный Navidrome этот плагин не загрузит: нужна сборка из каталога `navidrome/` этого проекта.

## 1. Настроить BeefSaveBot

В `.env` BeefSaveBot задайте:

```dotenv
API_KEY=длинный-случайный-ключ
API_BIND=192.168.1.10
API_PORT=8090
API_INLINE_MAX_BYTES=52428800
```

`API_BIND` должен быть адресом сервера, доступным Navidrome. Не выставляйте API в интернет без HTTPS и правил firewall.

Перезапустите BeefSaveBot:

```bash
make deploy
```

Плагин принимает MP3 размером до 50 МБ. Это согласовано с увеличенным до 100 МБ лимитом HTTP-ответа в изменённом Navidrome; base64 увеличивает размер ответа примерно на треть.

## 2. Собрать

Требования для плагина: Go 1.27, TinyGo 0.44, Binaryen и `zip`.

```bash
cd plugin
make build
cd ..
```

Готовый пакет появится в `plugin/beefsave.ndp`.

Navidrome для Linux с установленными Go, Node.js, GCC и Make:

```bash
cd navidrome
make build
cd ..
```

Docker-сборка Navidrome:

```bash
docker build -t beefsave-navidrome ./navidrome
```

## 3. Установить

1. Скопируйте `plugin/beefsave.ndp` в `${DataFolder}/plugins/beefsave.ndp` на сервере Navidrome.
2. Запустите изменённый Navidrome с `ND_PLUGINS_ENABLED=true`.
3. Откройте **Настройки → Плагины** и нажмите **Rescan**.
4. В настройках `beefsave` заполните:
   - `baseUrl`: например, `http://192.168.1.10:8090`;
   - `apiKey`: значение `API_KEY` из BeefSaveBot;
   - `libraryId`: ID библиотеки, обычно `1`;
   - `directory`: каталог внутри библиотеки, по умолчанию `BeefSave`;
   - `quality`: `LOW`, `MEDIUM` или `HIGH`.
5. Выдайте плагину доступ к нужной библиотеке и разрешите **write access**.
6. Включите плагин.

Для Docker файл можно подключить к контейнеру так:

```yaml
services:
  navidrome:
    image: beefsave-navidrome
    environment:
      ND_PLUGINS_ENABLED: "true"
    volumes:
      - ./data:/data
      - ./music:/music
      - ./plugin/beefsave.ndp:/data/plugins/beefsave.ndp:ro
    ports:
      - "4533:4533"
```

Если BeefSaveBot работает в другом контейнере, `baseUrl` должен указывать на имя его сервиса и порт, например `http://beefsavebot:8090`. Оба контейнера должны быть в одной Docker-сети.

## Использование

1. Откройте **Скачать музыку** в боковом меню.
2. Введите название или исполнителя и выберите сервис.
3. Нажмите **Скачать** у нужного результата.
4. После сообщения об успехе запустите сканирование библиотеки. Автоматическое сканирование тоже подхватит файл по расписанию.

## Проверка

```bash
cd plugin
go test ./...
go vet ./...

cd ../navidrome
go test -tags netgo,sqlite_fts5 ./plugins ./server/nativeapi
go vet -tags netgo,sqlite_fts5 ./plugins ./server/nativeapi

cd ui
npm ci
npm run type-check
npm run lint
npm run build
npm test
```

`navidrome plugin validate plugin/beefsave.ndp` проверяет manifest, WASM и необходимые capabilities.
