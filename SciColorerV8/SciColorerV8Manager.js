$engine JScript
$uname SciColorerV8Manager
$dname SciColorerV8 Manager
$addin stdcommands

function macros_ПриКликеПоГиперссылке(){ //предопределенная, вызывается при Ctrl+Click на любом идентификаторе в тексте модуля
    addins.byUniqueName("SnegopatMainScript").invokeMacros("ПерейтиКОпределению")
}

function macros_ПриКонтекстномМенюНаНомерахСтрок(){ //предопределенная, вызывается при правом клике на номерах строк
    addins.byUniqueName("SciColorerV8").invokeMacros("_РазвернутьВсе"); // например
}

function macrosОтключитьАвтосравнениеДляТекущегоОкнаОтладка(){
    addins.byUniqueName("SciColorerV8").invokeMacros("_ОтключитьАвтосравнениеДляТекущегоОкна")
}

SelfScript.self['macrosСвернуть или развернуть текущий блок'] = function() {
    addins.byUniqueName("SciColorerV8").invokeMacros("_СвернутьРазвернутьТекущийБлок")
}

SelfScript.self['macrosСвернуть все'] = function()
{
    addins.byUniqueName("SciColorerV8").invokeMacros("_СвернутьВсе")
}

SelfScript.self['macrosРазвернуть все'] = function()
{
    addins.byUniqueName("SciColorerV8").invokeMacros("_РазвернутьВсе")
}

SelfScript.self['macrosПрокрутка строки вверх'] = function()
{
    addins.byUniqueName("SciColorerV8").invokeMacros("_ПрокруткаСтрокиВверх")
}

SelfScript.self['macrosПрокрутка строки вниз'] = function()
{
    addins.byUniqueName("SciColorerV8").invokeMacros("_ПрокруткаСтрокиВниз")
}

SelfScript.self['macrosСброс модифицированности строк'] = function()
{
    addins.byUniqueName("SciColorerV8").invokeMacros("_СбросМодифицированныхСтрок")
}

function macrosНастройка(){
    addins.byUniqueName("SciColorerV8").invokeMacros("_Настройка")
}

function getPredefinedHotkeys(predef)
{
    predef.setVersion(3)
    predef.add("Свернуть или развернуть текущий блок", "Ctrl + NumAdd")
    predef.add("Свернуть или развернуть текущий блок", "Ctrl + Num-")
    predef.add("Развернуть все", "Ctrl + Shift + NumAdd")
    predef.add("Свернуть все", "Ctrl + Shift + Num-")
    predef.add("Прокрутка строки вверх", "Ctrl + Up")
    predef.add("Прокрутка строки вниз", "Ctrl + Down")
}
