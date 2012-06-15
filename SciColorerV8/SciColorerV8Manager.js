$engine JScript
$uname SciColorerV8Manager
$dname SciColorerV8 Manager
$addin stdcommands

function macrosOnHyperLinkClick(){ //вызывается при Ctrl+Click на любом идентификаторе в тексте модуля
	stdcommands.Frntend.GoToDefinition.getState()
	stdcommands.Frntend.GoToDefinition.send()
}

function macrosOnLineNumbersContextMenu(){ //вызывается при правом клике на номерах строк
	addins.byUniqueName("SciColorerV8").invokeMacros("Развернуть все"); //например
}
