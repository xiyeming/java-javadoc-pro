# Java Javadoc Pro

[English Documentation](#english-documentation) | [中文文档](#中文文档)

---

## 中文文档

Java Javadoc Pro 是一款为 VS Code 提供的强大 Java 注释生成插件。它可以根据 Java 语法树精准地生成 IDEA 风格的方法 Javadoc 注释和文件头注释，完美支持各种复杂的泛型类型。

### 功能介绍

#### 1. 智能方法注释 (Method Javadoc)
- 快捷键：`Ctrl + Alt + ]`
- 将光标放在任何 Java 方法内部或者方法签名行，一键生成完整的 Javadoc。
- 采用 AST 级别的方法解析，**精确保留诸如 `IPage<CrsItemVo>` 和 `Map<String, List<Long>>` 等复杂泛型返回值**，并会根据 import 自动解析出全类名 (FQN)。不会像正则匹配那样被异常截断。
- 自动提取方法中的所有参数。

#### 2. 标准文件头注释 (File Header)
- 快捷键：`Ctrl + Alt + [`
- 将光标放在 Java 文件中，一键在文件顶部（或 `package` 声明上方）插入标准的开发者文件头注释。
- 自动抓取并填入当前的工作区(Workspace)名称和当前 Java 文件名。

#### 3. 可高度自定义和撤销友好
- 注释生成后光标会自动跳转到 `@description:` 后的空格处，方便开发者立刻开始描述。
- 所有注释插入均为原子操作，支持 `Ctrl + Z` 一次性撤销整个注释块，不破坏原有代码格式。
- 提供配置项自定义作者名称、日期格式和注释模板内容。

### 自定义配置说明

你可以在 VS Code 的 `settings.json` 中覆盖以下默认配置：

```json
{
  "javadocPro.author": "xiyeming",
  "javadocPro.dateFormat": "yyyy-MM-dd HH:mm",
  "javadocPro.methodTemplate": [
    "/**",
    " * @description: ${cursor}",
    " * @author: ${author}",
    " * @date: ${date}",
    " * ${params}",
    " * @return: ${returnType}",
    " */"
  ],
  "javadocPro.fileTemplate": [
    "/**",
    " * @Project: ${projectName}",
    " * @File: ${fileName}",
    " * @Author: ${author}",
    " * @Date: ${date}",
    " * @Description: ${cursor}",
    " */"
  ]
}
```

### 注意事项

本插件基于 `redhat.java` (Language Support for Java™ by Red Hat) 提供底层 Java AST 支持。使用前请确保您已经安装并启用了 Java 支持生态。

---

## English Documentation

Java Javadoc Pro is a powerful Java comment generation extension for VS Code. It accurately generates IDEA-style method Javadoc comments and file header comments based on the Java Abstract Syntax Tree (AST), perfectly supporting various complex generic types.

### Features

#### 1. Smart Method Javadoc
- Shortcut: `Ctrl + Alt + ]`
- Place your cursor anywhere inside a Java method or on the method signature line, and generate a complete Javadoc with one click.
- Uses AST-level method parsing. **Accurately retains complex generic return types such as `IPage<CrsItemVo>` and `Map<String, List<Long>>`**, resolving them to Fully Qualified Names (FQN) based on imports. It will not be erroneously truncated like regex-based alternatives.
- Automatically extracts all parameters from the method.

#### 2. Standard File Header
- Shortcut: `Ctrl + Alt + [`
- Place your cursor in a Java file, and insert a standard developer file header comment at the top of the file (or above the `package` declaration) with one click.
- Automatically captures and fills in the current Workspace name and the current Java file name.

#### 3. Highly Customizable and Undo-Friendly
- Change the structure or variable names of your templates gracefully through VS Code settings `settings.json`.
- Adopts atomic VS Code TextEdit API, allowing for a single `Ctrl + Z` undo without messing up your document history if you trigger the generation by mistake.

### Customization Guide

You can override the following default configurations in VS Code's `settings.json`:

```json
{
  "javadocPro.author": "xiyeming", // Your author name
  "javadocPro.dateFormat": "yyyy-MM-dd HH:mm", // The date format used in comments
  
  // The template for method comments. Note that ${params} is a special placeholder 
  // that will expand to multiple lines based on the number of actual parameters.
  "javadocPro.methodTemplate": [
    "/**",
    " * @description: ${cursor}",
    " * @author: ${author}",
    " * @date: ${date}",
    " * ${params}",
    " * @return: ${returnType}",
    " */"
  ],
  
  // The template for file header comments.
  "javadocPro.fileTemplate": [
    "/**",
    " * @Project: ${projectName}",
    " * @File: ${fileName}",
    " * @Author: ${author}",
    " * @Date: ${date}",
    " * @Description: ${cursor}",
    " */"
  ]
}
```

### Available Placeholders

- `${cursor}`: After generating the comment, the cursor will automatically switch to this position so you can immediately start typing the description.
- `${author}`: The author's name, retrieved from `javadocPro.author`.
- `${date}`: The formatted timeline, configured via `javadocPro.dateFormat`.
- `${projectName}`: (Only for file header) The current VS Code workspace folder name.
- `${fileName}`: (Only for file header) The current Java file's base name.
- `${params}`: (Only for methods) Replaced line-by-line with all extracted method parameters.
- `${returnType}`: (Only for methods) The method's return type. Contains logic for expanding short generic class names to Fully Qualified Class Names (FQN).

### Requirements

The extension natively relies on VS Code's `DocumentSymbolProvider` standard API to locate and index Java methods.
Therefore, please ensure you have a Java language server installed (e.g., the `redhat.java` extension) to guarantee standard AST extraction context.

---
**Enjoy Coding!**
