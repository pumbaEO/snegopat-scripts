$engine JScript
$uname dvcs_fossil
$dname Backend к fossil
$addin extfiles
$addin stdlib
$addin vbs

// (c) Сосна Евгений sheneja at sosna.zp.ua
// Скрипт - Backend к fossil для отображения версионного контроля. 
//

//var attrTypeCategory        = "{30E571BC-A897-4A78-B2E5-1EA6D48B5742}"

var FSO = new ActiveXObject("Scripting.FileSystemObject");
var ForReading = 1, ForWriting = 2, ForAppending = 8;
var WshShell = new ActiveXObject("WScript.Shell");
var TempDir = WshShell.ExpandEnvironmentStrings("%temp%") + "\\";

extfiles.registerDVCSBackend("fossil", Backend_fossil)

function getStatusForCatalog(pathToCatalog, ValueTablesFiles) {
            
            
            WshScriptExec=WshShell.Exec("cmd.exe /K /C");
            WshScriptExec.StdIn.WriteLine("chcp 1251 > null");
            WshScriptExec.StdIn.WriteLine(pathToCatalog.substr(0,2));
            WshScriptExec.StdIn.WriteLine('cd "' +pathToCatalog +'"');
            WshScriptExec.StdIn.WriteLine("fossil status");
            WshScriptExec.StdIn.WriteLine("echo NOTVERSIONED");
            WshScriptExec.StdIn.WriteLine("fossil extras");
            WshScriptExec.StdIn.WriteLine("echo ENDNOTVERSIONED");
            WshScriptExec.StdIn.WriteLine("exit > null");
            var array = [];

            //Message(" array <" + array + ">");
            var isNotVers = false;
            while (!WshScriptExec.StdOut.AtEndOfStream)
            {
                var filename = "";
                var r = WshScriptExec.StdOut.ReadLine();
                //Message(""+r)
                //FIXME: добавить регулярку. 
                if (r.indexOf('EDITED')!=-1)
                {
                    filename = r.split('     ')[1]
                    array.push(filename)
                    newItem = ValueTablesFiles.Add();
                    newItem.Catalog = pathToCatalog;
                    newItem.FullFileName = FSO.BuildPath(pathToCatalog, filename.replace('/', '\\'));
                    newItem.Status = "EDITED";
                    continue;
                }
                if (r.indexOf('MISSING')!=-1) 
                    {
                        filename = r.split('    ')[1]
                        array.push(filename)
                        newItem = ValueTablesFiles.Add();
                        newItem.Catalog = pathToCatalog;
                        newItem.FullFileName = FSO.BuildPath(pathToCatalog, filename.replace('/', '\\'));
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
                    newItem.FullFileName = FSO.BuildPath(pathToCatalog, r.replace('/', '\\'));
                    newItem.Status = 'NOTVERSIONED';
                    }
                }
    
        return true
}
function getFilePathToDiff(param1, param2) {
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
    var r = "";
    var ver1 = null
    var ver2 = null
    var ver1sha1 = null
    var ver2sha1 = null

    WshScriptExec=WshShell.Exec("cmd.exe /K /C");
    WshScriptExec.StdIn.WriteLine("chcp 1251 > null");
    r = WshScriptExec.StdOut.ReadLine();
    //Message(r);
    WshScriptExec.StdIn.WriteLine(лКаталог.substr(0,2));
    //r = WshScriptExec.StdOut.ReadLine();
    r = WshScriptExec.StdOut.ReadLine();
    WshScriptExec.StdIn.WriteLine('cd "' +лКаталог +'"');
    //r = WshScriptExec.StdOut.ReadLine();
    r = WshScriptExec.StdOut.ReadLine();
    //Message(r);
    WshScriptExec.StdIn.WriteLine("fossil finfo -b --limit 2 "+лТекСтрока.ИмяФайла);
    //r = WshScriptExec.StdOut.ReadLine();
    //Message("if 1");
    while(!WshScriptExec.StdOut.AtEndOfStream) {
        r = WshScriptExec.StdOut.ReadLine();
        //Message(r);
        if (r.indexOf('finfo')!=-1) break
    }
    if (!WshScriptExec.StdOut.AtEndOfStream) {
        r = WshScriptExec.StdOut.ReadLine();
        //Message(r);
        ver1 = r.split(' ')[0]
        //Message("ver 1 is "+ver1);
        if (!WshScriptExec.StdOut.AtEndOfStream) {
            r = WshScriptExec.StdOut.ReadLine();
            //Message(r);
            ver2 = r.split(' ')[0]
            //Message("ver 2 is "+ver2);
        }
    }

    if (ver1!=null || ver1!='') {
        WshScriptExec.StdIn.WriteLine("fossil artifact "+ver1);
        WshScriptExec.StdIn.WriteLine("echo NEXT")
        while(!WshScriptExec.StdOut.AtEndOfStream) {
            r = WshScriptExec.StdOut.ReadLine();
            if (r.indexOf('artifact')!=-1) break
        }
        while (!WshScriptExec.StdOut.AtEndOfStream) 
        {
            r = WshScriptExec.StdOut.ReadLine();
            //Message(r);
            if (r.indexOf('NEXT')!=-1) break
            var ar = r.split(' ')
            //Message("array "+ar);
            if (ar[0] == "F") //Работаем с файлом...
            {
                filename = ar[1]
                filenameToSearch = лТекСтрока.ИмяФайла
                filenameToSearch = filenameToSearch.substr(лКаталог.length+1, filenameToSearch.length - лКаталог.length);
                filenameToSearch = filenameToSearch.replace('\\','/')
                //Message("Ищем "+filename+" 1c "+filenameToSearch);
                if (filename == filenameToSearch)  //Ура нашли... 
                {
                    ver1sha1 = ar[2]
                    //Message("Нашли  "+ver1sha1);
                }
            }


        }
    }
    //r = WshScriptExec.StdOut.ReadLine();
    //Message("вышли из цикла...");
    // if (ver2!=null) {
    // 	WshScriptExec.StdIn.WriteLine("fossil artifact "+ver2);
    // 	while (!WshScriptExec.StdOut.AtEndOfStream) 
    // 	{
    // 		r = WshScriptExec.StdOut.ReadLine();
    // 		var ar = r.split(' ')
    // 		if (ar[0] == "F") //Работаем с файлом...
    // 		{
    // 			filename = ar[1]
    // 			filenameToSearch = лТекСтрока.ИмяФайла
    // 			filenameToSearch = filenameToSearch.substr(лКаталог.length+1, filenameToSearch.length - лКаталог.length);
    // 			filenameToSearch = filenameToSearch.replace('\\','/')
    // 			if (filename.indexOf(filenameToSearch!=-1))  //Ура нашли... 
    // 			{
    // 				ver2sha1 = ar[2]
    // 			}
    // 		}
    // 	}
    // }

    if (ver1 == null || ver1 == "") {Message("ver 1 не нашли ничего"); return ;}
    //var file1ToDiff = FSO.BuildPath(TempDir, ver1+лТекСтрока.Имя+'.'+лТекСтрока.Расширение)
    var file1ToDiff = FSO.BuildPath(TempDir, ver1+лТекСтрока.Имя)
    WshScriptExec.StdIn.WriteLine("fossil test-content-rawget "+ver1sha1 + " "+file1ToDiff);
    r = WshScriptExec.StdOut.ReadLine();
    if (лТекСтрока.КартинкаСтатус == 1)
    {
        Path1 = file1ToDiff;
        Path2 = лТекСтрока.ИмяФайла;
    }
    else {
        if (ver2sha1 == null) {
            Message("ver 2 не существует не с чем сравнивать")
            return false
        }
        var file2ToDiff = FSO.BuildPath(TempDir, ver2+лТекСтрока.Имя+'.'+лТекСтрока.Расширение)
        WshScriptExec.StdIn.WriteLine("fossil test-content-rawget "+ver2sha1 + " "+file2ToDiff);
        r = WshScriptExec.StdOut.ReadLine();
        Path1 = file2ToDiff;
        Path2 = file1ToDiff;
    }
    //debugger;
    param2.insert("path1", Path1);
    param2.insert("path2", Path2);
    //param2["path2"] = Path2
    WshScriptExec.StdIn.WriteLine("exit")
    WshScriptExec.StdOut.Read(0);
    return true
}
function Backend_fossil(command, param1, param2) {
    if (command == "STATUS") return getStatusForCatalog(param1, param2)
    if (command == "DIFF") return getFilePathToDiff(param1, param2)
}
