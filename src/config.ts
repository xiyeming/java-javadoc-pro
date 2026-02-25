import * as vscode from 'vscode';

export interface JavadocProConfig {
    author: string;
    dateFormat: string;
    methodTemplate: string[];
    fileTemplate: string[];
}

export function getConfig(): JavadocProConfig {
    const config = vscode.workspace.getConfiguration('javadocPro');

    return {
        author: config.get<string>('author') || 'xiyeming',
        dateFormat: config.get<string>('dateFormat') || 'yyyy-MM-dd HH:mm',
        methodTemplate: config.get<string[]>('methodTemplate') || [
            "/**",
            " * @description: ${cursor}",
            " * @author: ${author}",
            " * @date: ${date}",
            " * ${params}",
            " * @return: ${returnType}",
            " */"
        ],
        fileTemplate: config.get<string[]>('fileTemplate') || [
            "/**",
            " * @Project: ${projectName}",
            " * @File: ${fileName}",
            " * @Author: ${author}",
            " * @Date: ${date}",
            " * @Description: ${cursor}",
            " */"
        ]
    };
}

export function formatDate(format: string, date: Date = new Date()): string {
    const map: { [key: string]: string } = {
        'yyyy': date.getFullYear().toString(),
        'MM': (date.getMonth() + 1).toString().padStart(2, '0'),
        'dd': date.getDate().toString().padStart(2, '0'),
        'HH': date.getHours().toString().padStart(2, '0'),
        'mm': date.getMinutes().toString().padStart(2, '0'),
        'ss': date.getSeconds().toString().padStart(2, '0')
    };

    let result = format;
    for (const key in map) {
        result = result.replace(key, map[key]);
    }
    return result;
}
