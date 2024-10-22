import {BrowserWebSocketClientAdapter} from "@automerge/automerge-repo-network-websocket"
import {IndexedDBStorageAdapter} from "@automerge/automerge-repo-storage-indexeddb"
import {Repo} from "@automerge/automerge-repo"

export default async function startAutomerge() {
	let repo = new Repo({
		network: [new BrowserWebSocketClientAdapter("wss://galaxy.observer")],
		storage: new IndexedDBStorageAdapter("typewriter"),
		peerId: (localStorage.getItem("name") as PeerId) ?? undefined,
	})
	await repo.networkSubsystem.whenReady()
	return repo
}
