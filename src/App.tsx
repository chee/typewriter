import {createSignal, For, onMount, type Component} from "solid-js"
import {automergeSyncPlugin} from "@automerge/automerge-codemirror"
import {
	insertNewlineAndIndent,
	insertNewline,
	standardKeymap,
} from "@codemirror/commands"
import {EditorView, keymap} from "@codemirror/view"
import {EditorState} from "@codemirror/state"
import HashFollower from "./follow.ts"
import startAutomerge from "./start.ts"
import {createDocumentStore} from "automerge-repo-solid-primitives"

const repo = await startAutomerge()
export let hash = new HashFollower(repo)
await hash.ready

const colors = ["#ffe", "#fef", "#eff", "#efe", "#fee", "#fed", "#def", "#dfe"]

const App: Component = () => {
	window.addEventListener("paste", event => {
		for (const item of event.clipboardData?.items || []) {
			if (item.kind == "string" && item.type == "text/plain") {
				item.getAsString(string => {
					hash.docHandle.change(doc => {
						doc.postits.push({
							color: colors[(Math.random() * colors.length) | 0],
							text: string.trim(),
							x: 200,
							y: 200,
						})
					})
				})
				return
			}
		}
	})
	const editor = (<div />) as HTMLDivElement
	const doc = createDocumentStore(() => hash.docHandle)
	const view = new EditorView({
		parent: editor,
		doc: hash.docHandle!.docSync()!.text,
		dispatchTransactions(trs, view) {
			const okay = trs
				.filter(tr => {
					if (tr.isUserEvent("undo")) return
					if (tr.isUserEvent("redo")) return
					if (tr.isUserEvent("delete")) return
					if (tr.isUserEvent("move")) return
					// todo maybe allow pasting to create a post-it
					if (tr.isUserEvent("input.paste")) return
					if (tr.isUserEvent("input.drop")) return

					return true
				})
				.flatMap(tr => {
					const sel = tr.startState.selection?.asSingle().main
					if (!sel) return tr
					if (
						tr.docChanged &&
						!(
							sel.anchor == tr.startState.doc.length &&
							sel.head == tr.startState.doc.length
						)
					) {
						return [
							tr.startState.update({
								selection: {
									anchor: view.state.doc.length,
									head: view.state.doc.length,
								},
								scrollIntoView: true,
							}),
							// tr.startState.update(),
						]
					}
					return tr
				})
			view.update(okay)
		},
		extensions: [
			keymap.of([
				{
					key: "Enter",
					run: insertNewline,
					shift: insertNewlineAndIndent,
				},
				...standardKeymap,
			]),
			EditorView.theme({
				"*": {
					"font-family": "Fantasque Sans Mono, 'Courier New', monospace",
				},
			}),
			EditorView.lineWrapping,
			automergeSyncPlugin({handle: hash.docHandle, path: ["text"]}),
			EditorState.transactionFilter.of(tr => {
				if (tr.isUserEvent("undo")) return []
				if (tr.isUserEvent("redo")) return []
				if (tr.isUserEvent("delete")) return []
				if (tr.isUserEvent("move")) return []
				// todo maybe allow pasting to create a post-it
				if (tr.isUserEvent("input.paste")) return []
				if (tr.isUserEvent("input.drop")) return []
				if (tr.docChanged) {
					return [
						{
							selection: {
								anchor: tr.state.doc.length,
								head: tr.state.doc.length,
							},
							scrollIntoView: true,
						},
						tr,
					]
				}
				return tr
			}),
			EditorState.changeFilter.of(tr => {
				return true
			}),
		],
	})
	onMount(() => {
		view.focus()
		view.dispatch(
			view.state.update({
				selection: {
					anchor: view.state.doc.length,
					head: view.state.doc.length,
				},
				scrollIntoView: true,
			})
		)
	})
	return (
		<div>
			<section class="page">
				<header></header>
				<main>{editor}</main>
			</section>
			<For each={doc().postits}>
				{(postit, index) => {
					return (
						<PostIt
							x={postit.x}
							y={postit.y}
							text={postit.text}
							color={postit.color}
							move={(xy: {x: number; y: number}) => {
								hash.docHandle.change(doc => {
									doc.postits[index()].x = xy.x
									doc.postits[index()].y = xy.y
								})
							}}
							close={() => {
								hash.docHandle.change(doc => {
									doc.postits.deleteAt(index())
								})
							}}
						/>
					)
				}}
			</For>
		</div>
	)
}

function PostIt(props: {
	x: number
	y: number
	text: string
	color: string
	move(xy: {x: number; y: number}): void
	close(): void
}) {
	const [pos, setPos] = createSignal({x: props.x, y: props.y})
	let aside!: HTMLElement
	return (
		<aside
			ref={aside}
			onmousedown={event => {
				if (event.altKey) {
					props.close()
					return
				}
				const box = aside.getBoundingClientRect()
				let offX = event.x - box.left
				let offY = event.y - box.top
				const onmove = (event: MouseEvent) => {
					setPos({
						x: event.pageX - offX,
						y: event.pageY - offY,
					})
				}
				window.addEventListener("mousemove", onmove)
				window.addEventListener(
					"mouseup",
					() => {
						props.move(pos())
						window.removeEventListener("mousemove", onmove)
					},
					{once: true}
				)
			}}
			style={{
				position: "absolute",
				left: pos().x + "px",
				top: pos().y + "px",
				background: props.color,
				"user-select": "none",
				"box-shadow": `0 0 1em var(--shadow-color)`,
				border: "1px solid #c36",
				"font-size": "14px",
				padding: "0.5em 1em",
				"max-width": "52ex",
			}}>
			<button
				onmousedown={event => event.stopImmediatePropagation()}
				onclick={props.close}
				aria-label="discard"
				style={{
					position: "absolute",
					top: 0,
					right: 0,
					background: props.color,
					border: 0,
					cursor: "pointer",
					color: "#c36",
				}}>
				×
			</button>
			<pre style={{"white-space": "pre-line"}}>{props.text}</pre>
		</aside>
	)
}

export default App
