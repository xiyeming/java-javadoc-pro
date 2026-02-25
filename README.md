# Java Javadoc Pro

Java Javadoc Pro 是一款为 VS Code 提供的强大 Java 注释生成插件。它可以根据 Java 语法树精准地生成 IDEA 风格的方法 Javadoc 注释和文件头注释，完美支持各种复杂的泛型类型。

## 功能介绍

### 1. 智能方法注释 (Method Javadoc)
- 快捷键：`Ctrl + Alt + ]`
- 将光标放在任何 Java 方法内部或者方法签名行，一键生成完整的 Javadoc。
- 采用 AST 级别的方法解析，**精确保留诸如 `IPage<CrsItemVo>` 和 `Map<String, List<Long>>` 等复杂泛型返回值**，不会像正则匹配那样被异常截断。
- 自动提取方法中的所有参数。

### 2. 标准文件头注释 (File Header)
- 快捷键：`Ctrl + Alt + [`
- 将光标放在 Java 文件中，一键在文件顶部（或 `package` 声明上方）插入标准的开发者文件头注释。
- 自动抓取并填入当前的工作区(Workspace)名称和当前 Java 文件名。

### 3. 可高度自定义和撤销友好
- 注释生成后光标会自动跳转到 `@description:` 后的空格处，方便开发者立刻开始描述。
- 所有注释插入均为原子操作，支持 `Ctrl + Z` 一次性撤销整个注释块，不破坏原有代码格式。
- 提供配置项自定义作者名称、日期格式和注释模板内容。

## 自定义配置说明

你可以在 VS Code 的 `settings.json` 中覆盖以下默认配置：

```json
{
  "javadocPro.author": "9527",
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

## 注意事项

本插件基于 `redhat.java` (Language Support for Java™ by Red Hat) 提供底层 Java AST 支持。使用前请确保您已经安装并启用了 Java 支持生态。

---
**Enjoy Coding!**
