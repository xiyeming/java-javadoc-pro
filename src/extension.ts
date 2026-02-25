// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { generateMethodJavadoc } from './commands/methodJavadoc';
import { generateFileHeader } from './commands/fileHeader';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "java-javadoc-pro" is now active!');

	// The command has been defined in the package.json file
	const methodJavadocCommand = vscode.commands.registerCommand('java-javadoc-pro.generateMethodJavadoc', async () => {
		try {
			await generateMethodJavadoc();
		} catch (error: any) {
			vscode.window.showInformationMessage(`生成方法注释失败: ${error.message || error}`);
		}
	});

	const fileHeaderCommand = vscode.commands.registerCommand('java-javadoc-pro.generateFileHeader', async () => {
		try {
			await generateFileHeader();
		} catch (error: any) {
			vscode.window.showInformationMessage(`生成文件头注释失败: ${error.message || error}`);
		}
	});

	context.subscriptions.push(methodJavadocCommand, fileHeaderCommand);
}

// This method is called when your extension is deactivated
export function deactivate() { }
