// 'vscode' 模块包含 VS Code 扩展 API
// 引入该模块并在下面的代码中使用别名 vscode 进行引用
import * as vscode from 'vscode';
import { generateMethodJavadoc } from './commands/methodJavadoc';
import { generateFileHeader } from './commands/fileHeader';

// 此方法在你的扩展被激活时调用
// 你的扩展在第一次执行命令时激活
export function activate(context: vscode.ExtensionContext) {

	// 使用控制台输出诊断信息 (console.log) 和错误 (console.error)
	// 这行代码将仅在你扩展激活时执行一次
	console.log('Congratulations, your extension "java-javadoc-pro" is now active!');

	// 这些命令已经在 package.json 文件中定义过了
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

// 当你的扩展被停用时调用此方法
export function deactivate() { }
