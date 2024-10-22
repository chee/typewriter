import {defineConfig} from "vite"
import solid from "vite-plugin-solid"
import devtools from "solid-devtools/vite"
import wasm from "vite-plugin-wasm"

export default defineConfig({
	plugins: [devtools(), solid(), wasm()],
	server: {
		port: 3000,
	},
	build: {
		target: "esnext",
	},
})
