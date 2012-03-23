$engine JScript
$uname diff_v8Reader
$dname Backend к diff просмотру (ssf, cf)
$addin global

global.connectGlobals(SelfScript)

var mainFolder = profileRoot.getValue("Snegopat/MainFolder")

var pathTo1C = mainFolder + "\\core\\starter.exe";
var pathToBase = mainFolder + "\\scripts\\dvcs\\basediff";

function diff_v8Reader(Path1, Path2) {
    sBaseDoc = Path1.replace(/\//g, '\\');
    sNewDoc = Path2.replace(/\//g, '\\');
    var tmpfile = ѕолучить»м€¬ременного‘айла("txt");
    var TextDoc = v8New("TextDocument");
    TextDoc.AddLine(sBaseDoc)
    TextDoc.AddLine(sNewDoc)
    TextDoc.Write(tmpfile);
    var FSO = new ActiveXObject("Scripting.FileSystemObject");
    var cmd = '"'+pathTo1C+'" enterprise /RunModeOrdinaryApplication  /F"'+pathToBase+'" /C"'+FSO.GetAbsolutePathName(tmpfile)+'" ' ;
    «апуститьѕриложение(cmd);
} //diff_v8Reader

function GetExtension() {
    return "ssf|cf";
} //GetExtension

function GetBackend() {
    return diff_v8Reader
} //GetBackend

