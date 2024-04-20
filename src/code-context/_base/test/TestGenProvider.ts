import vscode from "vscode";

import { CodeStructure } from "../../../editor/codemodel/CodeFile";
import { AutoTestTemplateContext } from "./AutoTestTemplateContext";
import { TSLanguageService } from "../../../editor/language/service/TSLanguageService";
import { SupportedLanguage } from "../../../editor/language/SupportedLanguage";

export interface TestGenProvider {
	isApplicable(lang: SupportedLanguage): boolean;
	setup(defaultLanguageService: TSLanguageService, context?: AutoTestTemplateContext): Promise<void>;
	findOrCreateTestFile(sourceFile: vscode.TextDocument, element: any): Promise<AutoTestTemplateContext>;
	lookupRelevantClass(element: any): Promise<CodeStructure>;
}