import * as vscode from 'vscode';

export interface MethodInfo {
    params: string[];
    returnType: string;
}

/**
 * Parsing a method signature string to extract parameters and return type.
 * Assumes signature looks like `[modifiers] <type params> ReturnType methodName(ParamType paramName, ...)`
 */
export function parseMethodSignature(methodText: string): MethodInfo {
    const info: MethodInfo = {
        params: [],
        returnType: 'void'
    };

    // Remove comments and newlines to simplify parsing
    let cleanText = methodText.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').replace(/\n/g, ' ').trim();

    // The method signature is everything before the '{' or ';'
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

    // Extract parameters
    const paramStart = signature.lastIndexOf('(');
    const paramEnd = signature.lastIndexOf(')');

    if (paramStart !== -1 && paramEnd !== -1 && paramEnd > paramStart) {
        const paramString = signature.substring(paramStart + 1, paramEnd);
        info.params = parseParameters(paramString);
    }

    // Extract return type: it should be the part before the method name
    if (paramStart !== -1) {
        const returnAndName = signature.substring(0, paramStart).trim();
        const parts = returnAndName.split(/\s+/);

        // Handling generic return types like `IPage<CrsItemVo> getItems`
        // We can't just use split on space if the generic type has spaces e.g., `Map<String, List<Long>>`
        // Need to parse backwards from the method name

        let inGenerics = 0;
        let methodNameStart = -1;
        for (let i = returnAndName.length - 1; i >= 0; i--) {
            const char = returnAndName[i];
            if (char === '>') inGenerics++;
            else if (char === '<') inGenerics--;
            else if (inGenerics === 0 && /\s/.test(char) && methodNameStart === -1) {
                // First space outside of generics, going backwards from the end, isolates the method name
                methodNameStart = i;
                break;
            }
        }

        if (methodNameStart !== -1) {
            const modifiersAndReturn = returnAndName.substring(0, methodNameStart).trim();
            // Now we extract the return type from the remaining string by taking the last part (ignoring public, static etc)
            // Need to apply the generic logic again
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
            // Handle generic declarations before return type e.g. public <T> List<T> getList()
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
                                // Found it
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

            // Cleanup annotations if they slip in (e.g. @ResponseBody IPage<T>)
            if (returnTypeRaw.includes('@')) {
                const returnParts = returnTypeRaw.split(/\s+/);
                returnTypeRaw = returnParts[returnParts.length - 1];
            }

            info.returnType = returnTypeRaw || 'void';
        }
    }

    // Special case for constructors: no return type, method name matches class name (we can check if return type matches modifiers)
    if (['public', 'private', 'protected', 'void'].includes(info.returnType)) {
        if (info.returnType !== 'void') {
            info.returnType = 'void'; // Constructor
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
            // End of one parameter
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
        // Handle varargs like `String... args`
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
