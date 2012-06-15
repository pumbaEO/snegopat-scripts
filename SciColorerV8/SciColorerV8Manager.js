$engine JScript
$uname SciColorerV8Manager
$dname SciColorerV8 Manager
$addin stdcommands

function macrosOnHyperLinkClick(){ //вызывается при Ctrl+Click на любом идентификаторе в тексте модуля
	stdcommands.Frntend.GoToDefinition.getState()
	stdcommands.Frntend.GoToDefinition.send()
}

function macrosOnLineNumbersContextMenu(){ //вызывается при правом клике на номерах строк
	addins.byUniqueName("SciColorerV8").invokeMacros("Развернуть все"); // например
}

function macrosСвернутьРазвернутьГруппу()
{
	addins.byUniqueName("SciColorerV8").invokeMacros("Свернуть или развернуть текущий блок")
}

function macrosСвернутьВсе()
{
	addins.byUniqueName("SciColorerV8").invokeMacros("Свернуть все")
}

function macrosРазвернутьВсе()
{
	addins.byUniqueName("SciColorerV8").invokeMacros("Развернуть все")
}

function getPredefinedHotkeys(predef)
{
    predef.setVersion(1)
    predef.add("СвернутьРазвернутьГруппу", "Ctrl + NumAdd")
    predef.add("РазвернутьВсе", "Ctrl + Shift + NumAdd")
    predef.add("СвернутьВсе", "Ctrl + Shift + Num-")
}
