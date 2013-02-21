$engine JScript
$uname v8Epf
$dname Обработки 1С
$addin stdlib

EpfLoader = new (stdlib.Class.extend({

	construct : function() {
		this.v8 = new ActiveXObject("V82.Application");
		this.v8.Connect('File="' + this.getIbPath() + '";');
		
		var libs = v8New('Structure');
		libs.Insert('СтандартнаяБиблиотека', stdlib);
		
		this.v8.Init(Designer, libs);
		
		this.loadAllEpf();		
		events.connect(Designer, "beforeExitApp", this, 'destruct');
	},
	
	destruct: function() {
		this.unloadAllEpf();
		delete this.v8;
		delete this.macroses;
	},
		
	getIbPath : function() {
		return this.getEpfRootPath() + "\\ib";
	},
	
	getEpfRootPath : function() {
		return stdlib.getSnegopatMainFolder() + "scripts\\epf";
	},
	
	loadAllEpf: function() {
		var fso = new ActiveXObject("Scripting.FileSystemObject");
		var re_epf = /\.epf$/i;
		(function (loader, root) {
			var folder = fso.GetFolder(root);
			var folders = new Enumerator(folder.SubFolders);
			for (; !folders.atEnd(); folders.moveNext()) {
				arguments.callee(loader, folders.item().Path);
			}
			var files = new Enumerator(folder.Files);
			for (; !files.atEnd(); files.moveNext()) {
				var file = files.item();
				if (re_epf.test(file.Name)) {
					loader.loadEpf(file.Path);
				}
			}
		})(this, this.getEpfRootPath());
	},
	
	loadEpf: function(path) {
		Message(path);
		this.macroses = new Array();
		var epf = this.v8.LoadEpf(path);
		if (epf) {
			var epfName = epf.Metadata().Name;
			var macroses = this.v8.GetMacroses(epf);
			for (var i=0; i<macroses.Count(); i++) {//макрос
				this.addEpfMacros(epf, epfName, macroses.Get(i));
			}
		}
	},
	
	addEpfMacros: function(epf, epfName, macroName) {
		var name = 'macros' + epfName + '->' + macroName.substr(6);
		SelfScript.self[name] = function() {
			var _epf = epf; // Catch it into closure!
			eval('_epf.' + macroName + '();');
		};
		this.macroses.push(name);
	},
	
	unloadAllEpf: function () {
		for (var i=0; i<this.macroses.length; i++) {
			delete SelfScript.self[this.macroses[i]]; 
		}
	},
	
	getEpf: function (epfName) {
		return this.v8.GetEpf(epfName);
	}

}));

SelfScript.Self['macrosПерезагрузить все 1С-скрипты'] = function () {
    EpfLoader.unloadAllEpf();
    EpfLoader.loadAllEpf();
}

