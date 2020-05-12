// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let dis1 = vscode.commands.registerTextEditorCommand("grep.findRaw",async (textEdit,edit) => {
		//获取输入的需要查找的原始文本
		var out = vscode.window.showInputBox();
		let searhStr = await out.then<string|undefined>(function (s:string|undefined):string|undefined{
			return s;
		});

		if(searhStr != undefined){
			//文本查找
			var text:string[] = [];
			for(let i=0;i<textEdit.document.lineCount;++i){
				let currentText = textEdit.document.lineAt(i).text;
				if(currentText.includes(searhStr)){
					text.push(currentText);
				}
			}

			//写入新文件展示结果
			await vscode.commands.executeCommand("workbench.action.files.newUntitledFile");
			let s = text.join("\n");
			let newEdit = vscode.window.activeTextEditor
			console.log(newEdit?.document.fileName);
			if(newEdit){
				newEdit.edit((edit:vscode.TextEditorEdit) => {
					if(newEdit){
						edit.insert(new vscode.Position(newEdit.document.lineCount,0), s);
					}
				});
			}
		}
	});

	let dis2 = vscode.commands.registerTextEditorCommand("grep.findReg",(textEdit,edit) => {
		var out = vscode.window.showInputBox();
		out.then<string>(function (a:string|undefined):string{
			if(a){
				const allText = textEdit.document.getText();
				vscode.window.showInformationMessage(a+textEdit.document.getText());
			}

			return "resolve";
		});
	})

	context.subscriptions.push(dis1);
	context.subscriptions.push(dis2);
}

// this method is called when your extension is deactivated
export function deactivate() {}
