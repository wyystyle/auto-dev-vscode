import { Edit } from "web-tree-sitter";
import vscode, { TextDocument, TextDocumentChangeEvent, TextDocumentContentChangeEvent, Uri } from "vscode";

import { TreeSitterFile } from "../../code-context/ast/TreeSitterFile";
import { isSupportedLanguage } from "../language/SupportedLanguage";
import { DefaultLanguageService } from "../language/service/DefaultLanguageService";
import { LRUCache } from "lru-cache";

export class TreeSitterFileManager implements vscode.Disposable {
	private documentUpdateListener: vscode.Disposable;
	private cache: LRUCache<Uri, TreeSitterFile> = new LRUCache({ max: 20 });

	// private cache: Map<Uri, TreeSitterFile>;
	private static instance: TreeSitterFileManager;

	public static getInstance(): TreeSitterFileManager {
		if (!TreeSitterFileManager.instance) {
			TreeSitterFileManager.instance = new TreeSitterFileManager();
		}

		return TreeSitterFileManager.instance;
	}

	constructor() {
		this.documentUpdateListener = vscode.workspace.onDidChangeTextDocument(async (event) => {
			if (!isSupportedLanguage(event.document.languageId)) {
				return;
			}

			await this.updateCacheOnChange(event);
		});
	}

	private async updateCacheOnChange(event: TextDocumentChangeEvent) {
		const uri = event.document.uri;
		let tsfile = this.getDocument(uri);
		const tree = tsfile?.tree;
		if (!tree) {
			if (!this.cache.has(uri)) {
				const file = await TreeSitterFileManager.create(event.document);
				this.setDocument(uri, file);
			}

			return;
		}

		for (const change of event.contentChanges) {
			const editParams = this.createEditParams(change, event.document);
			tree.edit(editParams);
		}

		tsfile!!.update(tree, event.document.getText());
		this.setDocument(uri, tsfile!!);
	}

	static async create(document: vscode.TextDocument): Promise<TreeSitterFile> {
		const cached = TreeSitterFileManager.getInstance().getDocument(document.uri);
		if (cached) {
			return cached;
		}

		const src = document.getText();
		const langId = document.languageId;

		const file = await TreeSitterFile.create(src, langId, new DefaultLanguageService(), document.uri.fsPath);
		TreeSitterFileManager.getInstance().setDocument(document.uri, file);
		return file;
	}

	/// todo: this algorithm was generated by the gpt-4o model, it should be reviewed by a developer
	createEditParams(change: TextDocumentContentChangeEvent, document: TextDocument): Edit {
		const rangeOffset = change.rangeOffset;
		const oldEndIndex = rangeOffset + change.rangeLength;
		const newEndIndex = rangeOffset + change.text.length;

		const getPosition = (index: number) => {
			const position = document.positionAt(index);
			return { row: position.line, column: position.character };
		};

		const startPosition = getPosition(rangeOffset);
		const oldEndPosition = getPosition(oldEndIndex);
		const newEndPosition = getPosition(newEndIndex);

		return { startIndex: rangeOffset, oldEndIndex, newEndIndex, startPosition, oldEndPosition, newEndPosition };
	}

	dispose() {
		this.documentUpdateListener?.dispose();
	}

	public setDocument(uri: Uri, file: TreeSitterFile): void {
		this.cache.set(uri, file);
	}

	/**
	 * If you want to get doc with cache, please use `documentToTreeSitterFile` instead
	 * @param uri
	 */
	public getDocument(uri: Uri): TreeSitterFile | undefined {
		return this.cache.get(uri);
	}
}
