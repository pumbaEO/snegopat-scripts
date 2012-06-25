$engine JScript
$uname SciColorerV8Manager
$dname SciColorerV8 Manager
$addin stdcommands

function macrosOnHyperLinkClick(){ //вызывается при Ctrl+Click на любом идентификаторе в тексте модуля
    addins.byUniqueName("SnegopatMainScript").invokeMacros("ПерейтиКОпределению")
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

function macrosПрокруткаСтрокиВверх()
{
    addins.byUniqueName("SciColorerV8").invokeMacros("Прокрутка строки вверх")
}

function macrosПрокруткаСтрокиВниз()
{
    addins.byUniqueName("SciColorerV8").invokeMacros("Прокрутка строки вниз")
}

function getPredefinedHotkeys(predef)
{
    predef.setVersion(2)
    predef.add("СвернутьРазвернутьГруппу", "Ctrl + NumAdd")
    predef.add("РазвернутьВсе", "Ctrl + Shift + NumAdd")
    predef.add("СвернутьВсе", "Ctrl + Shift + Num-")
    predef.add("ПрокруткаСтрокиВверх", "Ctrl + Up")
    predef.add("ПрокруткаСтрокиВниз", "Ctrl + Down")
}
