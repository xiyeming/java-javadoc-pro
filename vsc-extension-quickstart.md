# 欢迎使用你的 VS Code 扩展

## 文件夹里有什么

* 这个文件夹包含了你的扩展所需的所有文件。
* `package.json` - 这是注册、声明你的扩展和命令的清单文件。
  * 示例插件注册了一个命令并定义了它的标题和命令名。凭借这些信息，VS Code 可以在命令面板里显示该命令。此时它甚至还不需要立刻加载插件代码。
* `src/extension.ts` - 这是你提供命令实现逻辑的主入口文件。
  * 这个文件导出了一个 `activate` 函数，当你的扩展生命周期内第一次被调用执行时（比如通过命令触发），该函数就会被触发。在 `activate` 函数中我们调用了 `registerCommand`。
  * 我们将包含命令实现代码的函数闭包作为第二个参数传递给 `registerCommand` 进行了注册拦截。

## 环境配置

* 推荐安装相关的扩展插件 (amodio.tsl-problem-matcher, ms-vscode.extension-test-runner, 以及 dbaeumer.vscode-eslint)

## 立即运行测试

* 按下 `F5` 键就可以打开一个新的加载了你当前开发中扩展的测试窗口。
* 在新的测试窗口中，通过按下（Mac 上 `Cmd+Shift+P` 或者 Windows/Linux `Ctrl+Shift+P`）打开命令面板，输入你的命令。
* 在你的 `src/extension.ts` 代码中设置断点来对你的扩展进行单步调试。
* 在调试控制台 (Debug Console) 中寻找扩展打印的日志输出。

## 修改并生效

* 在你修改了 `src/extension.ts` 里的代码后，你可以从调试工具栏点击重启按钮来重新加载扩展。
* 你也可以直接在跑着扩展的 VS Code 窗口按下重载快捷键（Mac 上 `Cmd+R` 或 `Ctrl+R`）以加载你的最新代码变更。

## 探索 API

* 你可以在打开 `node_modules/@types/vscode/index.d.ts` 文件时查看我们提供的完整 API 接口集合。

## 运行测试用例

* 安装 [Extension Test Runner](https://marketplace.visualstudio.com/items?itemName=ms-vscode.extension-test-runner) 插件
* 通过 **Tasks: Run Task** 命令运行 "watch" 任务。请确保这个任务跑在后台，否则测试代码的改动可能无法被监测并编译触发。
* 从侧边栏打开测试 (Testing) 视图并且点击运行测试 (Run Test) 按钮，或者直接使用快捷键 `Ctrl/Cmd + ; A`
* 在测试结果 (Test Results) 视图检查测试输出的面板。
* 对 `src/test/extension.test.ts` 做出修改或在 `test` 目录下新增用例文件。
  * 默认提供的测试运行器只会去读取匹配了 `**.test.ts` 命名规则的文件。
  * 你可以在 `test` 文件夹内部随意创建文件夹来结构化组织你的用例们。

## 走得更远

* 通过对扩展进行 [打包压缩](https://code.visualstudio.com/api/working-with-extensions/bundling-extension) 减小成品体积并显著改善启动时间。
* [发布你的扩展](https://code.visualstudio.com/api/working-with-extensions/publishing-extension) 到 VS Code 官方的扩展市场供全世界使用。
* 编写配置以使用 [持续集成 (CI)](https://code.visualstudio.com/api/working-with-extensions/continuous-integration) 实现自动化构建发布工作。
