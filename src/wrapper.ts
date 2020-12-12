import {
	workspace,
	ExtensionContext,
	commands,
	window,
	QuickPickItem,
	SnippetString
} from 'vscode';

interface WrapItem
{
	label: string;
	description?: string;
	detail?: string;
	snippet: string;
	disabled?: boolean;
}

interface WrapperConfig
{
	[key: string]: WrapItem;
}

function getWrapperConfig(): WrapperConfig
{
	let config = workspace.getConfiguration("wrap");
	const items = <WrapperConfig>config.get("with", {});
	const custom = <WrapperConfig>config.get("custom", {});

	return {...items, ...custom};
}

const wrapperConfig = getWrapperConfig();

function getEnabledWrapperItems()
{
	const items: WrapItem[] = [];
	Object.keys(wrapperConfig).forEach(wrapperItemKey => {
		const wrapperItem: WrapItem = wrapperConfig[wrapperItemKey];
		if (!wrapperItem.disabled)
		{
			items.push(wrapperItem);
		}
	});

	return items;
}

function getQuickPickItems(wrapperItems: WrapItem[])
{
	const items: QuickPickItem[] =[];
	wrapperItems.forEach(wrapperItem => {
		if(!wrapperItem.disabled)
		{
			const {label, description} = wrapperItem;
			items.push({
				label,
				description
			});
		}
	});

	return items;
}

function showQuickPick(item: QuickPickItem, wrapperItems: WrapItem[])
{
	let activeEditor = window.activeTextEditor;
	if(activeEditor && item)
	{
		let wrapperItem = wrapperItems.find(s => item.label === s.label);
		if(wrapperItem)
		{
			activeEditor.insertSnippet(
				new SnippetString(wrapperItem.snippet)
			);
		}
	}
}

function showWrapItem(key: string)
{
	if(window.activeTextEditor && wrapperConfig[key])
	{
		const wrapperItem: WrapItem = wrapperConfig[key];
		window.activeTextEditor.insertSnippet(
			new SnippetString(wrapperItem.snippet)
		);
	}
}

function registerCommands(context: ExtensionContext)
{
	commands.getCommands().then(cmdWrapperList => {
		Object.keys(wrapperConfig).forEach(key => {
			const cmdText =  `wrap.with.${key}`;
			if (cmdWrapperList.indexOf(cmdText) === -1) {
				context.subscriptions.push(
				  commands.registerCommand(cmdText, () => {
					showWrapItem(key);
				  })
				);
			}
		});
	});
}

export function activate(context: ExtensionContext) {
	
	let quickPickItems: QuickPickItem[];
	let wrapperItems: WrapItem[] = [];

	function update()
	{
		wrapperItems = getEnabledWrapperItems();
		quickPickItems = getQuickPickItems(wrapperItems);
		registerCommands(context);
	}

	workspace.onDidChangeConfiguration(() => {
		update();
	});

	update();

	let disposable = commands.registerTextEditorCommand("wrap.with", editor => {
		if(editor.document.languageId !== 'blade')
		{
			return
		}
		
		window.showQuickPick(quickPickItems).then(item => {
			if (item)
			{
				showQuickPick(item, wrapperItems);
			}
		});
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}
