function XMPTarget(appID) {
  "use strict";
  var xmpFile,
    docRef,
    thumb,
    xmpMetadata,
    clipType,
    itemIsSequence,
    isForceOpened = false;
  this._appID = appID;
  XMPTarget.prototype._getDocObject = function (filename) {
    var file = new File(filename);
    var docRef = undefined;
    try {
      if (appID === "PPRO") {
        var docRefs = app.project.rootItem.children;
        if (docRefs.length > 0) {
          for (var i = 0; i < docRefs.length; i++) {
            var clipItem =
              clipType === undefined && !itemIsSequence
                ? docRefs[i].getMediaPath()
                : docRefs[i].nodeId;
            if (clipItem === filename) {
              try {
                var docObj = docRefs[i];
                docRef = docObj;
              } catch (err) {
                if (err.message !== "The document has not yet been saved.") {
                  throw err.message;
                }
              }
            }
          }
        }
      } else {
        var docRefs = app.documents;
        docRef = docRefs.getByName(File.decode(file.name));
        if (docRefs.length > 1) {
          for (var i = 0; i < docRefs.length; i++) {
            try {
              var docObj = docRefs[i];
              if (docObj.fullName.fsName == filename) {
                docRef = docObj;
              }
            } catch (err) {
              if (err.message !== "The document has not yet been saved.") {
                throw err.message;
              }
            }
          }
        }
      }
      return docRef;
    } catch (err) {
      if (err.message == "No such element") {
        open(file);
        isForceOpened = true;
        this._getDocObject(filename);
      } else {
        throw err.message;
      }
    }
  };

  XMPTarget.prototype._writeToActiveDoc = function (docObj) {
    try {
    } catch (err) {
      open(file);
      isForceOpened = true;
      this._getDocObject(filename);
    }
  };

  XMPTarget.prototype._forceClose = function () {
    if (isForceOpened) {
      docRef.close();
      isForceOpened = false;
    }
  };

  XMPTarget.prototype.read = function (filename) {
    switch (this._appID) {
      case "PHXS":
        docRef = this._getDocObject(filename);
        if (docRef) {
          xmpMetadata = docRef.xmpMetadata;
          return new XMPMeta(xmpMetadata.rawData);
        }
        break;
      case "ILST":
        docRef = this._getDocObject(filename);
        if (docRef) {
          xmpMetadata = docRef.XMPString;
          return new XMPMeta(xmpMetadata);
        }
        break;
      case "KBRG":
        thumb = new Thumbnail(new File(filename));
        app.synchronousMode = true;
        if (thumb.core.itemContent.canGetXmp === true) {
          var md = thumb.synchronousMetadata;
          return new XMPMeta(thumb.metadata.serialize());
        } else {
          throw "Cannot Read XMP Metadata from this file";
        }
        break;
      case "PPRO":
        docRef = this._getDocObject(filename);
        if (docRef) {
          xmpMetadata =
            clipType === undefined
              ? docRef.getXMPMetadata()
              : docRef.getProjectMetadata();
          return new XMPMeta(xmpMetadata);
        }
        break;

      default:
        xmpFile = new XMPFile(
          filename,
          XMPConst.UNKNOWN,
          XMPConst.OPEN_FOR_UPDATE
        );
        return xmpFile.getXMP();
    }
  };

  XMPTarget.prototype.write = function (data, filename, updatedFields) {
    try {
      switch (this._appID) {
        case "PHXS":
          if (app.activeDocument !== docRef) {
            // In order to write metadata back, the document must be active. Temporary set Document active and set it back.
            var prevDoc = app.activeDocument;
            app.activeDocument = docRef;
            this.write(data);
            app.activeDocument = prevDoc;
          } else {
            xmpMetadata.rawData = data;
          }
          break;
        case "ILST":
          if (app.activeDocument !== docRef) {
            // In order to write metadata back, the document must be active. Temporary set Document active and set it back.
            var prevDoc = app.activeDocument;
            app.activeDocument = docRef;
            this.write(data);
            app.activeDocument = prevDoc;
          } else {
            docRef.XMPString = data;
            docRef.saved = false;
          }
          break;
        case "KBRG":
          if (thumb !== undefined) {
            if (thumb.core.itemContent.canSetXmp === true) {
              thumb.metadata = new Metadata(data);
              var isDynamicMediaType =
                thumb.core.itemContent.dynamicMediaType !== 1;
              if (isDynamicMediaType) {
                $.writeln("Dynamic File, Write again to be safe");
                thumb.metadata = new Metadata(data);
              }
            } else {
              throw "Cannot Write XMP Metadata to this file";
            }
          }
          break;
        case "PPRO":
          var projectItem;
          var children = app.project.rootItem.children;
          // Loop through project items to find which are currently selected
          for (i = 0; i < children.length; i++) {
            // field is a clipType
            if (clipType !== undefined) {
              if (children[i].nodeId === filename) {
                projectItem = children[i];
                projectItem.setProjectMetadata(data, updatedFields);
                break;
              }
              // item is Sequence and field is XMP (not clip)
            } else if (itemIsSequence) {
              if (children[i].nodeId === filename) {
                projectItem = children[i];
                projectItem.setXMPMetadata(data, updatedFields);
                break;
              }
            } else {
              // selected item is not a sequence and field is XMP (not clip)
              if (children[i].getMediaPath() === filename) {
                projectItem = children[i];
                projectItem.setXMPMetadata(data, updatedFields);
                break;
              }
            }
          }
          projectItem.refreshMedia();
          break;
        default:
          xmpFile.putXMP(data);
          break;
      }
    } catch (err) {
      throw err.message;
    }
  };

  XMPTarget.prototype.close = function (data) {
    switch (this._appID) {
      case "PHXS":
        this._forceClose();
        break;
      case "ILST":
        this._forceClose();
        break;
      case "KBRG":
        //do nothing
        break;
      case "PPRO":
        this._forceClose();
        break;
      default:
        xmpFile.close();
        break;
    }
  };

  XMPTarget.prototype.getClipType = function () {
    return clipType;
  };

  XMPTarget.prototype.setClipType = function (dataType) {
    if (!isNaN(dataType) && 4 > dataType >= 0) {
      clipType = dataType;
    } else {
      clipType = undefined;
    }
  };

  XMPTarget.prototype.setSequence = function (isSequence) {
    itemIsSequence = isSequence;
  };
}

function XMPAdapter(xmpTarget) {
  "use strict";
  this._xmpTarget = xmpTarget;
  this._updatedFields = [];

  var xmpMeta, initialNameSpaces;
  // Load the XMP Script library
  if (xmpLib === undefined) {
    var xmpLib = new ExternalObject("lib:AdobeXMPScript");
  }
  //private
  var getStructObj = function (namespace, property) {
    var obj = {},
      iter = xmpMeta.iterator(
        XMPConst.ITERATOR_JUST_CHILDREN,
        namespace,
        property
      ),
      item = iter.next();
    while (item) {
      var propertyName = item.path.match(/:(.*)$/)[1].replace(/\[\d+\]/, "");
      if (item.options & XMPConst.PROP_IS_ARRAY) {
        obj[propertyName] = getArrayItems(namespace, item.path);
      } else if (item.options & XMPConst.PROP_IS_STRUCT) {
        obj[propertyName] = getStructObj(namespace, item.path);
      } else {
        if (item.value) {
          obj[propertyName] = item.value;
        }
      }
      item = iter.next();
    }
    return obj;
  };
  //private
  var getArrayItems = function (namespace, property) {
    if (xmpMeta) {
      var cnt = xmpMeta.countArrayItems(namespace, property);
      var objArr = [];
      if (cnt > 0) {
        for (var i = 1; i <= cnt; i++) {
          var arrayPath = XMPUtils.composeArrayItemPath(namespace, property, i);
          var arrItem = xmpMeta.getProperty(namespace, arrayPath);
          if (arrItem && arrItem.options & XMPConst.PROP_IS_STRUCT) {
            var obj = getStructObj(namespace, arrayPath);
            objArr.push(obj);
          } else {
            objArr.push(arrItem.toString());
          }
        }
        return objArr;
      }
    }
  };
  //public
  XMPAdapter.prototype.open = function (filename) {
    if (filename) {
      try {
        xmpMeta = undefined;
        xmpMeta = this._xmpTarget.read(filename);
        initialNameSpaces = XMPMeta.dumpNamespaces();
      } catch (err) {
        throw err.message;
      }
    }
  };
  //public
  XMPAdapter.prototype.close = function () {
    try {
      this._xmpTarget.close();
    } catch (err) {
      throw err.message;
    }
  };
  //public
  XMPAdapter.prototype.doesNamespaceExist = function (namespace) {
    if (initialNameSpaces) {
      var found = initialNameSpaces.search(new RegExp(namespace, "i"));
      if (found !== -1) return true;
      else return false;
    }
  };

  //public
  XMPAdapter.prototype.get = function (namespace, property) {
    if (xmpMeta) {
      if (this.doesNamespaceExist(namespace)) {
        try {
          //Get property value
          var prop = xmpMeta.getProperty(namespace, property);
          if (prop !== undefined) {
            //Check if property value is an array
            if (prop.options & XMPConst.PROP_IS_ARRAY) {
              var items = getArrayItems(namespace, property);
              return items;
            }
            if (prop.options & XMPConst.PROP_IS_STRUCT) {
              var strutObjs = getStructObj(namespace, property);
              return strutObjs;
            } else {
              return prop.toString();
            }
          }
        } catch (err) {
          throw err.message;
        }
      }
    }
  };

  //public
  XMPAdapter.prototype.getLocalizedValue = function (
    namespace,
    property,
    locale
  ) {
    if (xmpMeta) {
      if (this.doesNamespaceExist(namespace)) {
        try {
          //Get property value
          var prop = xmpMeta.getProperty(namespace, property);
          if (prop !== undefined) {
            if (prop.options & XMPConst.PROP_IS_ARRAY) {
              // Getting localizedText from Empty Array causing Error. Must check array length
              var arrCnt = xmpMeta.countArrayItems(namespace, property);
              if (arrCnt > 0) {
                var result = xmpMeta.getLocalizedText(
                  namespace,
                  property,
                  "",
                  locale
                );
                return result.toString();
              }
            }
          }
        } catch (err) {
          throw err.message;
        }
      }
    }
  };
  //public
  XMPAdapter.prototype.set = function (
    namespace,
    prefix,
    property,
    value,
    arrayType,
    shouldOverwrite
  ) {
    if (shouldOverwrite === undefined) {
      // Default behavior from the previous release. We will keep it the same.
      shouldOverwrite = true;
    }
    var clipType = this._xmpTarget.getClipType();
    if (xmpMeta) {
      //In order to write, Namespace URI and Prefix must be registered for a given file.
      //You cannot write property if Namespace is not registered in the file.
      try {
        var XMPArray = XMPConst.PROP_IS_ARRAY;
        XMPMeta.registerNamespace(namespace, prefix);
        switch (arrayType) {
          case "bag":
            XMPArray = XMPConst.PROP_IS_ARRAY;
            break;
          case "seq":
            XMPArray = XMPConst.ARRAY_IS_ORDERED;
            break;
          case "alt":
            XMPArray = XMPConst.ARRAY_IS_ALTERNATIVE;
            break;
          default:
            XMPArray = XMPConst.PROP_IS_ARRAY;
        }
        if (xmpMeta.doesPropertyExist(namespace, property) && shouldOverwrite) {
          xmpMeta.deleteProperty(namespace, property);
        }

        clipType !== undefined &&
          app.project.addPropertyToProjectMetadataSchema(
            property,
            property,
            clipType
          );

        switch (Object.prototype.toString.call(value)) {
          // Let's take a look to see what type of value are we getting. Array? Object? String?
          case "[object Array]":
            //Create Empty Property with Array Type
            var prop = xmpMeta.getProperty(namespace, property);
            if (!(prop && prop.options & XMPConst.PROP_IS_ARRAY)) {
              xmpMeta.setProperty(namespace, property, null, XMPArray);
            }

            // If Array is Empty, Delete the array property
            if (value.length <= 0) {
              this.delete(namespace, prefix, property);
              break;
            }

            var delIndex = [];
            var isEmpArr = false;
            // Append Array Items to the Property
            for (var i = 0; i < value.length; i++) {
              if (
                Object.prototype.toString.call(value[i]) === "[object Object]"
              ) {
                // Array Item that is Struct Obj. XMP Index start with 1 not 0
                var arrayPath = XMPUtils.composeArrayItemPath(
                  namespace,
                  property,
                  i + 1
                );
                if (value[i].isDeleted === true && shouldOverwrite === false) {
                  delIndex.push(i + 1);
                } else {
                  this.set(
                    namespace,
                    prefix,
                    arrayPath,
                    value[i].entries,
                    arrayType,
                    shouldOverwrite
                  );
                }
              } else {
                if (
                  xmpMeta.countArrayItems(namespace, property) > 0 &&
                  !isEmpArr
                ) {
                  // since simple array value, we don't want to append data to the existing list. We want to set what the value is
                  xmpMeta.setProperty(namespace, property, null, XMPArray);
                }
                isEmpArr = true;
                xmpMeta.appendArrayItem(namespace, property, value[i]);
              }
            }

            // Delete index that marked for delete (isDeleted===true).
            // We want to delete from the end of the array to avoid index change.
            if (delIndex.length > 0) {
              for (var i = delIndex.length - 1; i >= 0; i--) {
                xmpMeta.deleteArrayItem(namespace, property, delIndex[i]);
              }
            }

            break;
          case "[object Object]":
            // Handling Struct Obj
            for (var structProp in value) {
              // Incase there is a chance of unregistered struct field Namespace & prefix.
              XMPMeta.registerNamespace(
                value[structProp].namespace,
                value[structProp].prefix
              );
              // using propertName shortcut to write Struct object
              var strutFieldPath = XMPUtils.composeStructFieldPath(
                namespace,
                property,
                value[structProp].namespace,
                structProp
              );
              this.set(
                namespace,
                prefix,
                strutFieldPath,
                value[structProp].value,
                value[structProp].arrayType,
                value[structProp].shouldOverwrite || shouldOverwrite
              );
            }
            break;
          default:
            // if simple value not empty, use setProperty else just delete it.
            if (value !== undefined && value !== null && value !== "") {
              xmpMeta.setProperty(namespace, property, value);
            } else {
              this.delete(namespace, prefix, property);
            }
        }
        this._updatedFields.push(property);
      } catch (err) {
        throw err.message;
      }
    }
  };

  XMPAdapter.prototype.setLocalizedValue = function (
    namespace,
    prefix,
    property,
    locale,
    isDefaultLocale,
    value
  ) {
    if (xmpMeta) {
      if (!this.doesNamespaceExist(namespace)) {
        XMPMeta.registerNamespace(namespace, prefix);
      }
      try {
        var isNew = false;
        var prop = xmpMeta.getProperty(namespace, property);
        var defaultValue = value;
        if (locale === "x-default") {
          xmpMeta.deleteProperty(namespace, property);
        }
        if (!(prop && prop.options & XMPConst.ARRAY_IS_ALTERNATIVE)) {
          xmpMeta.deleteProperty(namespace, property);
          xmpMeta.setProperty(
            namespace,
            property,
            null,
            XMPConst.ARRAY_IS_ALTERNATIVE
          );
          isNew = true;
        }

        if (isDefaultLocale === false) {
          if (isNew === false) {
            defaultValue = xmpMeta
              .getArrayItem(namespace, property, 1)
              .toString();
          }
        }

        // Set Value
        xmpMeta.setLocalizedText(namespace, property, "", locale, value);
        // Set Default Value
        xmpMeta.setArrayItem(namespace, property, 1, defaultValue);
        var arr1IndexName = property.concat("[1]");
        // Add the xml:lang property for default
        xmpMeta.setQualifier(
          namespace,
          arr1IndexName,
          XMPConst.NS_XML,
          "lang",
          "x-default"
        );
      } catch (err) {
        throw err.message;
      }
    }
  };

  //public
  XMPAdapter.prototype.delete = function (namespace, prefix, property) {
    if (xmpMeta) {
      try {
        XMPMeta.registerNamespace(namespace, prefix);
        if (xmpMeta.doesPropertyExist(namespace, property)) {
          xmpMeta.deleteProperty(namespace, property);
          this._updatedFields.push(property);
        }
      } catch (err) {
        throw err.message;
      }
    }
  };

  //public
  XMPAdapter.prototype.deleteLocalizedValue = function (
    namespace,
    prefix,
    property,
    locale,
    isDefaultLocale
  ) {
    if (xmpMeta) {
      try {
        XMPMeta.registerNamespace(namespace, prefix);
        if (xmpMeta.doesPropertyExist(namespace, property)) {
          var delIndex = undefined;
          var items = getArrayItems(namespace, property);
          for (var i = 1; i <= items.length; i++) {
            var qNameIndex = property.concat("[" + i + "]");
            var qNameValue = xmpMeta.getQualifier(
              namespace,
              qNameIndex,
              XMPConst.NS_XML,
              "lang"
            );
            if (qNameValue.value.toLowerCase() === locale.toLowerCase()) {
              delIndex = i;
              break;
            }
          }
          if (delIndex !== undefined) {
            xmpMeta.deleteArrayItem(namespace, property, delIndex);
            if (isDefaultLocale === true) {
              xmpMeta.deleteArrayItem(namespace, property, 1);
            }
          }
          //If AltLang Array is Empty, Just delete this entire property.
          if (xmpMeta.countArrayItems(namespace, property) === 0) {
            xmpMeta.deleteProperty(namespace, property);
          }
        }
      } catch (err) {
        throw err.message;
      }
    }
  };

  //public
  XMPAdapter.prototype.commit = function (filename) {
    if (xmpMeta) {
      //commit the change, save back XMPMeta.
      try {
        var updatedPacket = xmpMeta.serialize(
          XMPConst.SERIALIZE_OMIT_PACKET_WRAPPER |
            XMPConst.SERIALIZE_USE_COMPACT_FORMAT
        );
        this._xmpTarget.write(updatedPacket, filename, this._updatedFields);
      } catch (err) {
        throw err.message;
      }
    } else {
      throw "Thumb and XMPMeta not found. Did the file open?";
    }
  };
}

function XMPCEPHelper(appID) {
  "use strict";
  this._target = new XMPTarget(appID);

  XMPCEPHelper.prototype.getXMP = function (args) {
    var filename = args.filename,
      namespace = args.namespace,
      property = args.propertyName,
      altLang = args.altLang,
      clipType = args.hasOwnProperty("clipType") ? args.clipType : undefined;
    try {
      if (appID === "PPRO") {
        filename = JSON.parse(filename);
        var isSequence = filename.isSequence;
        this._target.setSequence(isSequence);
        if (clipType !== undefined || isSequence) {
          filename = filename.nodeId;
          this._target.setClipType(clipType);
        } else {
          filename = filename.path;
        }
      }
      var xmp = new XMPAdapter(this._target);
      xmp.open(filename);
      var result;
      if (altLang && altLang.length > 0) {
        result = xmp.getLocalizedValue(namespace, property, altLang);
      } else {
        result = xmp.get(namespace, property);
      }
      xmp.close();
      return JSON.stringify({
        status: "success",
        message: null,
        result: result,
      });
    } catch (err) {
      return JSON.stringify({
        status: "error",
        message:
          "Get - " + filename + ":" + namespace + ":" + property + " - " + err,
        result: null,
      });
    }
  };

  XMPCEPHelper.prototype.setXMP = function (args) {
    var filename = args.filename,
      namespace = args.namespace,
      prefix = args.prefix,
      property = args.propertyName,
      value = args.value,
      altLang = args.altLang,
      altLangDefault = args.altLangDefault,
      clipType = args.hasOwnProperty("clipType") ? args.clipType : undefined,
      arrayType = args.arrayType || XMPConst.PROP_IS_ARRAY;
    shouldOverwrite = args.shouldOverwrite;
    try {
      if (appID === "PPRO") {
        filename = JSON.parse(filename);
        var isSequence = filename.isSequence;
        this._target.setSequence(isSequence);
        if (clipType !== undefined || isSequence) {
          filename = filename.nodeId;
          if (clipType !== undefined) {
            this._target.setClipType(clipType);
          }
        } else {
          filename = filename.path;
        }
      }
      var xmp = new XMPAdapter(this._target);
      xmp.open(filename);
      if (Object.prototype.toString.call(args.value) === "[object Object]") {
        for (var key in args.value) {
          namespace = args.value[key].namespace;
          prefix = args.value[key].prefix;
          property = key;
          value = args.value[key].value;
          altLang = args.value[key].altLang;
          altLangDefault = args.value[key].altLangDefault;
          arrayType = args.value[key].arrayType;
          shouldOverwrite = args.value[key].shouldOverwrite;
        }
      }
      if (altLang && altLang.length > 0) {
        xmp.setLocalizedValue(
          namespace,
          prefix,
          property,
          altLang,
          altLangDefault,
          value
        );
      } else {
        xmp.set(namespace, prefix, property, value, arrayType, shouldOverwrite);
      }
      xmp.commit(filename);
      xmp.close();
      return JSON.stringify({
        status: "success",
        message: null,
      });
    } catch (err) {
      return JSON.stringify({
        status: "error",
        message:
          "Set - " + filename + ":" + namespace + ":" + property + " - " + err,
      });
    }
  };

  XMPCEPHelper.prototype.deleteXMP = function (args) {
    var filename = args.filename,
      namespace = args.namespace,
      property = args.propertyName,
      prefix = args.prefix,
      altLang = args.altLang,
      altLangDefault = args.altLangDefault,
      arrayType = args.value.arrayType || XMPConst.PROP_IS_ARRAY;
    clipType = args.hasOwnProperty("clipType") ? args.clipType : undefined;
    try {
      if (appID === "PPRO") {
        filename = JSON.parse(filename);
        var isSequence = filename.isSequence;
        this._target.setSequence(isSequence);
        if (clipType !== undefined || isSequence) {
          filename = filename.nodeId;
          this._target.setClipType(clipType);
        } else {
          filename = filename.path;
        }
      }

      var xmp = new XMPAdapter(this._target);
      xmp.open(filename);
      if (Object.prototype.toString.call(args.value) === "[object Object]") {
        for (var key in args.value) {
          namespace = args.value[key].namespace;
          prefix = args.value[key].prefix;
          property = key;
          altLang = args.value[key].altLang;
          altLangDefault = args.value[key].altLangDefault;
        }
      }
      if (altLang && altLang.length > 0) {
        xmp.deleteLocalizedValue(
          namespace,
          prefix,
          property,
          altLang,
          altLangDefault
        );
      } else {
        xmp.delete(namespace, prefix, property);
      }
      xmp.commit(filename);
      xmp.close();

      return JSON.stringify({
        status: "success",
        message: null,
      });
    } catch (err) {
      return JSON.stringify({
        status: "error",
        message:
          "Delete - " +
          filename +
          ":" +
          namespace +
          ":" +
          property +
          " - " +
          err,
      });
    }
  };
}
