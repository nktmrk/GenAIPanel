import { useEffect, useState } from "react";
// import { loadJSX } from "../lib/utils/load";
import { SystemPath } from "../lib/cep/csinterface";

import { saveAs } from "file-saver";
import { defaultTheme, Provider, Button } from "@adobe/react-spectrum";
import { os, path } from "../lib/cep/node";

import {
  csi,
  evalES,
  evalFile,
  openLinkInBrowser,
  subscribeBackgroundColor,
  evalTS,
} from "../lib/utils/bolt";

import "./main.scss";

// export const loadJSX = (fileName: string) => {
//   // const systemPath = new SystemPath();
//   const extensionRoot = `${csi.getSystemPath(SystemPath.EXTENSION)}/host/`;
//   console.log(`Loading JSX: ${extensionRoot}${fileName}`);
//   evalFile(`${extensionRoot}${fileName}`);
//   // return new Promise((resolve, reject) => {
//   //   csi.evalScript(`$.evalFile("${extensionRoot}${fileName}")`, resolve);
//   // });
// };

// loadJSX("json2.js");
// loadJSX("xmp.jsx");

const Main = () => {
  const [bgColor, setBgColor] = useState("#282c34");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  // const exampleScript = `(new XMPCEPHelper("KBRG")).getXMP({"filename":"C:\\Users\\brian.nickila\\Pictures\\Iceland_2021\\brian-5.jpg","id":"3-x-default","namespace":"http://purl.org/dc/elements/1.1/","prefix":"dc","propertyName":"description","displayName":"Description","altLang":"x-default","altLangDefault":false})`;
  // const sampleGetXMP = `(new XMPCEPHelper("KBRG")).getXMP({"filename":"C:\\Users\\brian.nickila\\Pictures\\Iceland_2021\\brian-5.jpg","id":"3-x-default","namespace":"http://purl.org/dc/elements/1.1/","prefix":"dc","propertyName":"description","displayName":"Description","altLang":"x-default","altLangDefault":false})`;
  // const sampleSetXMP = `new XMPCEPHelper("KBRG")).setXMP({"id":"15","filename":"C:\\Users\\brian.nickila\\Pictures\\Iceland_2021\\brian-5.jpg","value":{"coat":{"namespace":"http://pet.adobe.com","prefix":"pet","value":"waffles","arrayType":"bag"}}})`;
  // const runEvalScript = () => {
  // console.log(sampleSetXMP);
  // return new Promise((resolve, reject) => {
  //   console.log("inside promise");
  //   csi.evalScript(
  //     `new XMPCEPHelper("KBRG")).setXMP({"id":"15","filename":"C:\\Users\\brian.nickila\\Pictures\\Iceland_2021\\brian-5.jpg","value":{"coat":{"namespace":"http://pet.adobe.com","prefix":"pet","value":"waffles","arrayType":"bag"}}})`,
  //     resolve
  //   );
  //   console.log(resolve);
  // });
  // };

  useEffect(() => {
    if (window.cep) {
      subscribeBackgroundColor(setBgColor);
    }
    csi.addEventListener("com.adobe.genaipanel.select", (event: any) => {
      console.log("here is something");
      setSelectedFiles(event.data);
      console.log(event.data);
    });

    console.log(csi.getApplicationID());
  }, []);

  const handlePress = () => {
    console.log("Pressed");
    console.log(selectedFiles);
    // runEvalScript();
    // const data = window.cep.encoding.convertion.utf8_to_b64(JSON.stringify(view));
    // const someObj = { filename: selectedFiles[0] };
    // const data = window.cep.encoding.convertion.utf8_to_b64(
    //   JSON.stringify(someObj)
    // );
    const data =
      "Here is the data that will be written to the text file located in the same location as the image.";

    // let filePath = window.cep.fs.showSaveDialogEx(
    //   "adobe_cmp_view",
    //   "",
    //   ["json"],
    //   selectedFiles[0]
    // ).data;
    // currently just grabbing the first one in the array which will work for one at a time. we'll change this to a map
    let filePath = selectedFiles[0].replace(/\.[^/.]+$/, "");

    // const filePath =
    //   "C:\\Users\\brian.nickila\\Desktop\\Adobe\\CMP\\somethingelse";
    const result = window.cep.fs.writeFile(
      filePath,
      data,
      window.cep.encoding.utf8
    );
    if (result.err === 0) {
      console.log(`Saved the View to ${filePath}`);
      return filePath;
    } else {
      console.log(`Unable to save View. Error writing new file: ${result.err}`);
      throw result.err;
    }
    // var blob = new Blob(["here's some stuff"], {
    //   type: "text/plain;charset=utf-8",
    // });
    // saveAs(blob, "sample-file.txt");
  };

  return (
    <Provider theme={defaultTheme}>
      <Button variant="accent" onPress={handlePress}>
        Gen Desc
      </Button>
    </Provider>
  );
};

export default Main;
