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

    // 使用 VS Code 的 DocumentSymbol 供应器来确定光标当前所处的方法
    // 安装的 redhat.java（提供 Java 语言支持的底层扩展）将处理此 API 请求
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

    // 根据当前光标位置找出对应的具体方法（Symbol）
    const activeMethod = findMethodSymbolAtPosition(symbols, position);

    if (!activeMethod) {
        vscode.window.showInformationMessage('请将光标置于Java方法内部或方法声明行');
        return;
    }

    // 在这里精确提取方法签名的那部分文本并交给 parser 进行解析
    // 由于 symbol.range 框住的是包含大括号方法体在内的整个方法
    // 我们在此只提取到遇到了第一个 '{' 或者 ';' (针对接口) 为止
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

    // 格式化输出的参数列表形式
    const formattedParams: string[] = [];
    for (const param of methodInfo.params) {
        formattedParams.push(`* @param ${param}`);
    }

    // 取保底值：如果参数数组为空，有些模板里仍然可能会保留无前缀裸写的 ${params}
    let paramsReplacement = formattedParams.length > 0 ? formattedParams.join('\n ') : '* @param';

    // 格式化日期
    const dateStr = formatDate(config.dateFormat);

    // 逐行构建最终要插入的注释块内容
    let commentLines = [...config.methodTemplate];
    let cursorIndex = -1;
    let cursorPositionInLine = -1;

    let processedLines: string[] = [];

    for (let i = 0; i < commentLines.length; i++) {
        let line = commentLines[i];

        // 特殊处理 ${params} 因为往往会有多个入参，它需要被纵向拉开扩张成多行输出
        if (line.includes('${params}')) {
            if (formattedParams.length > 0) {
                for (let pIdx = 0; pIdx < formattedParams.length; pIdx++) {
                    processedLines.push(formattedParams[pIdx]);
                }
            }
            continue;
        }

        // 替换普通的变量映射
        line = line.replace(/\$\{author\}/g, config.author);
        line = line.replace(/\$\{date\}/g, dateStr);
        line = line.replace(/\$\{returnType\}/g, methodInfo.returnType);

        // 记录占位符 cursor 所在的最终坐标位置，生成完毕后需要跳转到位
        const cursorMatch = line.indexOf('${cursor}');
        if (cursorMatch !== -1) {
            // 记录下这个光标到底是在最后拼接出来内容的第几行上
            cursorIndex = processedLines.length;
            cursorPositionInLine = cursorMatch;
            line = line.replace(/\$\{cursor\}/g, '');
        }

        processedLines.push(line);
    }

    // 寻找具体的插入点：就在方法声明声明行的正上方（同时保留首行的缩进结构）
    const firstLineOfMethod = document.lineAt(activeMethod.range.start.line);
    // 取方法声明行的制表符或者空格前缀，作为我们需要插入注释块的基础缩进
    const indentation = firstLineOfMethod.text.substring(0, firstLineOfMethod.firstNonWhitespaceCharacterIndex);

    // 生产最后的长注释字符串文本，为了保证美观给每行头部重新注入缩进
    let finalComment = processedLines.map((line, idx) => {
        if (idx === 0) return indentation + line;
        else return indentation + ' ' + line.trimStart();
    }).join('\n') + '\n';

    // 重置双倍缩进：因为在 vscode 编辑器层面通过 insert 到本行第一个非空字符起步，它会自然推入，故内部注释排版只需从星号算起即可
    finalComment = finalComment.substring(indentation.length); // 取保底去重处理，规避由于我们的插入位置自带了缩进偏移导致首行被凭空多缩进了一次

    const insertPosition = new vscode.Position(activeMethod.range.start.line, firstLineOfMethod.firstNonWhitespaceCharacterIndex);

    // 调用 vscode 编辑器 API 以单次原子事务性地注入所有的文本代码
    const success = await editor.edit(editBuilder => {
        editBuilder.insert(insertPosition, finalComment);
    });

    if (success && cursorIndex !== -1) {
        const targetLine = activeMethod.range.start.line + cursorIndex;
        // 光标最终停留的具体位列 = 前缀缩进大小 + 后面代表 Javadoc 那个星号加一个空格的常数差额 + 匹配符自身索引
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
            // 当前只是外层的 Class 或者接口，进行深度递归下钻搜索
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

    // 收集这个文件顶部所有的 import 引用声明
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

        // 节省性能开销，一旦我们已经触碰到了类的第一行实际代码声明了，就停止继续向下的漫无目的探索（代表导入包区域已结束）
        if (lineText.includes('class ') || lineText.includes('interface ') || lineText.includes('@RestController')) {
            if (i > 10) break; // Give it at least 10 lines of leeway
        }
    }

    // 把提取出来的返回值类型中，命中导入声明的缩短类名执行一次正则全局替换映射回其全限定名(FQN)
    let resolvedStr = typeStr;
    const words = typeStr.match(/[a-zA-Z_]\w*/g) || [];
    const uniqueWords = [...new Set(words)];

    // 替换之前一定要依据字符串长度从长到短排序一次，确保类似 "Long" 和 "List<Long>" 这种嵌套或相近单词处理时发生异常互相吞并
    uniqueWords.sort((a, b) => b.length - a.length);

    for (const word of uniqueWords) {
        if (imports[word]) {
            const regex = new RegExp(`\\b${word}\\b`, 'g');
            resolvedStr = resolvedStr.replace(regex, imports[word]);
        }
    }

    return resolvedStr;
}
