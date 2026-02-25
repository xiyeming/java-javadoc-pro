import * as vscode from 'vscode';
import * as path from 'path';
import { getConfig, formatDate } from '../config';

export async function generateFileHeader() {
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

    const config = getConfig();
    const fileName = path.basename(document.fileName);

    // 获取项目名
    let projectName = '';
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
    if (workspaceFolder) {
        projectName = workspaceFolder.name;
    }

    // 获取 package 声明的行号和文本
    let packageLine = -1;
    let packageName = '';
    for (let i = 0; i < Math.min(document.lineCount, 50); i++) {
        const lineText = document.lineAt(i).text.trim();
        if (lineText.startsWith('package ')) {
            packageLine = i;
            packageName = lineText.substring(8, lineText.length - 1).trim(); // 剔除 'package ' 声明关键字以及末尾的 ';'
            break;
        }
    }

    // 格式化日期
    const dateStr = formatDate(config.dateFormat);

    // 构建注释内容
    let commentLines = [...config.fileTemplate];
    let cursorIndex = -1;
    let cursorPositionInLine = -1;

    for (let i = 0; i < commentLines.length; i++) {
        let line = commentLines[i];

        // 替换变量
        line = line.replace(/\$\{projectName\}/g, projectName);
        line = line.replace(/\$\{fileName\}/g, fileName);
        line = line.replace(/\$\{author\}/g, config.author);
        line = line.replace(/\$\{date\}/g, dateStr);

        // 查找 cursor 占位符
        const cursorMatch = line.indexOf('${cursor}');
        if (cursorMatch !== -1) {
            cursorIndex = i;
            cursorPositionInLine = cursorMatch;
            line = line.replace(/\$\{cursor\}/g, '');
        }

        commentLines[i] = line;
    }

    const commentText = commentLines.join('\n') + '\n';

    // 确定插入位置：在 package 声明上方，或者在文件第一行
    const insertLine = packageLine === -1 ? 0 : packageLine;
    const insertPosition = new vscode.Position(insertLine, 0);

    // 执行编辑并移动光标
    const success = await editor.edit(editBuilder => {
        editBuilder.insert(insertPosition, commentText);
    });

    if (success && cursorIndex !== -1) {
        const targetLine = insertLine + cursorIndex;
        const targetPosition = new vscode.Position(targetLine, cursorPositionInLine);
        editor.selection = new vscode.Selection(targetPosition, targetPosition);
        editor.revealRange(new vscode.Range(targetPosition, targetPosition));
    }
}
