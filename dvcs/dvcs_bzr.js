$engine JScript
$uname dvcs_bzr
$dname Backend к bzr
$addin extfiles
$addin stdlib
$addin vbs

// (c) Сосна Евгений sheneja at sosna.zp.ua
// Скрипт - Backend к bzr для отображения версионного контроля. 
//

var FSO = new ActiveXObject("Scripting.FileSystemObject");
var ForReading = 1, ForWriting = 2, ForAppending = 8;
var WshShell = new ActiveXObject("WScript.Shell");
var TempDir = WshShell.ExpandEnvironmentStrings("%temp%") + "\\";

extfiles.registerDVCSBackend("fossil", Backend_bzrl)

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

//для bzr комманды
// 1. Статус файлов: 

function getStatusForCatalog(pathToCatalog, ValueTablesFiles) {
            
            
    
        return true
}
function getFilePathToDiff(param1, param2) {
    // возвращать будем структру, path1 и path2 
    var ValueTablesFiles = param1["ValueTablesFiles"]
    var лТекСтрока = param1["Row"]
    if (лТекСтрока.КартинкаСтатус > 1) return false

    var StructureToFind = v8New("Structure");
    var лКаталог ="";
    
    param2.insert("path1", "Path1");
    param2.insert("path2", "Path2");
    
    
    return true
}
function Backend_bzr(command, param1, param2) {
    if (command == "STATUS") return getStatusForCatalog(param1, param2)
    if (command == "DIFF") return getFilePathToDiff(param1, param2)
}
