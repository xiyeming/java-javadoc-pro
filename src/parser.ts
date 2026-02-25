import * as vscode from 'vscode';

export interface MethodInfo {
    params: string[];
    returnType: string;
}

/**
 * 解析方法签名字符串以提取参数和返回类型。
 * 假定签名看起来类似于 `[modifiers] <type params> ReturnType methodName(ParamType paramName, ...)`
 */
export function parseMethodSignature(methodText: string): MethodInfo {
    const info: MethodInfo = {
        params: [],
        returnType: 'void'
    };

    // 移除注释和换行符以便于简化解析过程
    let cleanText = methodText.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').replace(/\n/g, ' ').trim();

    // 取 '{' 或 ';' 之前的所有内容作为方法签名主体
    const braceIndex = cleanText.indexOf('{');
    const semiIndex = cleanText.indexOf(';');

    let signatureEnd = cleanText.length;
    if (braceIndex !== -1 && semiIndex !== -1) {
        signatureEnd = Math.min(braceIndex, semiIndex);
    } else if (braceIndex !== -1) {
        signatureEnd = braceIndex;
    } else if (semiIndex !== -1) {
        signatureEnd = semiIndex;
    }

    const signature = cleanText.substring(0, signatureEnd).trim();

    // 提取出参数括号块
    const paramStart = signature.lastIndexOf('(');
    const paramEnd = signature.lastIndexOf(')');

    if (paramStart !== -1 && paramEnd !== -1 && paramEnd > paramStart) {
        const paramString = signature.substring(paramStart + 1, paramEnd);
        info.params = parseParameters(paramString);
    }

    // 提取返回值类型：它应该是排在方法名之前的那部分内容
    if (paramStart !== -1) {
        const returnAndName = signature.substring(0, paramStart).trim();
        const parts = returnAndName.split(/\s+/);

        // 处理类似 `IPage<CrsItemVo> getItems` 的泛型返回值
        // 如果泛型里面带有空格例如 `Map<String, List<Long>>`，我们就不能无脑使用 split 按空格分隔了
        // 因此需要从方法名倒过来解析

        let inGenerics = 0;
        let methodNameStart = -1;
        for (let i = returnAndName.length - 1; i >= 0; i--) {
            const char = returnAndName[i];
            if (char === '>') inGenerics++;
            else if (char === '<') inGenerics--;
            else if (inGenerics === 0 && /\s/.test(char) && methodNameStart === -1) {
                // 找到第一个不在 '<>' 泛型范围中的空格，这就标志着隔离出了方法名称
                methodNameStart = i;
                break;
            }
        }

        if (methodNameStart !== -1) {
            const modifiersAndReturn = returnAndName.substring(0, methodNameStart).trim();
            // 此时剩下前半部分的修饰符与返回值，截取掉多余前缀拿到最终返回值
            // 这里同样需要执行泛型倒查逻辑以防类型也被按空格分离
            let typeStart = 0;
            let typeInGenerics = 0;
            for (let i = modifiersAndReturn.length - 1; i >= 0; i--) {
                const char = modifiersAndReturn[i];
                if (char === '>') typeInGenerics++;
                else if (char === '<') typeInGenerics--;
                else if (typeInGenerics === 0 && /\s/.test(char)) {
                    typeStart = i + 1;
                    break;
                }
            }
            let returnTypeRaw = modifiersAndReturn.substring(typeStart).trim();
            // 处理在返回值之前有泛型声明的场景，例如 public <T> List<T> getList()
            if (returnTypeRaw.endsWith('>')) {
                const gtIdx = modifiersAndReturn.lastIndexOf('>');
                if (gtIdx != -1) {
                    let inG = 0;
                    for (let i = gtIdx; i >= 0; i--) {
                        const c = modifiersAndReturn[i];
                        if (c == '>') inG++;
                        else if (c == '<') inG--;
                        if (c == '<' && inG == 0) {
                            const beforeGeneric = modifiersAndReturn.substring(0, i).trim();
                            if (beforeGeneric.length > 0) {
                                // 已找到泛型声明的开头
                                const possibleModifier = beforeGeneric.split(/\s+/).pop();
                                if (possibleModifier && ['public', 'private', 'protected', 'static', 'final', 'abstract'].includes(possibleModifier)) {
                                    returnTypeRaw = modifiersAndReturn.substring(i).trim();
                                    break;
                                } else if (possibleModifier) {
                                    returnTypeRaw = possibleModifier + modifiersAndReturn.substring(i).trim();
                                    break;
                                }
                            } else {
                                returnTypeRaw = modifiersAndReturn.substring(i).trim();
                            }
                        }
                    }
                }
            }

            // 清理注解（如果有修饰符带注解漏过来了例如 @ResponseBody IPage<T>）
            if (returnTypeRaw.includes('@')) {
                const returnParts = returnTypeRaw.split(/\s+/);
                returnTypeRaw = returnParts[returnParts.length - 1];
            }

            info.returnType = returnTypeRaw || 'void';
        }
    }

    // 构造方法的特殊情况：它没有返回值，且方法名和类名相同（此时返回值有可能被错误地赋值成了类修饰符，例如 'public'）
    if (['public', 'private', 'protected', 'void'].includes(info.returnType)) {
        if (info.returnType !== 'void') {
            info.returnType = 'void'; // 这是个构造函数，把返回值得修正为 void
        }
    }

    return info;
}

function parseParameters(paramString: string): string[] {
    const params: string[] = [];
    if (!paramString.trim()) {
        return params;
    }

    let currentParam = '';
    let inGenerics = 0;

    for (let i = 0; i < paramString.length; i++) {
        const char = paramString[i];

        if (char === '<') {
            inGenerics++;
            currentParam += char;
        } else if (char === '>') {
            inGenerics--;
            currentParam += char;
        } else if (char === ',' && inGenerics === 0) {
            // 遇到不在泛型作用范围里面的逗号，说明这一个参数结束了
            const paramName = extractParamName(currentParam);
            if (paramName) params.push(paramName);
            currentParam = '';
        } else {
            currentParam += char;
        }
    }

    if (currentParam.trim()) {
        const paramName = extractParamName(currentParam);
        if (paramName) params.push(paramName);
    }

    return params;
}

function extractParamName(paramDecl: string): string {
    const parts = paramDecl.trim().split(/\s+/);
    if (parts.length >= 2) {
        // 抹除 `String... args` 这样的可选不定参数标识
        let name = parts[parts.length - 1];
        if (name.startsWith('...')) {
            name = name.substring(3);
        } else if (name.endsWith('...')) {
            name = name.substring(0, name.length - 3);
        } else if (parts[parts.length - 2].endsWith('...')) {
            name = parts[parts.length - 1];
        }
        return name;
    }
    return '';
}
