import _ from "lodash";
import { SystemPath } from "./CSInterfaceES6";
import CSInterfaceInstance from "./CSInterfaceInstance";

const csInterface = CSInterfaceInstance;
const APPID = csInterface.getApplicationID();

export const loadJSX = (fileName) => {
  const systemPath = new SystemPath();
  const extensionRoot = `${csInterface.getSystemPath(
    systemPath.EXTENSION
  )}/host/`;
  console.log(`Loading JSX: ${extensionRoot}${fileName}`);
  csInterface.evalScript(`$.evalFile("${extensionRoot}${fileName}")`);
};

export const runEvalScript = (script) => {
  // script = (new XMPCEPHelper("KBRG")).getXMP({"filename":"C:\\Users\\brian.nickila\\Pictures\\Iceland_2021\\brian-5.jpg","id":"3-x-default","namespace":"http://purl.org/dc/elements/1.1/","prefix":"dc","propertyName":"description","displayName":"Description","altLang":"x-default","altLangDefault":false})

  console.log(script);
  alert(script);
  return new Promise((resolve, reject) => {
    csInterface.evalScript(script, resolve);
  });
};

export const parseFileNameFromPath = (path) => {
  return path.replace(/^.*(\\|\/|\:)/, "");
};

export const getXMPfromJSX = (paramObj) => {
  paramObj = JSON.stringify(paramObj);
  return runEvalScript(
    `(new XMPCEPHelper("${APPID}")).getXMP(${paramObj})`
  ).then((result) => {
    if (!_.isEmpty(result)) {
      try {
        result = JSON.parse(result);
      } catch (err) {
        console.log(err);
      }
      switch (result.status) {
        case "success":
          if (result.result) return result.result;
          else return "";
        case "error":
          throw result.message;
      }
    }
  });
};

export const setXMPfromJSX = (paramObj) => {
  const id = paramObj.id;
  paramObj = JSON.stringify(paramObj);
  return runEvalScript(
    `(new XMPCEPHelper("${APPID}")).setXMP(${paramObj})`
  ).then((result) => {
    if (!_.isEmpty(result)) {
      try {
        result = JSON.parse(result);
      } catch (err) {
        console.log(err);
      }
      return { id: id, ...result };
    }
    return false;
  });
};

export const deleteXMPfromJSX = (paramObj) => {
  const id = paramObj.id;
  paramObj = JSON.stringify(paramObj);
  return runEvalScript(
    `(new XMPCEPHelper("${APPID}")).deleteXMP(${paramObj})`
  ).then((result) => {
    if (!_.isEmpty(result)) {
      try {
        result = JSON.parse(result);
      } catch (err) {
        console.log(err);
      }
      return { id: id, ...result };
    }
    return false;
  });
};

export const copyToClipboard = (text) => {
  var dummy = document.createElement("textarea");
  // to avoid breaking orgain page when copying more words
  // cant copy when adding below this code
  // dummy.style.display = 'none'
  document.body.appendChild(dummy);
  //Be careful if you use texarea. setAttribute('value', value), which works with "input" does not work with "textarea". – Eduard
  dummy.value = text;
  dummy.select();
  document.execCommand("copy");
  document.body.removeChild(dummy);
};

// Not being use yet
export const forceFileSelection = (paths, toggleListener) => {
  function wait(ms) {
    var start = new Date().getTime();
    var end = start;
    while (end < start + ms) {
      end = new Date().getTime();
    }
  }

  let actions = [];
  toggleListener(false);
  runEvalScript(`app.document.deselectAll()`);
  paths.map((path) => {
    console.log("Selecting " + path);
    actions.push(
      runEvalScript(`
      var newThumb = new Thumbnail("${path}");
      app.document.select(newThumb);`)
    );
  });
  Promise.all(actions).then((result) => {
    toggleListener(true);
  });
};

export const sleep = (milliseconds) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

export const _normalizeStructKeys = (value) => {
  // If the value is a plain object, iterate through its keys
  if (_.isPlainObject(value)) {
    const result = {}; // Use an accumulator object to store the results

    _.forEach(value, (v, k) => {
      // Remove the pattern like [0], [1], etc.
      const keyWithoutDigits = k.replace(/\[\d+\]/g, "");
      // Get the last portion after the colon
      const newKey = keyWithoutDigits.split(":").pop();
      // Recursively normalize its value
      const normalizedValue = _normalizeStructKeys(v);
      // Directly update the result object with the new key
      result[newKey] = normalizedValue;
    });

    return result;
  }
  // If the value is an array, iterate through its items and normalize them
  else if (_.isArray(value)) {
    return value.map(_normalizeStructKeys);
  }
  // Otherwise, just return the value as is
  return value;
};
