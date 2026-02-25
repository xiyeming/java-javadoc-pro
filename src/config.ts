import * as vscode from 'vscode';

/**
 * 插件配置接口，反映了 package.json 中 javadocPro 节点下的各种用户设置
 */
export interface JavadocProConfig {
    author: string;
    dateFormat: string;
    methodTemplate: string[];
    fileTemplate: string[];
}

/**
 * 按层级获取完整的 Javadoc Pro 配置，提供稳健的默认备选参数
 */
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

/**
 * 格式化时间生成器
 * @param format 例如 "yyyy-MM-dd HH:mm:ss" 这样的时间模版字符串
 * @param date 默认获取当前时间
 * @returns 格式化后的时间字符串
 */
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
