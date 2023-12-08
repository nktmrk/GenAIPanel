import { useEffect, useState, useCallback } from "react";
import CSInterface, { SystemPath } from "../lib/cep/csinterface";
import Checkmark from "@spectrum-icons/workflow/Checkmark";
import Close from "@spectrum-icons/workflow/Close";

import {
  Button,
  defaultTheme,
  Provider,
  View,
  Text,
  TextArea,
  Flex,
  ActionButton,
  Header,
  Divider,
} from "@adobe/react-spectrum";

import { csi, evalFile } from "../lib/utils/bolt";
import CaptionController from "../lib/utils/captionController";

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
  const [filePending, setFilePending] = useState<xmpObj | null>(null);

  const fetchData = async (files: string[]) => {
    await getXmpData(files);
  };

  useEffect(() => {
    csi.addEventListener(
      "com.adobe.custom-metadata-cep.selectEvent",
      (event: any) => {
        if (event.data.length > 0) {
          fetchData(event.data).catch(console.error);
        } else {
          setXmpData([]);
        }
      }
    );

    return () =>
      csi.removeEventListener(
        "com.adobe.custom-metadata-cep.selectEvent",
        fetchData,
        {}
      );
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

  const updateCaption = async () => {
    const xmpDataCopy = [...xmpData];
    const updatedXmpData = xmpDataCopy.find(
      (o) => o.filePath === filePending?.filePath
    );
    // find object from xmpObj and update
    if (filePending && updatedXmpData) {
      updatedXmpData.caption = filePending.caption;
      const captionController = new CaptionController(
        filePending.caption,
        filePending?.filePath
      );
      captionController.writeToFile();
      captionController.writeToXmp();
      setFilePending(null);
    } else {
      console.log("filePending or updatedXmpData was undefined.");
    }
  };

  const generateCaption = async () => {
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
      const randomCaption = () => {
        const letters =
          "abcdefghijklmnopqrstuvwxyz    ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        let caption = "";
        for (let i = 0; i < 130; i++) {
          caption += letters[Math.floor(Math.random() * (letters.length - 1))];
        }
        return caption;
      };
      const caption = randomCaption();
      const captionController = new CaptionController(caption, data.filePath);
      captionController.writeToFile();
      captionController.writeToXmp();
    }
    fetchData(fileArr).catch(console.error);
  };

  return (
    <Provider theme={defaultTheme}>
      <View padding="size-150" minHeight="100vh">
        <Header aria-label="selected files">Image Captions</Header>
        <Divider size="S" />
        <br />
        <View>
          {xmpData.map((data) => {
            const n = data.filePath.lastIndexOf("\\");
            const filename = data.filePath.substring(n + 1);

            return (
              <Flex direction="column" gap="size-100" key={data.filePath}>
                <TextArea
                  width="size-4000"
                  label={filename}
                  aria-label="caption"
                  value={
                    filePending && filePending.filePath === data.filePath
                      ? filePending.caption
                      : data.caption
                  }
                  onChange={(val) => {
                    // change the current object in xmpData and set xmpData with the updated value
                    if (val !== data.caption) {
                      setFilePending({ filePath: data.filePath, caption: val });
                    } else {
                      setFilePending(null);
                    }
                  }}
                />
                <Flex direction="row" gap="size-100" justifyContent="end">
                  <ActionButton
                    isQuiet
                    isDisabled={
                      filePending
                        ? filePending.filePath !== data.filePath
                        : true
                    }
                    onPress={() => {
                      setFilePending(null);
                    }}
                  >
                    <Close size="S" />
                  </ActionButton>
                  <ActionButton
                    isQuiet
                    isDisabled={
                      filePending
                        ? filePending.filePath !== data.filePath
                        : true
                    }
                    onPress={updateCaption}
                  >
                    <Checkmark size="S" />
                  </ActionButton>
                </Flex>
              </Flex>
            );
          })}
        </View>

        <br />
      </View>
      <View
        position="sticky"
        bottom="size-0"
        backgroundColor="gray-100"
        width="100vw"
        padding="size-200"
      >
        <ActionButton
          aria-label="ai description button"
          staticColor="white"
          onPress={generateCaption}
        >
          AI Caption
        </ActionButton>
      </View>
    </Provider>
  );
};

export default Main;
