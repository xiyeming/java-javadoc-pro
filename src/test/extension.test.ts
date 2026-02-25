import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import { parseMethodSignature } from '../parser';

suite('Parser Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Parse Simple Method', () => {
		const methodText = `public void hello(String name) {`;
		const result = parseMethodSignature(methodText);
		assert.strictEqual(result.returnType, 'void');
		assert.deepStrictEqual(result.params, ['name']);
	});

	test('Parse Complex Generics', () => {
		const methodText = `public IPage<CrsItemVo> getItems(String id, List<String> names)`;
		const result = parseMethodSignature(methodText);
		assert.strictEqual(result.returnType, 'IPage<CrsItemVo>');
		assert.deepStrictEqual(result.params, ['id', 'names']);
	});

	test('Parse Nested Generics', () => {
		const methodText = `protected Map<String, List<Long>> getData(String param) {`;
		const result = parseMethodSignature(methodText);
		assert.strictEqual(result.returnType, 'Map<String, List<Long>>');
		assert.deepStrictEqual(result.params, ['param']);
	});

	test('Parse Primitive Parameters', () => {
		const methodText = `private int calculate(int a, double b) throws Exception`;
		const result = parseMethodSignature(methodText);
		assert.strictEqual(result.returnType, 'int');
		assert.deepStrictEqual(result.params, ['a', 'b']);
	});

	test('Parse Array Types', () => {
		const methodText = `public String[] getNames(int[] ids) {`;
		const result = parseMethodSignature(methodText);
		assert.strictEqual(result.returnType, 'String[]');
		assert.deepStrictEqual(result.params, ['ids']);
	});

	test('Parse Method With Generic Type Declaration', () => {
		const methodText = `public <T> T getBean(Class<T> clazz)`;
		const result = parseMethodSignature(methodText);
		assert.strictEqual(result.returnType, 'T');
		assert.deepStrictEqual(result.params, ['clazz']);
	});

	test('Parse Varargs', () => {
		const methodText = `public void printAll(String... args)`;
		const result = parseMethodSignature(methodText);
		assert.strictEqual(result.returnType, 'void');
		assert.deepStrictEqual(result.params, ['args']);
	});

	test('Parse Annotations before return type', () => {
		const methodText = `public @ResponseBody IPage<CrsItemVo> getItems(String id, List<String> names)`;
		const result = parseMethodSignature(methodText);
		assert.strictEqual(result.returnType, 'IPage<CrsItemVo>');
		assert.deepStrictEqual(result.params, ['id', 'names']);
	});

	test('Parse Constructor', () => {
		const methodText = `public MyClass(String name) {`;
		const result = parseMethodSignature(methodText);
		assert.strictEqual(result.returnType, 'void');
		assert.deepStrictEqual(result.params, ['name']);
	});
});
