/* @refresh reload */
async function registerServiceWorker() {
	if ("serviceWorker" in navigator) {
		try {
			const registration = await navigator.serviceWorker.register(
				"/service-worker.js",
				{
					scope: "/",
				}
			)
			if (registration.installing) {
				console.info("Service worker installing")
			} else if (registration.waiting) {
				console.info("Service worker installed")
				location.reload()
			} else if (registration.active) {
				console.info("Service worker active")
			}
		} catch (error) {
			console.error(`Registration failed with ${error}`)
		}
		let ref = false
		navigator.serviceWorker.addEventListener("controllerchange", function () {
			if (ref) return
			ref = true
			window.location.reload()
		})
	}
}

location.hostname === "localhost" || registerServiceWorker()

import {render} from "solid-js/web"

import "./main.css"
import App from "./App.tsx"

const root = document.getElementById("root")

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
	throw new Error(
		"Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?"
	)
}

render(() => <App />, root!)
