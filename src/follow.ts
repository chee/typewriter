import {
	type DocHandle,
	type DocumentId,
	type Repo,
} from "@automerge/automerge-repo"

export interface PostIt {
	color: string
	text: string
	x: number
	y: number
}
export type TextDocument = {text: string; postits: PostIt[]}

export function getHashParts(): [DocumentId | undefined] {
	let [, documentId] =
		location.hash.match(/#(?:automerge:)?([A-Za-z0-9]+)/) ?? []
	return [documentId as DocumentId]
}

async function getDocHandleFromHash(
	repo: Repo
): Promise<DocHandle<TextDocument>> {
	let [documentId] = getHashParts()
	if (!documentId) {
		documentId = repo.create({text: "\n".repeat(24), postits: []}).url
		let url = new URL(location + "")
		url.hash = documentId
		history.replaceState(null, "", url)
	}

	let docHandle = repo.find<TextDocument>(documentId)
	await docHandle.whenReady()

	return docHandle
}

export default class HashFollower {
	#doc: DocHandle<TextDocument> | undefined
	get docHandle() {
		return this.#doc!
	}
	readonly ready: Promise<void>
	#subs = new Set<() => void>()
	constructor(repo: Repo) {
		this.ready = new Promise(yay => {
			getDocHandleFromHash(repo).then(doc => {
				this.#doc = doc
				yay()
			})
		})
		window.addEventListener("hashchange", async () => {
			this.#doc?.removeAllListeners("change")
			this.#doc = await getDocHandleFromHash(repo)
			for (let sub of this.#subs) {
				sub()
			}
		})
	}
	sub(fn: () => void) {
		this.#subs.add(fn)
		fn()
		return () => this.#subs.delete(fn)
	}
}
