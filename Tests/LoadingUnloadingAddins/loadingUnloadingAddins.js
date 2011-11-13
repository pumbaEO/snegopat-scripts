$engine JScript
$dname Тест загрузки/выгрузки аддинов

/*
Это запускаемый вручную тест для диагностики причин ошибки с выгрузкой в аддинов в
окне Снегопата (скрипта snegopatwnd.js).

Ошибка заключается в следующем:

если загрузить программно несколько скриптов-аддинов, а потом все их выгрузить, то
в дереве аддинов останется строка с последним (по порядку загрузки) аддином,
но сам аддин будет выгружен.

Воспроизведение ошибки:

1. Выполнить макрос "ЗагрузитьАддины".
2. Убедиться, что в ветке "Тест загрузки/выгрузки скриптов" появились строки для аддинов s1 и s2.
3. Выполнить макрос "ВыгрузитьАддины"
4. Смотрим в ветку "Тест загрузки/выгрузки скриптов", в ней осталась строка с аддином s2.

Ожидается (правильное поведение): 
после выполнения макроса "ВыгрузитьАддины" ветка "Тест загрузки/выгрузки скриптов" будет пуста.

*/

var dynLibGroup = libGroupByName("Тест загрузки/выгрузки скриптов");

//var scriptNamesToLoad = ['s1', 's2'];
var scriptNamesToLoad = ['s1'];
var scriptsDir = v8New("File", SelfScript.fullPath).Path;    

function macrosЗагрузитьАддины()
{    
    for (var i=0; i<scriptNamesToLoad.length; i++)
    {
        //debugger;
        addins.loadAddin('script:' + scriptsDir + scriptNamesToLoad[i] + '.js', dynLibGroup);
    }
}

function macrosВыгрузитьАддины()
{
    for (var i=0; i<scriptNamesToLoad.length; i++)
    {
        addins.unloadAddin(addins.byUniqueName(scriptNamesToLoad[i]));
        debugger;        
    }
}

function libGroupByName(libGroupName)
{
    var libGroup = addins.root.child;               
    var libFound = false;

    while (libGroup)
    {
        if (libGroup.name == libGroupName)
        {
            libFound = true;
            break
        }
        
        libGroup = libGroup.next;
    }

    if (!libFound)
        libGroup = addins.root.addGroup(libGroupName);

    return libGroup;
}