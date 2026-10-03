.DEFAULT_GOAL := start
.PHONY: help init start s S dev check build format preview screenshot

help:
	@echo "start / s / S (или make): установка и запуск в браузере; init: установить зависимости; dev: проверить зависимости и запустить; check: типы, тесты, формат; build: статическая сборка; format: форматирование; preview: проверить сборку; screenshot: снимок для README (Chrome)"

init:
	node scripts/start.mjs --ensure-only

start s S:
	node scripts/start.mjs --build

dev:
	node scripts/start.mjs

check:
	npm run check

build:
	npm run build

format:
	npm run format

preview:
	npm run preview

# Optional: installed Chrome/Chromium; set CHROME_BIN if necessary.
screenshot: build
	node scripts/screenshot.mjs
