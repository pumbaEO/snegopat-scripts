$engine JScript
$uname dvcs_fossil
$dname Backend к fossil
$addin extfiles
$addin global
$addin stdcommands
$addin stdlib

// (c) Сосна Евгений shenja at sosna.zp.ua
// Скрипт - Backend к fossil для отображения версионного контроля. 
//

global.connectGlobals(SelfScript)

var pfFossilPath                    = "ExtFilesDVCS/fossilpath"
var pfFossilPathBase                = "ExtFilesDVCS/fossilpathbase"
profileRoot.createValue(pfFossilPath, "fossil.exe", pflSnegopat)
profileRoot.createValue(pfFossilPathBase, "", pflBase)

// Настройки для fossil 
var PathToFossil = "";
var мPathToFossilBase = "";
var мPathToFossil  = "";
мPathToFossilBase = profileRoot.getValue(pfFossilPathBase)
мPathToFossil = profileRoot.getValue(pfFossilPath)

if (мPathToFossilBase!=''){
    if (мPathToFossilBase.substr(0,2) == "..") {
        var мPathToFossilBase = fso.GetAbsolutePathName(fso.buildPath(mainFolder, мPathToFossilBase))
        }
    var f = v8New("File", мPathToFossilBase); 
    if (f.Exist()) {
        PathToFossil = мPathToFossilBase;
    }
}
if (PathToFossil=='' && мPathToFossil!='') { //прочтем настройки снегопата
    if (мPathToFossil.substr(0,2) == "..") {
        var мPathToFossil = fso.GetAbsolutePathName(fso.buildPath(mainFolder, мPathToFossil))
        }
    var f = v8New("File", мPathToFossil); 
    if (f.Exist()) {
        PathToFossil = мPathToFossil;
    }
}
if (PathToFossil == '') {
    мPathToFossil = "fossil.exe";
    PathToFossil = мPathToFossil;
}
if (PathToFossil.indexOf(" ")!=-1) {
    PathToFossil = '"'+PathToFossil+'"'
}

var FSO = new ActiveXObject("Scripting.FileSystemObject");
var ForReading = 1, ForWriting = 2, ForAppending = 8;
var WshShell = new ActiveXObject("WScript.Shell");
var TempDir = WshShell.ExpandEnvironmentStrings("%temp%") + "\\";
var mainFolder = profileRoot.getValue("Snegopat/MainFolder")


var мФормаНастройки=null

extfiles.registerDVCSBackend("fossil", Backend_fossil)

function macrosНастройкиFossil(){
    var pathToForm=SelfScript.fullPath.replace(/js$/, 'ssf')
    мФормаНастройки=loadScriptForm(pathToForm, SelfScript.self) // Обработку событий формы привяжем к самому скрипту
    мФормаНастройки.ОткрытьМодально()
}

function мЗаписатьНастройки()
{
    var FossilSnegopat = мФормаНастройки.cmdSnegopat;
    var FossilBase = мФормаНастройки.cmdBase;
    profileRoot.setValue(pfFossilPath, FossilSnegopat)
    profileRoot.setValue(pfFossilPathBase, FossilBase)
}

function НастройкиПриОткрытии()
{
    мФормаНастройки.cmdSnegopat=мPathToFossil
    мФормаНастройки.cmdBase=мPathToFossilBase
}

function cmdSnegopatНачалоВыбора(Элемент, СтандартнаяОбработка) {
    лФайл=мВыбратьФайл()
    if(лФайл=="") return
    Элемент.val.Значение=лФайл
}

function cmdBaseНачалоВыбора(Элемент, СтандартнаяОбработка) {
    лФайл=мВыбратьФайл()
    if(лФайл=="") return
    Элемент.val.Значение=лФайл
}

function КнопкаЗаписатьНажатие(Кнопка) {
    мЗаписатьНастройки();
    мФормаНастройки.Закрыть();
}

function мВыбратьФайл()
{
    ДиалогОткрытияФайла=v8New("ДиалогВыбораФайла", РежимДиалогаВыбораФайла.Открытие)
    //ДиалогОткрытияФайла.ПолноеИмяФайла = ""
    ДиалогОткрытияФайла.Заголовок = "Выберите файл с fossil "
    if(ДиалогОткрытияФайла.Выбрать()==false) return ""
    return ДиалогОткрытияФайла.ПолноеИмяФайла
}

function fossil_test(pathToCatalog) {
    //Заглушка, на проверку каталога. 
    return true
}

function fossil_getStatusForCatalog(pathToCatalog, ValueTablesFiles) {

    var PathToFossilOutput = TempDir + "fossilstatus.txt" // Пишем 1С файл в utf-8, выводим туда статус fossil после этого читаем его. 
    var PathToBatFossil = TempDir + "fossilTrue.bat"
    var TextDoc = v8New("TextDocument");
    TextDoc.AddLine("Временный файл для fossil");
    TextDoc.Write(PathToFossilOutput, "UTF-8")
    var TextDoc = v8New("TextDocument");
    TextDoc.AddLine('cd /d "' +pathToCatalog+'"');
    TextDoc.AddLine(PathToFossil +' status >> "'+PathToFossilOutput+'"');
    TextDoc.AddLine('echo NOTVERSIONED >> "'+PathToFossilOutput+'"');
    TextDoc.AddLine(PathToFossil+' extras >> "'+PathToFossilOutput+'"');
    TextDoc.AddLine('echo ENDNOTVERSIONED >> "'+PathToFossilOutput+'"');
    TextDoc.Write(PathToBatFossil, "cp866");
    ErrCode = WshShell.Run('"'+PathToBatFossil+'"', 0, 1)
            TextDoc.Read(PathToFossilOutput, "UTF-8");
            if (TextDoc.LineCount() == 0) {
                Message ("комманда отработала, но вывод не записался, надо отладить!")
                return false //что то пошло не так. 
            }
            
            var isNotVers = false;
            var i=0;
            for (var i=1; i<=TextDoc.LineCount(); i++)
            {
                var r = TextDoc.GetLine(i);
                //FIXME: добавить регулярку. 
                if (r.indexOf('EDITED')!=-1)
                {
                    filename = r.split('     ')[1]
                    newItem = ValueTablesFiles.Add();
                    newItem.Catalog = pathToCatalog;
                    newItem.FullFileName = FSO.BuildPath(pathToCatalog, filename.replace(/\//g, '\\'));
                    newItem.Status = "EDITED";
                    continue;
                }
                if (r.indexOf('MISSING')!=-1) 
                    {
                        filename = r.split('    ')[1]
                        newItem = ValueTablesFiles.Add();
                        newItem.Catalog = pathToCatalog;
                        newItem.FullFileName = FSO.BuildPath(pathToCatalog, filename.replace(/\//g, '\\'));
                        newItem.Status = "DELETED";
                        continue;
                    }
                if (r.indexOf('NOTVERSIONED')!=-1)  //Тут вручную указываем, просто читаем список файлов.
                    {
                        isNotVers = true;
                    }
                if (isNotVers==true){

                    if (r.indexOf('fossil')!=-1) continue
                
                    if (r.indexOf('ENDNOTVERSIONED')!=-1) { //надеюсь пока, никто не назовет так обработку , может UUID
                        isNotVers = false
                        continue;
                    };
                    newItem = ValueTablesFiles.Add();
                    newItem.Catalog = pathToCatalog;
                    newItem.FullFileName = FSO.BuildPath(pathToCatalog, r.replace(/\//g, '\\'));
                    newItem.Status = 'NOTVERSIONED';
                    }
            }
    
        return true
}

function fossil_getFileAtRevision(pathToCatalog, pathToFile, rev){
    
}

function fossil_getFilePathToDiff(param1, param2) {
    
    var PathToFossilOutput = TempDir + "fossilstatus.txt" // Пишем 1С файл в utf-8, выводим туда статус fossil после этого читаем его. 
    var PathToBatFossil = TempDir + "fossilTrue.bat"
    var TextDoc = v8New("TextDocument");
    TextDoc.Записать(PathToFossilOutput, "UTF-8");
    // возвращать будем структру, path1 и path2 
    var ValueTablesFiles = param1["ValueTablesFiles"]
    var лТекСтрока = param1["Row"]
    if (лТекСтрока.КартинкаСтатус > 1) return false

    var StructureToFind = v8New("Structure");
    var лКаталог ="";
    StructureToFind.Insert("FullFileName", лТекСтрока.ИмяФайла);
    var Rows = ValueTablesFiles.FindRows(StructureToFind);
    if (Rows.Count() > 0 ) 
    {
        лКаталог = Rows.Get(0).Catalog;
    }
    if (лКаталог == '') { //определим текущий ROOT каталог для fossil 
        млКаталог = лТекСтрока.Родитель.ИмяФайла;
        TextDoc.AddLine('cd /d"' +млКаталог +'"')
        TextDoc.AddLine(PathToFossil +' status >> "'+PathToFossilOutput+'"');
        TextDoc.Write(PathToBatFossil, 'cp866');
        ErrCode = WshShell.Run('"'+PathToBatFossil+'"', 0, 1)
        TextDoc.Read(PathToFossilOutput, "UTF-8");
        if (TextDoc.LineCount() == 0) {
            Message ("комманда отработала, но вывод не записался, надо отладить!")
            return false //что то пошло не так. 
        }
        
        var i=0;
        for (var i=1; i<=TextDoc.LineCount(); i++)
        {
            var r = TextDoc.GetLine(i);
            if (r.indexOf("local-root:")!=-1){ // все нашли, теперь 
                млКаталог  = r.split('   ')[1];
                лКаталог = млКаталог.replace(/\//g, '\\');
                лКаталог = лКаталог.substr(0, лКаталог.length-1);
                break;
            }
        }
        TextDoc.Clear();
        TextDoc.Write(PathToFossilOutput, "UTF-8");
    }
    /* 
Пока не забыл, как нам вытащить вариант старый файла...
АлгоритмТаков:
fossil finfo -b test.txt
[CODE]
7704d33278 2012-02-07 Sosna 'blal'
[/CODE]
для первой ревизии 
fossil finfo -p -r 7704d33278 test.txt  > blabla.txt
для второй ревизи
fossil revert -r 7704d33278 test.txt
copy test.txt > blabla.txt
да, да все через одно место....
 */
    var r = ""; // Текущая строка прочитанная
    var ver1 = '' // Номер версии первого файла
    var ver2 = '' // Номер версии второго файла
    var ver1sha1 = '' //sha1 первого файла в базе fossil
    var ver2sha1 = '' //sha1 второго файла в базе fossil 
    
    // Запусим shell и найдем версии файлов. 
    //var TextDoc = v8New("TextDocument");
    TextDoc.Clear();
    TextDoc.AddLine('cd /d "' +лКаталог +'"')
    TextDoc.AddLine(PathToFossil+' finfo -b --limit 2 "'+лТекСтрока.ИмяФайла+'" >> "' +PathToFossilOutput+'"');
    TextDoc.Write(PathToBatFossil, 'cp866');
    
    ErrCode = WshShell.Run('"'+PathToBatFossil+'"', 0, 1)
    TextDoc.Read(PathToFossilOutput, "UTF-8");
    if (TextDoc.LineCount() == 0) {
        Message (" 1 комманда отработала, но вывод не записался, надо отладить!")
        return false //что то пошло не так. 
    }
    if (TextDoc.LineCount() > 0){
        var r = TextDoc.GetLine(1)
        ver1 = r.split(' ')[0]
        if (TextDoc.LineCount() > 1) {
            var r = TextDoc.GetLine(2)
            ver2 = r.split(' ')[0]
        }
        
    }
    TextDoc.Clear();
    TextDoc.Write(PathToFossilOutput, "UTF-8");

    if (ver1 == null || ver1 == "") {Message("ver 1 не нашли ничего"); return ;}
    //var file1ToDiff = FSO.BuildPath(TempDir, ver1+лТекСтрока.Имя+'.'+лТекСтрока.Расширение)
    var file1ToDiff = FSO.BuildPath(TempDir, ver1+лТекСтрока.Имя)
    TextDoc.AddLine('cd /d "' +лКаталог +'"')
    TextDoc.AddLine(PathToFossil+' finfo -p -r '+ver1 + ' "'+лТекСтрока.ИмяФайла + '" > "'+file1ToDiff+'"');
    // Не знаю как на ошибку проверить...
    TextDoc.Write(PathToBatFossil, 'cp866');
    TextDoc.Clear();
    
    ErrCode = WshShell.Run('"'+PathToBatFossil+'"', 0, 1)
    
    if (лТекСтрока.КартинкаСтатус == 1)
    {
        Path1 = file1ToDiff;
        Path2 = лТекСтрока.ИмяФайла;
    }
    else {
        if (ver2 == '') {
            Message("ver 2 не существует не с чем сравнивать")
            return false
        }
        var file2ToDiff = FSO.BuildPath(TempDir, ver2+лТекСтрока.Имя)
        //Эх, не ожидал я от fossil такой подлянки с выводом binary файлов на системах с win...
        // делаем revert -r ревизия файл
        // copy файл -> куда надо
        // fossil undo файл.... 
        TextDoc.AddLine('cd /d "' +лКаталог +'"')
        TextDoc.AddLine(PathToFossil+' revert -r '+ver2 +' "'+лТекСтрока.ИмяФайла +'" ')
        TextDoc.AddLine('copy /Y "'+лТекСтрока.ИмяФайла +'" "'+file2ToDiff+'"')
        TextDoc.AddLine(PathToFossil+' undo "'+лТекСтрока.ИмяФайла +'" ')
        TextDoc.Write(PathToBatFossil, 'cp866');
        TextDoc.Clear();
        
        ErrCode = WshShell.Run('"'+PathToBatFossil+'"', 0, 1)
        
        Path1 = file2ToDiff;
        Path2 = file1ToDiff;
    }
    param2.insert("path1", Path1);
    param2.insert("path2", Path2);
    
    return true
} //getFilePathToDiff


function fossil_add(pathToCatalog, pathToFile) {
    var f = v8New("File", pathToFile);
    if (!f.Exist()) {
        pathToFile = '.'
    } else {
        pathToFile = '"'+pathToFile+'"'
    }
    var PathToFossilOutput = TempDir + "fossilstatus.txt" // Пишем 1С файл в utf-8, выводим туда статус fossil после этого читаем его. 
    var PathToBatFossil = TempDir + "fossilTrue.bat"
    var TextDoc = v8New("TextDocument");
    TextDoc.AddLine('cd /d "'+pathToCatalog+'"')
    TextDoc.AddLine(PathToFossil +' add ' +pathToFile);
    TextDoc.Write(PathToBatFossil, 'cp866');
    TextDoc.Clear();
        
    ErrCode = WshShell.Run('"'+PathToBatFossil+'"', 0, 1)
    return ErrCode
}

function fossil_run(pathToCatalog, pathToFile){
    if (pathToCatalog == '') {
        Message("Не обнаружен каталог")
        return false
    }
    ЗапуститьПриложение("cmd.exe", pathToCatalog); //сюда можно придумать какой либо gui для работы с fossil
}

function Backend_fossil(command, param1, param2) {
    var result = false;
    switch (command) 
    {
    case "STATUS":
        // Добавляем в хвост подпись.
        result = fossil_getStatusForCatalog(param1, param2);
        break;
        
    case "DIFF":
        result = fossil_getFilePathToDiff(param1, param2)
        break;
        
    case "ADD":
        result = fossil_add(param1, param2)
        break;
        
    case "TEST":
        result = fossil_add(param1, param2)
        break;
    case "RUN":
        result = fossil_run(param1, param2)
        break;
    
    }
    return result
}
