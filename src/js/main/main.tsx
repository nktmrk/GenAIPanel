import { useEffect, useState } from "react";
// import { loadJSX } from "../lib/utils/load";
import CSInterface, { SystemPath } from "../lib/cep/csinterface";
import AssetsAdded from "@spectrum-icons/workflow/AssetsAdded";
import {
  defaultTheme,
  Provider,
  Button,
  View,
  Text,
  darkTheme,
  ActionButton,
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

const csInterface = new CSInterface();
const loadJSX = (fileName: string) => {
  const extensionRoot = `${csi.getSystemPath(SystemPath.EXTENSION)}/`;
  console.log(`Loading JSX: ${extensionRoot}${fileName}`);
  evalFile(`${extensionRoot}${fileName}`);
};

loadJSX("xmp.jsx");

const Main = () => {
  const [bgColor, setBgColor] = useState("#282c34");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [descriptions, setDescriptions] = useState<string[]>([]);

  var stuff = {
    id: "15",
    filename: "C:\\Users\\brian.nickila\\Pictures\\Iceland_2021\\brian-5.jpg",
    property: "coat",
    namespace: "http://pet.adobe.com",
    prefix: "pet",
    value: "jelly beans",
    arrayType: "bag",
  };

  // const other =
  // '{"id":"15","filename":"C:\\Users\\brian.nickila\\Pictures\\Iceland_2021\\brian-5.jpg","property":"coat","namespace":"http://pet.adobe.com","prefix":"pet","value":"jelly beans","arrayType":"bag"}';

  // const stuffObj = JSON.stringify(stuff);
  // console.log(stuffObj);

  // var y = x.setXMP(stuff);
  const file = "C:\\Users\\brian.nickila\\Pictures\\Iceland_2021\\brian-5.jpg";

  useEffect(() => {
    if (window.cep) {
      subscribeBackgroundColor(setBgColor);
    }
    csi.addEventListener("com.adobe.genaipanel.select", (event: any) => {
      setSelectedFiles(event.data);
      console.log(event.data);
    });

    console.log(csi.getApplicationID());
  }, []);

  const handlePress = async () => {
    setDescriptions([]);
    // setIsLoading(true);
    for (let selectedFile of selectedFiles) {
      console.log("selectedFile: ", selectedFile);
      // const response = await axios.get(
      //   `http://127.0.0.1:8000/generate_caption?url=${selectedFile}`
      // );
      // if (response?.data?.caption) {
      //   setDescriptions((prevDescription) => [
      //     ...prevDescription,
      //     response?.data?.caption,
      //   ]);
      // }
      // console.log("response: ", response);
      const newFile = selectedFile.replace(/\\/g, "\\\\") || "";
      const response =
        "This will be replaced with the description from the API response.";
      const setScript = `setGenAIXMP("${newFile}", "${response}")`;
      console.log("running evalScript...");
      csInterface.evalScript(setScript, () => {});
    }
  };

  return (
    <Provider theme={darkTheme}>
      <View
        borderWidth="thin"
        borderColor="dark"
        borderRadius="medium"
        padding="size-250"
        height="size-5000"
      >
        {/* <Button
          staticColor="white"
          onPress={runEvalScript}
          variant="primary"
          isPending={isLoading}
        >
          Set Metadata
        </Button> */}
        <br />
        <br />
        <Button
          staticColor="white"
          onPress={handlePress}
          variant="primary"
          isPending={isLoading}
        >
          AI Description
        </Button>
        <br />
        <br />
        {descriptions.map((description) => (
          <View key={description}>
            <Text>{description}</Text>
          </View>
        ))}
      </View>
    </Provider>
  );
};

export default Main;
