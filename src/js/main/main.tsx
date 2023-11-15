import { useEffect, useState } from "react";
// import { loadJSX } from "../lib/utils/load";
import { SystemPath } from "../lib/cep/csinterface";
import AssetsAdded from "@spectrum-icons/workflow/AssetsAdded";
import {
  defaultTheme,
  Provider,
  Button,
  View,
  ActionButton,
  Text,
} from "@adobe/react-spectrum";
import axios from "axios";
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
  const [description, setDescription] = useState("Description goes here...");

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

  const handlePress = async () => {
    for (let selectedFile of selectedFiles) {
      console.log("selectedFile: ", selectedFile);
      const response = await axios.get(
        `http://127.0.0.1:8000/generate_caption?url=${selectedFile}`
      );
      console.log("response: ", response);
      // setDescription()
    }
  };

  return (
    <Provider theme={defaultTheme}>
      <View
        borderWidth="thin"
        borderColor="dark"
        borderRadius="medium"
        padding="size-250"
        height="size-5000"
      >
        <ActionButton staticColor="white" onPress={handlePress}>
          AI Description
        </ActionButton>
        <br />
        <br />
        <Text>{description}</Text>
      </View>
    </Provider>
  );
};

export default Main;
