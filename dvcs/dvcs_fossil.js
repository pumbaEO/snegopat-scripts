$engine JScript
$uname dvcs_fossil
$dname Backend к fossil
$addin extfiles
$addin global
$addin stdcommands
$addin stdlib

// (c) Сосна Евгений sheneja at sosna.zp.ua
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
/** Возвращает текст sText преобразованный из кодировки sSrcCharset (по ум. windows-1251) в UTF-8
 * Обязателен только 1-й параметр 
 */
function sToUTF8(sText, bWithBOM, sSrcCharset) {
  if (!sSrcCharset) sSrcCharset = "windows-1251"; //Для ADODB.Stream default - Unicode. Еще можно KOI8-R, cp866
  sText += "";
  with (new ActiveXObject("ADODB.Stream")) { //http://www.w3schools.com/ado/ado_ref_stream.asp
    type = 2; //Binary 1, Text 2 (default) 
    mode = 3; //Permissions have not been set 0,  Read-only 1,  Write-only 2,  Read-write 3,  
    //Prevent other read 4,  Prevent other write 8,  Prevent other open 12,  Allow others all 16
    charset = "utf-8";
    open();
    writeText(sText);
    position = 0;
    charset = sSrcCharset;
    var nPos = bWithBOM ? 0 : 3;
    return readText().substr(nPos);
  }
}

/** Возвращает текст sText преобразованный из кодировки UTF-8 () в windows-1251. 
 * Или наоборот - из 1251 в UTF-8 - если флаг bInsideOut равен true.
 */
function sUTFToWin(sText, bInsideOut) {
  var aCharsets = ["windows-1251", "utf-8"];
  sText += "";
  bInsideOut = bInsideOut ? 1 : 0;
  with (new ActiveXObject("ADODB.Stream")) { //http://www.w3schools.com/ado/ado_ref_stream.asp
    type = 2; //Binary 1, Text 2 (default) 
    mode = 3; //Permissions have not been set 0,  Read-only 1,  Write-only 2,  Read-write 3,  
    //Prevent other read 4,  Prevent other write 8,  Prevent other open 12,  Allow others all 16
    charset = aCharsets[bInsideOut];
    open();
    writeText(sText);
    position = 0;
    charset = aCharsets[1 - bInsideOut];
    return readText();
  }
}

/** Возвращает текст sText преобразованный из кодировки cp866 (DOS) в windows-1251. 
 * Или наоборот - из 1251 в DOS - если bInsideOut true.
 */
function sDOS2Win(sText, bInsideOut) {
  var aCharsets = ["windows-1251", "cp866"];
  sText += "";
  bInsideOut = bInsideOut ? 1 : 0;
  with (new ActiveXObject("ADODB.Stream")) { //http://www.w3schools.com/ado/ado_ref_stream.asp
    type = 2; //Binary 1, Text 2 (default) 
    mode = 3; //Permissions have not been set 0,  Read-only 1,  Write-only 2,  Read-write 3,  
    //Prevent other read 4,  Prevent other write 8,  Prevent other open 12,  Allow others all 16
    charset = aCharsets[bInsideOut];
    open();
    writeText(sText);
    position = 0;
    charset = aCharsets[1 - bInsideOut];
    return readText();
  }
}



function getStatusForCatalog(pathToCatalog, ValueTablesFiles) {

    var PathToFossilOutput = TempDir + "fossilstatus.txt" // Пишем 1С файл в utf-8, выводим туда статус fossil после этого читаем его. 
    var PathToBatFossil = TempDir + "fossilTrue.bat"
    var TextDoc = v8New("TextDocument");
    TextDoc.AddLine("Временный файл для fossil");
    TextDoc.Write(PathToFossilOutput, "UTF-8")
    //TextDoc.AddLine("cd /d " +sDOS2Win(pathToCatalog, true));
    var TextDoc = v8New("TextDocument");
    TextDoc.AddLine("cd /d " +pathToCatalog);
    TextDoc.AddLine(PathToFossil +' status >> '+PathToFossilOutput);
    //TextDoc.AddLine('fossil status >> '+sDOS2Win(PathToFossilOutput, true));
    TextDoc.AddLine("echo NOTVERSIONED >> "+PathToFossilOutput);
    TextDoc.AddLine(PathToFossil+" extras >> "+PathToFossilOutput);
    TextDoc.AddLine("echo ENDNOTVERSIONED >> "+PathToFossilOutput);
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

function getFilePathToDiff(param1, param2) {
    
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
        TextDoc.AddLine('"'+PathToFossil +'" status >> "'+PathToFossilOutput+'"');
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
    
    //debugger;
    /* 
Пока не забыл, как нам вытащить вариант старый файла...
1. fossil finfo -b test.txt
Вывод команды 
[CODE]
7704d33278 2012-02-07 Sosna 'blal'
[/CODE]
2. 7704d33278 - это важно...
3. fossil artifact 7704d33278 
Вывод команды 
[CODE]
C 'blal'
D 2012-02-07T16:43:05.990
F new/test2.txt da39a3ee5e6b4b0d3255bfef95601890afd80709
F null da39a3ee5e6b4b0d3255bfef95601890afd80709
F test.txt 577ceb90a97e84bb5083e5027f5ae90abb59d5e1
F ЭкспортНалоговыхНакладных.epf 3d31ccac62731f672a4d52f5ea398d5fd4a85c96
P 77c433f86d69037ea9d4082cfa044d4b7f0d5336
R 75b5f18b20c32b629db78d4868515a9c
U Sosna
Z efeb6f455893cacba3131bb79ea0c9fe
[/CODE]
4. F test.txt 577ceb90a97e84bb5083e5027f5ae90abb59d5e1 - это важно. 
5. 577ceb90a97e84bb5083e5027f5ae90abb59d5e1 - это id в базе.
6. fossil test-content-rawget 577ceb90a97e84bb5083e5027f5ae90abb59d5e1 filename.bla 
В результате мы получаем filename.bla с это ревизией.  */
    var r = ""; // Текущая строка прочитанная
    var ver1 = '' // Номер версии первого файла
    var ver2 = '' // Номер версии второго файла
    var ver1sha1 = '' //sha1 первого файла в базе fossil
    var ver2sha1 = '' //sha1 второго файла в базе fossil 
    
    // Запусим shell и найдем версии файлов. 
    //var TextDoc = v8New("TextDocument");
    TextDoc.Clear();
    //debugger;
    Message(лКаталог);
    TextDoc.AddLine('cd /d "' +лКаталог +'"')
    TextDoc.AddLine('fossil finfo -b --limit 2 "'+лТекСтрока.ИмяФайла+'" >> "' +PathToFossilOutput+'"');
    TextDoc.Write(PathToBatFossil, 'cp866');
    
    ErrCode = WshShell.Run('"'+PathToBatFossil+'"', 0, 1)
    //debugger;
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
    if (ver1!='') {
        //FIXME: в принципе надо сделать одинм bat для ver 1 и ver 2
        TextDoc.AddLine('cd /d"' +лКаталог +'"')
        TextDoc.AddLine('"'+PathToFossil+'" artifact '+ver1 + ' >> "'+PathToFossilOutput+'"');
        TextDoc.AddLine('echo NEXT >> "'+PathToFossilOutput+'"');
        TextDoc.Write(PathToBatFossil, 'cp866');
        
        ErrCode = WshShell.Run('"'+PathToBatFossil+'"', 0, 1)
        
        TextDoc.Read(PathToFossilOutput, "UTF-8");
        if (TextDoc.LineCount() == 0) {
            Message ("2 комманда отработала, но вывод не записался, надо отладить!")
            return false //что то пошло не так. 
            }
        for (var i=1; i<=TextDoc.LineCount(); i++) {
            var r = TextDoc.GetLine(i);
            if (r.indexOf('NEXT')!=-1) break
            var ar = r.split(' ')
            if (ar[0] == "F") //Работаем с файлом...
            {
                filename = ar[1]
                filenameToSearch = лТекСтрока.ИмяФайла
                filenameToSearch = filenameToSearch.substr(лКаталог.length+1, filenameToSearch.length - лКаталог.length);
                filenameToSearch = filenameToSearch.replace(/\\/g,'/')
                if (filename == filenameToSearch)  //Ура нашли... 
                {
                    ver1sha1 = ar[2]
                }
            }
        }
    }
    TextDoc.Clear();
    TextDoc.Write(PathToFossilOutput, "UTF-8");
    if (ver2!='') {
        TextDoc.AddLine('cd /d"' +лКаталог +'"')
        TextDoc.AddLine('"'+PathToFossil+'" artifact '+ver2 + ' >> "'+PathToFossilOutput+'"');
        TextDoc.AddLine('echo NEXT >> "'+PathToFossilOutput+'"');
        TextDoc.Write(PathToBatFossil, 'cp866');
        
        ErrCode = WshShell.Run('"'+PathToBatFossil+'"', 0, 1)
        
        TextDoc.Read(PathToFossilOutput, "UTF-8");
        if (TextDoc.LineCount() == 0) {
            Message ("3 комманда отработала, но вывод не записался, надо отладить!")
            return false //что то пошло не так. 
            }
        for (var i=1; i<=TextDoc.LineCount(); i++) {
            var r = TextDoc.GetLine(i);
            if (r.indexOf('NEXT')!=-1) break
            var ar = r.split(' ')
            if (ar[0] == "F") //Работаем с файлом...
            {
                filename = ar[1]
                filenameToSearch = лТекСтрока.ИмяФайла
                filenameToSearch = filenameToSearch.substr(лКаталог.length+1, filenameToSearch.length - лКаталог.length);
                filenameToSearch = filenameToSearch.replace(/\\/g,'/')
                if (filename == filenameToSearch)  //Ура нашли... 
                {
                    ver2sha1 = ar[2]
                }
            }
        }
    }
    /*for (var i=0; i<TextDoc.LineCount(); i++)
    {
        var r = TextDoc.GetLine(i);
        ver1 = r.split(' ')[0]
        
        
    }
    */
    /*
    WshScriptExec=WshShell.Exec("cmd.exe /K");
    WshScriptExec.StdIn.WriteLine('cd /d"' +sDOS2Win(лКаталог, true) +'"');
    r = WshScriptExec.StdOut.ReadLine();
    WshScriptExec.StdIn.WriteLine("fossil finfo -b --limit 2 "+sDOS2Win(лТекСтрока.ИмяФайла, true) ); // + " >> "+sDOS2Win(PathToFossilOutput, true)  не надо, только получить список. 
    while(!WshScriptExec.StdOut.AtEndOfStream) {
        //r = WshScriptExec.StdOut.ReadLine();
        r = WshScriptExec.StdOut.ReadAll();
        if (r.indexOf('finfo')!=-1) break
    }
    if (!WshScriptExec.StdOut.AtEndOfStream) {
        r = WshScriptExec.StdOut.ReadLine();
        ver1 = r.split(' ')[0]
        if (!WshScriptExec.StdOut.AtEndOfStream) {
            r = WshScriptExec.StdOut.ReadLine();
            ver2 = r.split(' ')[0]
        }
    }
    //Message("fossil artifact ")
    //debugger;
    if (ver1!='') {
        WshScriptExec.StdIn.WriteLine("fossil artifact "+ver1 + " >> "+sDOS2Win(PathToFossilOutput, true));
        WshScriptExec.StdIn.WriteLine("echo NEXT  >> "+sDOS2Win(PathToFossilOutput, true))
        while(!WshScriptExec.StdOut.AtEndOfStream) {
            r = sDOS2Win(WshScriptExec.StdOut.ReadAll());
            //if (r.indexOf('artifact')!=-1) break
        }
        Message("Идем читать самим 1С.")
        
        TextDoc.Read(PathToFossilOutput, "UTF-8");
        if (TextDoc.LineCount() == 0) 
            return false //что то пошло не так. 
        for (var i=0; i<TextDoc.LineCount(); i++) {
            var r = TextDoc.GetLine(i);
            if (r.indexOf('NEXT')!=-1) break
            var ar = r.split(' ')
            if (ar[0] == "F") //Работаем с файлом...
            {
                filename = ar[1]
                filenameToSearch = лТекСтрока.ИмяФайла
                filenameToSearch = filenameToSearch.substr(лКаталог.length+1, filenameToSearch.length - лКаталог.length);
                filenameToSearch = filenameToSearch.replace('\\','/')
                if (filename == filenameToSearch)  //Ура нашли... 
                {
                    ver1sha1 = ar[2]
                }
            }
        }
    }
    //r = WshScriptExec.StdOut.ReadLine();
    //Message("вышли из цикла...");
    TextDoc.AddLine("Временный файл для fossil");
    TextDoc.Записать(PathToFossilOutput, "UTF-8");
    if ( ver2!='') {
        WshScriptExec.StdIn.WriteLine("fossil artifact "+ver2 + " >> "+sDOS2Win(PathToFossilOutput, true));
        WshScriptExec.StdIn.WriteLine("echo NEXT  >> "+sDOS2Win(PathToFossilOutput, true))
        while(!WshScriptExec.StdOut.AtEndOfStream) {
            r = sDOS2Win(WshScriptExec.StdOut.ReadAll());
            //if (r.indexOf('artifact')!=-1) break
        }
        TextDoc.Read(PathToFossilOutput, "UTF-8");
        if (TextDoc.LineCount() == 0) 
            return false //что то пошло не так. 
        for (var i=0; i<TextDoc.LineCount(); i++) {
            var r = TextDoc.GetLine(i);
            if (r.indexOf('NEXT')!=-1) break
            var ar = r.split(' ')
            if (ar[0] == "F") //Работаем с файлом...
            {
                filename = ar[1]
                filenameToSearch = лТекСтрока.ИмяФайла
                filenameToSearch = filenameToSearch.substr(лКаталог.length+1, filenameToSearch.length - лКаталог.length);
                filenameToSearch = filenameToSearch.replace('\\','/')
                if (filename == filenameToSearch)  //Ура нашли... 
                {
                    ver2sha1 = ar[2]
                }
            }
        }    }*/

    if (ver1 == null || ver1 == "") {Message("ver 1 не нашли ничего"); return ;}
    //var file1ToDiff = FSO.BuildPath(TempDir, ver1+лТекСтрока.Имя+'.'+лТекСтрока.Расширение)
    var file1ToDiff = FSO.BuildPath(TempDir, ver1+лТекСтрока.Имя)
    TextDoc.AddLine('cd /d "' +лКаталог +'"')
    TextDoc.AddLine('"'+PathToFossil+'" test-content-rawget '+ver1sha1 + ' >> "'+file1ToDiff+'"');
    // Не знаю как на ошибку проверить...
    TextDoc.Write(PathToBatFossil, 'cp866');
    TextDoc.Clear();
    
    ErrCode = WshShell.Run('"'+PathToBatFossil+'"', 0, 1)
    
    //TextDoc.AddLine('echo NEXT >> "'+PathToFossilOutput+'"');
    //TextDoc.Write(PathToBatFossil, 'cp866');
    //WshScriptExec.StdIn.WriteLine("fossil test-content-rawget "+ver1sha1 + " "+sDOS2Win(file1ToDiff, true));
    //r = WshScriptExec.StdOut.ReadLine();
    if (лТекСтрока.КартинкаСтатус == 1)
    {
        Path1 = file1ToDiff;
        Path2 = лТекСтрока.ИмяФайла;
    }
    else {
        if (ver2sha1 == '') {
            Message("ver 2 не существует не с чем сравнивать")
            return false
        }
        var file2ToDiff = FSO.BuildPath(TempDir, ver2+лТекСтрока.Имя)
        TextDoc.AddLine('cd /d "' +лКаталог +'"')
        TextDoc.AddLine('"'+PathToFossil+'" test-content-rawget '+ver2sha1 + ' >> "'+file2ToDiff+'"');
        // Не знаю как на ошибку проверить...
        TextDoc.Write(PathToBatFossil, 'cp866');
        TextDoc.Clear();
        
        ErrCode = WshShell.Run('"'+PathToBatFossil+'"', 0, 1)
        
        Path1 = file2ToDiff;
        Path2 = file1ToDiff;
    }
    param2.insert("path1", Path1);
    param2.insert("path2", Path2);
    //WshScriptExec.StdIn.WriteLine("exit")
    
    return true
} //getFilePathToDiff

function Backend_fossil(command, param1, param2) {
    if (command == "STATUS") return getStatusForCatalog(param1, param2)
    if (command == "DIFF") return getFilePathToDiff(param1, param2)
}
