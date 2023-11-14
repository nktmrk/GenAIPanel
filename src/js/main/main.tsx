import { useEffect, useState } from "react";
import {
  defaultTheme,
  Provider,
  TextField,
  ComboBox,
  Item,
  View,
  Form,
  Divider,
  TextArea,
  Radio,
  RadioGroup,
  Grid,
  ActionButton,
  Button,
  Heading,
  Text,
  Content,
  ListView,
  Header,
} from "@adobe/react-spectrum";
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

const Main = () => {
  const [bgColor, setBgColor] = useState("#282c34");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  useEffect(() => {
    if (window.cep) {
      subscribeBackgroundColor(setBgColor);
    }
    csi.addEventListener("com.adobe.genaipanel.select", (event: any) => {
      setSelectedFiles(event.data);
      console.log(event);
    });
  }, []);

  const handlePress = () => {
    console.log("Pressed");
    console.log(selectedFiles);
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
