import { useEffect, useState, useCallback } from "react";
import { os, path } from "../lib/cep/node";
import CSInterface, { SystemPath } from "../lib/cep/csinterface";

import {
  Button,
  defaultTheme,
  Provider,
  View,
  Text,
  ListView,
  Item,
  TextArea,
} from "@adobe/react-spectrum";

import {
  csi,
  evalES,
  evalFile,
  openLinkInBrowser,
  subscribeBackgroundColor,
  evalTS,
} from "../lib/utils/bolt";

import "./main.scss";

interface xmpObj {
  filePath: string;
  caption: string;
}

const csInterface = new CSInterface();
const loadJSX = (filename: string) => {
  const extensionRoot = `${csi.getSystemPath(SystemPath.EXTENSION)}/`;
  console.log(`Loading JSX: ${extensionRoot}${filename}`);
  evalFile(`${extensionRoot}${filename}`);
};

loadJSX("xmp.jsx");

const Main = () => {
  const [xmpData, setXmpData] = useState<xmpObj[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newCaption, setNewCaption] = useState("");

  const fetchData = async (files: string[]) => {
    await getXmpData(files);
  };

  useEffect(() => {
    csi.addEventListener("com.adobe.genaipanel.select", (event: any) => {
      if (event.data.length > 0) {
        fetchData(event.data).catch(console.error);
      } else {
        setXmpData([]);
      }
    });

    return () =>
      csi.removeEventListener("com.adobe.genaipanel.select", fetchData, {});
  }, []);

  const getXmpData = (files: string[]) => {
    let newData: xmpObj[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        const xmpRequest = {
          id: "0",
          filename: files[i],
          propertyName: "genAIDescription",
          namespace: "http://ns.adobe.com/xap/1.0/",
          prefix: "xmp",
          displayName: "Gen AI Desc",
        };

        csInterface.evalScript(
          `(new XMPCEPHelper("KBRG")).getXMP(${JSON.stringify(xmpRequest)})`,
          (result: any) => {
            result = JSON.parse(result);
            newData.push({ filePath: files[i], caption: result.result });
            {
              i === files.length - 1 && setXmpData(newData);
            }
          }
        );
      }
      return;
    } catch (error) {
      console.log(error);
    }
  };

  const handlePress = async () => {
    // setDescriptions([]);
    // setIsLoading(true);
    let fileArr: string[] = [];
    for (let data of xmpData) {
      console.log("selectedFile: ", data.filePath);
      fileArr.push(data.filePath);
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
      const caption =
        "This will be replaced with the ONE from the API caption.";
      var dataObj = {
        id: "0",
        filename: data.filePath,
        propertyName: "genAIDescription",
        namespace: "http://ns.adobe.com/xap/1.0/",
        prefix: "xmp",
        value: caption,
        arrayType: "bag",
      };

      csInterface.evalScript(
        `new XMPCEPHelper("KBRG").setXMP(${JSON.stringify(dataObj)})`,
        () => {}
      );
    }
    fetchData(fileArr).catch(console.error);
  };

  return (
    <Provider theme={defaultTheme}>
      <View
        borderWidth="thin"
        borderColor="dark"
        padding="size-200"
        minHeight="size-6000"
      >
        <Text aria-label="selected files">Selected Files:</Text>
        <br />
        <View>
          {xmpData.map((data) => {
            const n = data.filePath.lastIndexOf("\\");
            const filename = data.filePath.substring(n + 1);
            return (
              <View
                paddingTop="size-200"
                aria-label="filePath and caption"
                key={data.filePath}
              >
                <Text aria-label="filePath">{filename}</Text>
                <br />
                <TextArea
                  aria-label="caption"
                  value={data.caption}
                  onChange={setNewCaption}
                />
              </View>
            );
          })}
        </View>
        <br />
        <Button
          aria-label="ai description button"
          staticColor="white"
          onPress={handlePress}
          variant="primary"
          isPending={isLoading}
        >
          AI Description
        </Button>
      </View>
    </Provider>
  );
};

export default Main;
