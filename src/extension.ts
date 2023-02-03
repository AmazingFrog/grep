// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json

	let grepFindRaw = vscode.commands.registerTextEditorCommand("grep.findRaw", async (textEdit, edit) => {
		//获取输入的需要查找的原始文本
		let out = vscode.window.showInputBox();
		let searhStr = await out.then<string | undefined>(function (s:string | undefined): string | undefined {
			return s;
		});

		if(searhStr == undefined) {
			return;
		}

		let text: string[] = [];
		//文本查找
		for(let i=0;i<textEdit.document.lineCount;++i) {
			let currentText = textEdit.document.lineAt(i).text;
			if(currentText.includes(searhStr)) {
				text.push(currentText);
			}
		}

		showRes(text);
	});

	let grepFindReg = vscode.commands.registerTextEditorCommand("grep.findReg",async (textEdit, edit) => {
		//获取正则文本
		let out = vscode.window.showInputBox();
		let regStr = await out.then<string | undefined>(function (s:string | undefined): string | undefined {
			return s;
		});

		if(regStr == undefined) {
			return;
		}

		let reg: RegExp = new RegExp("");
		let pattern: string = "";
		let attr: string = "";

		// 判断一下合法性
		// 如果存在单个斜杠的话, 认为正则错误
		if(!isRegValid(regStr)) {
			vscode.window.showInformationMessage("illegal single slash");
			return;
		}
			
		// 判断是简单的正则还是 /pattern/attributes 模式的正则
		let preixSlashNum = 0;
		while(preixSlashNum < regStr.length && regStr.charAt(preixSlashNum++) == '/');
		--preixSlashNum;
		// 判断前导斜杠的数量如果是单数的话, 那么正则是 /pattern/attributes 的模式
		// 因为前提是如果要匹配 单斜杠(/) 则用 双斜杠(//) 代替且前导斜杠为单数
		// 所以第一个斜杠是匹配 /pattern/attributes 中的第一个斜杠
		if((preixSlashNum & 1) == 1) {
			// 找一下有没有 /pattern/attributes 中的属性字符
			// 和前导斜杠类似, 先找到最后一个斜杠, 然后判断有多少个斜杠相连
			let suffixSlashPos = regStr.lastIndexOf("/");
			let suffixSlashNum = 0;
			while(suffixSlashPos >= 0 && regStr.charAt(suffixSlashPos) == '/') {
				++suffixSlashNum;
				--suffixSlashPos;
			}

			regStr = regStr.replace(new RegExp("//", "g") , "/");
			// 判断一下有没有和前导斜杠相连
			if(suffixSlashPos == -1) {
				pattern = regStr.substring(1);
			}
			// 如果后缀斜杠的数量为单数, 则匹配上 /pattern/attributes 中的第二个斜杠
			else if((suffixSlashNum & 1) == 1) {
				pattern = regStr.substring(1, regStr.lastIndexOf("/"));
				attr = regStr.substring(regStr.lastIndexOf("/")+1);
			}
			else {
				pattern = regStr.substring(1);
			}
		}
		else {
			regStr = regStr.replace(new RegExp("//", "g") , "/");
			pattern = regStr;
		}
			
		// 简化attr
		attr = attr.toLowerCase();
		let has: number[] = [0, 0, 0];
		for(let i=0;i<attr.length;++i) {
			if(attr.charAt(i) == 'i') {
				has[0] = 1;
			}
			else if(attr.charAt(i) == 'g') {
				has[1] = 1;
			}
			else if(attr.charAt(i) == 'm') {
				has[2] = 1;
			}
		}
		let simpleAttr: string = "".concat(has[0]==1?"i":"", has[1]==1?"g":"", has[2]==1?"m":"");

		//正则文本查找
		let text: string[] = [];
		reg = new RegExp(pattern, simpleAttr);
		for(let i=0;i<textEdit.document.lineCount;++i) {
			let currentText = textEdit.document.lineAt(i).text;
			if(reg.test(currentText)) {
				text.push(currentText);
			}
		}

		showRes(text);
	});

	context.subscriptions.push(grepFindRaw);
	context.subscriptions.push(grepFindReg);
}

// this method is called when your extension is deactivated
export function deactivate() {}

function isRegValid(str: string) : boolean {
	if(RegExp("^/.*/?[igm]{0,3}$").test(str)) {
		return true;
	}

	let slashNum = 0;
	for(let i=0;i<str.length;++i) {
		if(str.charAt(i) == '/') {
			++slashNum;
		}
		else {
			if(slashNum == 1) {
				return false;
			}
			slashNum = 0;
		}
	}
	return slashNum != 1;
}

async function showRes(text: string[]) {
	if(text.length == 0) {
		vscode.window.showInformationMessage("no matches found");
	}
	else {
		//写入新文件展示结果
		await vscode.commands.executeCommand("workbench.action.files.newUntitledFile");
		let s = text.join("\n");
		let newEdit = vscode.window.activeTextEditor;
		newEdit?.edit((edit: vscode.TextEditorEdit) => {
			if(newEdit) {
				edit.insert(new vscode.Position(newEdit?.document.lineCount, 0), s);
			}
		});
	}
}
