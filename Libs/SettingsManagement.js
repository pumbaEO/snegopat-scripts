$engine JScript
$uname SettingsManagement
$dname Библиотека SettingsManagement
$addin global
$addin stdlib

////////////////////////////////////////////////////////////////////////////////////////
////{ ФабрикаОбъектов
////

SettingsManagement = {};

SettingsManagement.CreateManager = function (rootPath, defaults, pflStoreType) {
    return new _SettingsManager(rootPath, defaults, pflStoreType);
}

////}

////////////////////////////////////////////////////////////////////////////////////////
////{ SettingsManager(script, defaults)
////

function _SettingsManager(rootPath, defaults, pflStoreType) {
    this.rootPath = rootPath;
    this.pflStoreType = pflStoreType || pflSnegopat;
    
    var emptySettings = {};
    this.DefaultSettings = defaults || emptySettings;
        
    for(var setting in this.DefaultSettings)
        profileRoot.createValue(this.GetFullSettingPath(setting), this.DefaultSettings[setting], this.pflStoreType);
                
    this.current = {};
    
    for(var setting in this.DefaultSettings)
        this.current[setting] = profileRoot.getValue(this.GetFullSettingPath(setting));
}

_SettingsManager.prototype.ReadFromForm = function(form) {
    for(var setting in this.current)
        this.current[setting] = form[setting];
}

_SettingsManager.prototype.ApplyToForm = function(form) {

    for(var setting in this.current)
    {
        var value = this.current[setting];
        
        if (value === undefined || value === null)
            value = this.DefaultSettings[setting];
            
        form[setting] = value;
    }
}

_SettingsManager.prototype.GetFullSettingPath = function(settingName) {
    return this.rootPath + "/" + settingName;
}

_SettingsManager.prototype.LoadSettings = function() {
    this.current = {};
    
    for(var setting in this.DefaultSettings)
        this.current[setting] = profileRoot.getValue(this.GetFullSettingPath(setting));
        
    return this.current;
}

_SettingsManager.prototype.SaveSettings = function() {
    for(var setting in this.current)
        profileRoot.setValue(this.GetFullSettingPath(setting), this.current[setting]);
}

////} SettingsManager

