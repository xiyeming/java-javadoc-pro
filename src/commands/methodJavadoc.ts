import * as vscode from 'vscode';
import { getConfig, formatDate } from '../config';
import { parseMethodSignature } from '../parser';

export async function generateMethodJavadoc() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showInformationMessage('未找到打开的Java文件');
        return;
    }

    const document = editor.document;
    if (document.languageId !== 'java') {
        vscode.window.showInformationMessage('该命令仅支持Java文件');
        return;
    }

    const position = editor.selection.active;

    // Use VS Code's symbol provider to find the method at the cursor
    // The redhat.java extension (which provides java language features) responds to this
    let symbols: vscode.DocumentSymbol[] | undefined;
    try {
        symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
            'vscode.executeDocumentSymbolProvider',
            document.uri
        );
    } catch (e) {
        vscode.window.showInformationMessage('无法获取文档符号，请确保Java扩展已激活');
        return;
    }

    if (!symbols || symbols.length === 0) {
        vscode.window.showInformationMessage('文档中没有找到Java类或方法');
        return;
    }

    // Find the symbol corresponding to the method the cursor is in
    const activeMethod = findMethodSymbolAtPosition(symbols, position);

    if (!activeMethod) {
        vscode.window.showInformationMessage('请将光标置于Java方法内部或方法声明行');
        return;
    }

    // Extract exactly the text of the method signature and parse it
    // The symbol.range covers the whole method including body. 
    // We only want the text up to the first `{` or `;`
    let methodText = '';
    const endLine = Math.min(activeMethod.range.start.line + 10, activeMethod.range.end.line);
    for (let i = activeMethod.range.start.line; i <= endLine; i++) {
        methodText += document.lineAt(i).text + '\n';
        if (methodText.includes('{') || methodText.includes(';')) {
            break;
        }
    }

    const methodInfo = parseMethodSignature(methodText);
    methodInfo.returnType = resolveFQN(methodInfo.returnType, document);
    const config = getConfig();

    // Format params
    const formattedParams: string[] = [];
    for (const param of methodInfo.params) {
        formattedParams.push(`* @param ${param}`);
    }

    // Fallback if formatting array has no elements - some templates might just use ${params}
    let paramsReplacement = formattedParams.length > 0 ? formattedParams.join('\n ') : '* @param';

    // Format Date
    const dateStr = formatDate(config.dateFormat);

    // Build comment lines
    let commentLines = [...config.methodTemplate];
    let cursorIndex = -1;
    let cursorPositionInLine = -1;

    let processedLines: string[] = [];

    for (let i = 0; i < commentLines.length; i++) {
        let line = commentLines[i];

        // Handle ${params} specially to expand it over multiple lines
        if (line.includes('${params}')) {
            if (formattedParams.length > 0) {
                for (let pIdx = 0; pIdx < formattedParams.length; pIdx++) {
                    processedLines.push(formattedParams[pIdx]);
                }
            }
            continue;
        }

        // Replace other variables
        line = line.replace(/\$\{author\}/g, config.author);
        line = line.replace(/\$\{date\}/g, dateStr);
        line = line.replace(/\$\{returnType\}/g, methodInfo.returnType);

        // Record cursor position
        const cursorMatch = line.indexOf('${cursor}');
        if (cursorMatch !== -1) {
            // Keep track of which line index (in the final output) the cursor is on
            cursorIndex = processedLines.length;
            cursorPositionInLine = cursorMatch;
            line = line.replace(/\$\{cursor\}/g, '');
        }

        processedLines.push(line);
    }

    // Find insertion point, right above the method declaration (but keeping indentation)
    const firstLineOfMethod = document.lineAt(activeMethod.range.start.line);
    // Find the indentation of the method
    const indentation = firstLineOfMethod.text.substring(0, firstLineOfMethod.firstNonWhitespaceCharacterIndex);

    // Create the final comment block, applying indentation to every line except the first if inserted at beginning of line
    let finalComment = processedLines.map((line, idx) => {
        if (idx === 0) return indentation + line;
        else return indentation + ' ' + line.trimStart();
    }).join('\n') + '\n';

    // Ensure we replace any existing first indent that was double-added
    finalComment = finalComment.substring(indentation.length); // We will insert at the start of the line, which includes indentation in editBuilder if we insert at column 0. Better to insert at firstNonWhitespaceCharacterIndex.

    const insertPosition = new vscode.Position(activeMethod.range.start.line, firstLineOfMethod.firstNonWhitespaceCharacterIndex);

    // Apply text edit atomistically
    const success = await editor.edit(editBuilder => {
        editBuilder.insert(insertPosition, finalComment);
    });

    if (success && cursorIndex !== -1) {
        const targetLine = activeMethod.range.start.line + cursorIndex;
        // Calculation of column includes indentation + 1 space before the *
        const targetPosition = new vscode.Position(targetLine, firstLineOfMethod.firstNonWhitespaceCharacterIndex + 1 + cursorPositionInLine);
        editor.selection = new vscode.Selection(targetPosition, targetPosition);
        editor.revealRange(new vscode.Range(targetPosition, targetPosition));
    }
}

function findMethodSymbolAtPosition(symbols: vscode.DocumentSymbol[], position: vscode.Position): vscode.DocumentSymbol | undefined {
    for (const symbol of symbols) {
        if (symbol.range.contains(position)) {
            if (symbol.kind === vscode.SymbolKind.Method || symbol.kind === vscode.SymbolKind.Constructor || symbol.kind === vscode.SymbolKind.Function) {
                return symbol;
            }
            // If it's a class/interface, search its children
            if (symbol.children && symbol.children.length > 0) {
                const childResult = findMethodSymbolAtPosition(symbol.children, position);
                if (childResult) {
                    return childResult;
                }
            }
        }
    }
    return undefined;
}

function resolveFQN(typeStr: string, document: vscode.TextDocument): string {
    if (!typeStr || typeStr === 'void') return typeStr;

    // Collect all imports from the file
    const imports: Record<string, string> = {};
    for (let i = 0; i < document.lineCount; i++) {
        const lineText = document.lineAt(i).text.trim();
        if (lineText.startsWith('import ')) {
            let importDecl = lineText.substring(7).trim(); // Remove 'import '
            if (importDecl.endsWith(';')) importDecl = importDecl.slice(0, -1);
            if (!importDecl.includes('*')) {
                const parts = importDecl.split('.');
                const className = parts[parts.length - 1];
                imports[className] = importDecl;
            }
        }

        // Stop scanning early once we hit the class definition to save performance
        if (lineText.includes('class ') || lineText.includes('interface ') || lineText.includes('@RestController')) {
            if (i > 10) break; // Give it at least 10 lines of leeway
        }
    }

    // Replace occurrences of matching classes in typeStr with their FQN
    let resolvedStr = typeStr;
    const words = typeStr.match(/[a-zA-Z_]\w*/g) || [];
    const uniqueWords = [...new Set(words)];

    // Longest first to avoid substring partial replacements (though \b prevents it normally)
    uniqueWords.sort((a, b) => b.length - a.length);

    for (const word of uniqueWords) {
        if (imports[word]) {
            const regex = new RegExp(`\\b${word}\\b`, 'g');
            resolvedStr = resolvedStr.replace(regex, imports[word]);
        }
    }

    return resolvedStr;
}
