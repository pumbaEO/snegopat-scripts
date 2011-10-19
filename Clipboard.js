$engine JScript
$uname Clipboard
$dname Буфер обмена
$addin global

global.connectGlobals(SelfScript)

/* Скрипт для удобной работы через буфер обмена, перехвата открытия файлов для Снегопата и немедленного открытия файлов, если имя файла есть в буфере обмена
 * Автор		: Артур Аюханов aka artbear aartbear@gmail.com
 * Страница скрипта: http://snegopat.ru/scripts/wiki?name=Clipboard.js
 * Дата создания: 19.10.2011
 * Описание		: аналог моего скрипта для Опенконфа в 1С 7.7 - входит в состав скрипта Навигация
    Скрипт "Буфер обмена"
    1. Я часто работаю с файлами с помощью FAR-а следующим образом:
        Нахожу нужный файл в ФАРе, копирую полный путь к файлу в буфер обмена, далее переключаюсь в Конфигуратор, 
        Выполняю действие "Открыть файл", вставляю путь файла из буфера обмена, и нажимаю Открыть для открытия нужного файла в Конфигураторе.
        Уверен, что по такой схеме работаю не я один.
    И вот у меня родилась мысль немного автоматизировать этот процесс:
        разработчик копирует полный путь файла в буфер обмена(тут как обычно), переключается в Конфигуратор, выбирает "Открыть файла",
        а дальше вступает скрипт: перехватывает открытие файла, проверяет буфер обмена, если в буфере имя существующего файла, проверяет расширение этого файла,
        если это файл с разрешенным разрешением для 1С, то скрипт немедленно открывает этот файл в Конфигураторе.
    2. Аналогичным образом перехватывается и автоматизируется действие "Сравнить, объединить с конфигурацией из файла" для файлов конфигураций

    Планы: В настройках скрипта можно будет указать:
        - пользовательская настройка разрешенных расширений открываемых файлов - по умолчанию erf, epf, txt, mxl, html, st, pff
        - немедленное открытие файла при двойном нажатии на файл в ФАР-е или Проводнике и т.п.

    Сделано на базе http://www.forum.script-coding.com/viewtopic.php?id=442

* Требования: Необходима библиотека dynwrapx.dll, ее нужно зарегистрировать
    скачать из ветки http://forum.script-coding.com/viewtopic.php?id=5341 (см. последний пост)

------------------------------------------------------------------------------- */

var _версияСкрипта = 0.3

//Форматы буфера обмена
var CF_TEXT   =1
var CF_UNICODETEXT = 13;

Init();
    //Test();


function Test()
{
    //WScript.Echo("   CopyToClipboard")
testString1 = "тест Артур 4"
CopyToClipboard(testString1)

    //WScript.Echo("   GetFromClipboard")
newTestString = GetFromClipboard()
WScript.Echo(newTestString)

testString1 = "\"C:\\Cmd\\dynwrapx.dll\""
CopyToClipboard(testString1)
newTestString = GetFileNameFromClipboard()
WScript.Echo(newTestString)
}

// Перехват команды. Метод вызывается сначала перед выполнением команды, потом после выполнения (если не отменили)
function hookFileOpenCommand(cmd)
{
    if(cmd.isBefore)
    {
        enableOpen = false;
        selectedFileName = GetFileNameFromClipboard()
        if (selectedFileName.length){
            var file = v8New("Файл", selectedFileName)
            enabledFileExt = массивРасширений.Найти(file.Расширение) != undefined;
            if(!enabledFileExt) return;
            
            enableOpen = true;

            events.connect(Designer, "onSelectFile", SelfScript.self)
            haveHookOnSelectFile = true;
        }
    }
    else if(haveHookOnSelectFile)
    {
        events.disconnect(Designer, "onSelectFile", SelfScript.self)
        haveHookOnSelectFile = false
    }
}
var массивРасширений; // TODO если инициализировать через v8New("Массив"), то далее при использовании будет ошибка :(

var enableOpen = false;
var selectedFileName = "";
var haveHookOnSelectFile = false;

function assert(p1, p2)
{
    if (p1 != p2) 
        throw "Значение <"+p1+"> не равно <"+p2+">, а ожидали равенство";
}
function assertNot(p1, p2)
{
    if (p1 == p2) 
        throw "Значение <"+p1+"> равно <"+p2+">, а ожидали неравенство";
}

// Перехват команды. Метод вызывается сначала перед выполнением команды, потом после выполнения (если не отменили)
function hookCompareAndLoadConfigFromFileCommand(cmd)
{
    if(cmd.isBefore)
    {
        enableOpen = false;
        selectedFileName = GetFileNameFromClipboard()
        if (!selectedFileName.length) return
    
        var file = v8New("Файл", selectedFileName)
        if (file.Расширение == ".cf"){
            Текст = "Использовать файл <"+selectedFileName+"> ?";
            Ответ = Вопрос(Текст, РежимДиалогаВопрос.ДаНет, 0);
            if( Ответ != КодВозвратаДиалога.Нет) {
                enableOpen = true; 
        
                events.connect(Designer, "onSelectFile", SelfScript.self)
                haveHookOnSelectFile = true;
            }
        }
    }
    else if(haveHookOnSelectFile)
    {
        events.disconnect(Designer, "onSelectFile", SelfScript.self)
        haveHookOnSelectFile = false
    }
}

// Обработчик, вызывается когда 1С использует диалог для запроса имени файла.
function onSelectFile(selectFileData) //As ISelectFileData
{
    if(selectFileData.mode != sfOpen) return;
    
    if(!enableOpen || !selectedFileName.length) return;

    selectFileData.addSelectedFile(selectedFileName)
    selectFileData.result = sfrSelected
}

// если в буфере обмена путь к существующему файлу, возвращается этот путь
// если путь обрамлен кавычками, то кавычки отбрасываются
function GetFileNameFromClipboard()
{
    var strText = GetFromClipboard()
    var strText = strText.replace(/(^\s*)|(\s*$)/g, ""); //trim
    if(!strText.length) return ""
    
    if( strText.substr(0,1) == "\"") //InStr(strText, Chr(34)) == 1)
        strText = strText.substr(1)  //Mid(strText, 2)
    if(strText.substr(strText.length-1, 1) == "\"") //InStrRev(strText, Chr(34)) == strText.length)
        strText = strText.substr(0, strText.length-1) //Mid(strText, 1, strText.length - 1)
    
    var file = v8New("Файл", strText)
    if(file.Существует()) 
            // fso = new ActiveXObject("Scripting.FileSystemObject")    
            // if (fso.FileExists(strText))
        return strText
    return ""
}

var dwx;

function Init()
{
    dwx = new ActiveXObject("DynamicWrapperX")
        if (!dwx) throw "Невозможно создать объект DynamicWrapperX";
    dwx.Register ("USER32.DLL", "OpenClipboard", "i=l", "f=s", "r=l");
    dwx.Register ("USER32.DLL", "GetClipboardData", "i=l", "f=s", "r=l");
    dwx.Register("USER32.DLL", "SetClipboardData", "i=uh", "f=s", "r=l")
    dwx.Register("USER32.DLL", "EmptyClipboard", "f=s", "r=l")
    dwx.Register ("USER32.DLL", "CloseClipboard", "f=s", "r=l");
    dwx.Register ("KERNEL32.DLL", "lstrcpy", "i=hs", "f=s", "r=l"); //"lstrcpy", "i=rl", "f=s", "r=l");
    dwx.Register("KERNEL32.DLL", "GlobalAlloc", "i=uu", "f=s", "r=l")
    dwx.Register ("KERNEL32.DLL", "GlobalLock", "i=l", "f=s", "r=l");
    dwx.Register ("KERNEL32.DLL", "GlobalSize", "i=l", "f=s", "r=l");
    dwx.Register ("KERNEL32.DLL", "GlobalUnlock", "i=l", "f=s", "r=l");
    
    // Подпишемся на перехват команды открытия файла
    events.addCommandHandler("{00000000-0000-0000-0000-000000000000}", 2, SelfScript.self, "hookFileOpenCommand")

    // Подпишемся на перехват команды "Сравнить, объединить с конфигурацией из файла"
    events.addCommandHandler("{F10CBB81-F679-11D4-9DD3-0050BAE2BC79}", 6, SelfScript.self, "hookCompareAndLoadConfigFromFileCommand")
    
    // без cf - файла конфигураций !!
    массивРасширений = v8New("Массив")
    массивРасширений.Добавить(".epf");
    массивРасширений.Добавить(".erf");
    массивРасширений.Добавить(".txt");
    массивРасширений.Добавить(".mxl");
    массивРасширений.Добавить(".html");
    массивРасширений.Добавить(".st");
    массивРасширений.Добавить(".pff");
}

function CopyToClipboard(testString)
{
    if (!testString) throw "Передана пустая строка"
    
        var GMEM_FIXED=0
    hGl = dwx.GlobalAlloc(GMEM_FIXED, testString.length+1)
        if (!hGl)  throw "Невозможно выделить память"
    
    hGl = dwx.GlobalLock(hGl)
        if (!hGl)  throw "Невозможно резервировать память"

    hGl = dwx.lstrcpy(hGl, testString) // TODO заменить на метод из DWX
        if (!hGl)  throw "Невозможно скопировать данные в память"

        // res = dwx.GlobalUnlock(hGl)
        // if (!res)  throw "Невозможно разблокировать память"

    try{ 
        hRes = dwx.OpenClipboard(0)
    } catch(e)
    {
        try{
            hRes = dwx.OpenClipboard(0)
        } catch(e)
        {
            if (!hRes)  throw "Невозможно открыть буфер обмена" 
        }
    }

    hRes = dwx.EmptyClipboard()
        if (!hRes)  throw "Невозможно очистить буфер обмена"

    hRes = dwx.SetClipboardData(CF_TEXT, hGl)
        if (!hRes)  throw "Невозможно поместить данные в буфер обмена"

    hRes = dwx.CloseClipboard()
        //if (!hRes)  throw "Невозможно закрыть буфер обмена"
}


function GetFromClipboard()
{
    hRes = dwx.OpenClipboard(0)
    if (!hRes)  throw "Невозможно открыть буфер обмена"

    var hClipText = dwx.GetClipboardData(CF_TEXT); //Получение хэндла данных.
    if (!hClipText)  return ""; //throw "Невозможно GetClipboardData" // TODO 

    ptrText = dwx.GlobalLock(hClipText); //Конвертация хэндла в указатель.
        if (!ptrText)  throw "Невозможно резервировать память";
    
    resStr = dwx.StrGet(ptrText, "s");

    hRes = dwx.GlobalUnlock(hClipText)
        //if (!hRes)  throw "Невозможно разблокировать память"

    hRes = dwx.CloseClipboard(); 
        //if (!hRes)  throw "Невозможно закрыть буфер обмена"
    return resStr;
}

function _GetFromClipboard_UNICODETEXT()
{
    hRes = dwx.OpenClipboard(0)
    if (!hRes)  throw "Невозможно открыть буфер обмена"

        //var format = 0;
        //dwx.Register("USER32.DLL", "EnumClipboardFormats", "i=l", "f=s", "r=l")
        // do{
            // format = dwx.EnumClipboardFormats(0)
            // //if (!res)  throw "Невозможно EnumClipboardFormats"
        // } while(format != 0 && format != CF_TEXT && format != CF_UNICODETEXT)
        
        // if(!format){
            // res = dwx.CloseClipboard()
                //// if (!res)  throw "Невозможно закрыть буфер обмена"
            // return "";
        // }
    var resStr = "";

    if(true) //format == CF_TEXT)
    {
        var hClipText = dwx.GetClipboardData(CF_TEXT); //Получение хэндла данных.
            if (!hClipText)  return ""; //throw "Невозможно GetClipboardData" // TODO 

        ptrText = dwx.GlobalLock(hClipText); //Конвертация хэндла в указатель.
            if (!ptrText)  throw "Невозможно резервировать память";
        
        resStr = dwx.StrGet(ptrText, "s"); // DllCall("msvcrt\memcpy", "Str", resStr, "UInt", PtrText, "UInt", TextLen+1, "Cdecl") ; Текст в переменную.

        hRes = dwx.GlobalUnlock(hClipText)
            //if (!hRes)  throw "Невозможно разблокировать память"
    }
        // else if(format == CF_UNICODETEXT)
        // {
            // var hClipText = dwx.GetClipboardData(CF_UNICODETEXT); //Получение хэндла данных.
                // if (!hClipText)  throw "Невозможно GetClipboardData"
                
                // // PtrTextW :=DllCall("GlobalLock",       "UInt", HmemTextW)
                // // TextLen  :=DllCall("msvcrt\wcslen",    "UInt", PtrTextW, "Cdecl")
                // // VarSetCapacity(resStr, TextLen+1)
                // // DllCall("WideCharToMultiByte", "UInt", CodePage, "UInt", 0, "UInt", PtrTextW 
                                             // // , "Int", TextLen+1, "Str", resStr, "Int", TextLen+1
                                             // // , "UInt", 0, "Int", 0)  ; Конвертация из Unicode в ANSI.
            // hRes = dwx.GlobalUnlock(hClipText)
            // if (!hRes)  throw "Невозможно разблокировать память"
        // }

    hRes = dwx.CloseClipboard(); 
        //if (!hRes)  throw "Невозможно закрыть буфер обмена"
    return resStr;
}

function _GetFromClipboard1()
{
    hRes = dwx.OpenClipboard(0); 

    hClipMemory =  dwx.GetClipboardData(CF_TEXT);
    lSize = dwx.GlobalSize(hClipMemory);

    lpClipMemory = dwx.GlobalLock(hClipMemory);
    var MyString = dwx.Space(lSize, ""); //lSize);
    
    hRes = dwx.lstrcpy(MyString, hClipMemory);

    hRes = dwx.GlobalUnlock(hClipMemory);
    hRes = dwx.CloseClipboard();
    return MyString;
}
