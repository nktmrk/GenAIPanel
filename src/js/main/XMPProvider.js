import { error, info, success } from "@react/react-spectrum/Toast";
import {
  copyToClipboard,
  deleteXMPfromJSX,
  getXMPfromJSX,
  setXMPfromJSX,
} from "libs/utils";
import _ from "lodash";
import React from "react";
import XMPAltLangModel from "../model/XMPAltLangModel";
import XMPCollection from "../model/XMPCollection";
import XMPModel from "../model/XMPModel";
import XMPStructureModel from "../model/XMPStructureModel";
export const XMPContext = React.createContext(null);

class XMPProvider extends React.Component {
  state = {
    name: undefined,
    data: new XMPCollection(),
    showPendingDialog: false,
    pendingFilename: [],
    pendingTab: undefined,
    refreshData: false,
    uncommitedItems: [],
    commitedItems: [],
    linkEnabled: [],
  };

  shouldComponentUpdate(nextProps, nextState) {
    return this.state.showPendingDialog && nextState.showPendingDialog
      ? false
      : true;
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.filename !== prevProps.filename) {
      // Detected Different FileName being Selected
      if (this.isPendingItemExist()) {
        if (this.props.filename !== this.state.pendingFilename) {
          console.log("Show Pending Dialog");
          this.setState({
            showPendingDialog: true,
            pendingFilename: prevProps.filename,
          });
        }
      } else {
        console.log("New File Selected.....Getting Data");
        this.getMeSomeData();
      }
    } else {
      // In the same file, but different tab
      if (this.state.name !== this.props.name) {
        if (this.isPendingItemExist()) {
          if (this.props.name !== this.state.pendingTab) {
            console.log("Show Pending Dialog - Tab");
            this.setState({
              showPendingDialog: true,
              pendingTab: prevProps.name,
            });
          }
        } else {
          //Fetch new data
          this.getMeSomeData();
        }
      }
    }
    if (this.state.refreshData) {
      this.refreshData();
    }
  }

  componentDidMount() {
    this.getMeSomeData();
  }

  setLinkEnabled = (link) => {
    if (!_.includes(this.state.linkEnabled, link)) {
      let items = [...this.state.linkEnabled];
      items.push(link);
      this.setState({ linkEnabled: items });
    }
  };

  getMeSomeData = async () => {
    const { filename, view } = this.props;

    const fetchData = async (args) => {
      try {
        const result = await this.getXMPData(args);
        return result;
      } catch (err) {
        return null;
      }
    };

    const processData = (results) => {
      if (results.length < 1) return;
      const collection = new XMPCollection();
      let multiVal = {};
      let newState = {
        data: collection,
        multiVal: multiVal,
        name: this.props.name,
        showPendingDialog: false,
        pendingTab: undefined,
        pendingFilename: [],
        commitedItems: [],
      };

      results.forEach((obj) => {
        if (!obj) return;
        const ogObj = collection.getByID(obj.id);
        if (ogObj) {
          let ogObjJSON = JSON.stringify(ogObj.getValue());
          let objJSON = JSON.stringify(obj.getValue());
          // If Value not the same, then consider it as MultiVal
          if (!_.isEqual(objJSON, ogObjJSON)) {
            if (!_.has(newState.multiVal, obj.id)) {
              newState.multiVal[obj.id] = [
                { filename: ogObj.filename[0], value: ogObj.getValue() },
              ];
            }
            newState.multiVal[obj.id].push({
              filename: obj.filename[0],
              value: obj.getValue(),
            });
            ogObj.emptyValue();
          }
          ogObj.setFilename(obj.filename[0]);
        } else {
          collection.push(obj);
        }
      });
      this.setState({ ...newState });
    };

    const promises = filename.flatMap((file) =>
      view.flatMap((element) => {
        const args = {
          filename: file,
          arrayType: _.isEmpty(element.arrayType) ? "bag" : element.arrayType,
          ..._.pick(element, [
            "id",
            "namespace",
            "prefix",
            "propertyName",
            "displayName",
            "linkToFile",
            "structure",
          ]),
        };

        if (element.linkToFile !== undefined && element.linkToFile !== "") {
          let link = element.linkToFile;
          link.clipFieldId = element.id;
          var linkIndex = _.findIndex(view, function (obj) {
            return obj.id === element.linkToFile.fileFieldId;
          });
          if (linkIndex !== -1) {
            this.setLinkEnabled(link);
          }
        }
        if (element.clipType !== undefined) args.clipType = element.clipType;
        if (!args.namespace) return [];

        const langs = element.altLangEnabled
          ? _.isEmpty(element.altLang)
            ? ["x-default"]
            : element.altLang
          : [];

        return [
          ...langs.map((lang) => ({
            ...args,
            id: `${element.id}-${lang}`,
            altLang: lang,
            altLangDefault: element.altLangDefault === lang,
          })),
          element.altLangEnabled ? null : args,
        ];
      })
    );

    try {
      const results = await Promise.all(promises.map(fetchData));
      processData(results);
    } catch (err) {
      error("Something went wrong", {
        actionLabel: "Copy error",
        onAction: () => {
          copyToClipboard(err);
        },
        timeout: 5000,
      });
    }
  };

  updateLink = (id) => {
    let items = [...this.state.linkEnabled];
    let result = _.findIndex(items, (obj) => _.includes(obj, id));
    let item = { ...items[result] };
    item.enabled = !item.enabled;
    items[result] = item;
    this.setState({ linkEnabled: items });
  };

  getXMPData = async (args) => {
    // Clone the args object without the 'arrayType' property, as getXMPfromJSX does not need it.
    const jsxArgs = { ...args };
    delete jsxArgs["arrayType"];
    // Fetch XMP data using the modified arguments.
    args.value = await getXMPfromJSX(jsxArgs);
    // If a structure is provided in the arguments, create and return an XMPStructureModel instance.
    if (args.structure) {
      return new XMPStructureModel(args);
    }
    // If Alternative Language or Alt Lang Default is provided in the arguments, create and return an XMPAltLangModel instance.
    if (!_.isEmpty(args?.altLang) || args?.altLangDefault) {
      return new XMPAltLangModel(args);
    }
    // In other cases, create and return a plain XMPModel instance.
    return new XMPModel(args);
  };

  handleChange = (value, id, obj = undefined, processLink = false) => {
    // Convert numeric values to strings for PPRO clip types of int and real
    value = typeof value === "number" ? value.toString() : value;
    const xmpObj = obj !== undefined ? obj : this.getXMPObjById(id);

    if (!xmpObj) throw `Field object not found for ${id}`;

    xmpObj.setValue(value);
    // Handle link-enabled items
    const items = [...this.state.linkEnabled];
    const result = _.findIndex(items, (item) => _.includes(item, id));
    if (result !== -1 && processLink === false) {
      const { enabled, clipFieldId, fileFieldId } =
        this.state.linkEnabled[result];
      if (enabled) {
        const linkedId = clipFieldId === id ? fileFieldId : clipFieldId;
        const linkedObj = this.getXMPObjById(linkedId);
        if (linkedObj.xmp.clipType === 3) {
          const truthy = ["yes", "true", "1", "y", "t"];
          value = truthy.includes(value.toLowerCase().trim())
            ? "True"
            : "False";
        }
        this.handleChange(value, linkedObj.id, linkedObj, true);
      }
    }
    // Find the root parent object
    const findParentObj = (obj) =>
      obj.parentID ? findParentObj(this.getXMPObjById(obj.parentID)) : obj;
    const pendingParentObj = findParentObj(xmpObj);
    // Update the uncommitedItems list based on the value change
    if (
      value !== xmpObj.getOGValue() ||
      _.some(this.state.commitedItems, { id: xmpObj.id })
    ) {
      if (!_.includes(this.state.uncommitedItems, pendingParentObj)) {
        this.state.uncommitedItems.push(pendingParentObj);
      }
    }
    this.setState({ uncommitedItems: this.state.uncommitedItems });
  };

  handleSave = async () => {
    let filename = this.props.filename;
    let pendingMode = false;
    if (!_.isEmpty(this.state.pendingFilename)) {
      filename = this.state.pendingFilename;
      pendingMode = true;
    }
    let actions = [];
    filename.map((file) => {
      const pendingChanges = this.state.uncommitedItems;
      _.map(pendingChanges, (xmpObj) => {
        let xmpObjJSON = xmpObj.toJSON();
        const args = {
          id: xmpObj.id,
          filename: file,
          clipType: xmpObj.xmp.clipType,
          value: xmpObjJSON,
        };
        const action = _.isEmpty(xmpObjJSON[xmpObj.xmp.propertyName].value)
          ? deleteXMPfromJSX(args)
          : setXMPfromJSX(args);
        actions.push(action);
      });
    });

    Promise.all(actions)
      .then((results) => {
        if (!_.isEmpty(results) && _.isArray(results)) {
          let isError = false;
          results.map((result) => {
            if (result.status === "success") {
              // on success - reset the field status to committed
              const xmpObj = this.state.data.getByID(result.id);
              _.pullAllBy(this.state.uncommitedItems, [xmpObj]);
              this.state.commitedItems.push(xmpObj);
            } else {
              isError = true;
              error("Something went wrong", {
                actionLabel: "Copy error",
                onAction: () => {
                  copyToClipboard(result.message);
                },
                timeout: 5000,
              });
            }
          });
          this.setState({ refreshData: pendingMode });
          if (!isError) {
            success("Metadata Updated", { timeout: 2000 });
          }
        }
      })
      .catch((err) => {
        error("Something went wrong", {
          actionLabel: "Copy error",
          onAction: () => {
            copyToClipboard(err);
          },
          timeout: 5000,
        });
      });
  };

  handleRevert = () => {
    const alteredItems = _.unionBy(
      this.state.uncommitedItems,
      this.state.commitedItems,
      "id"
    );
    if (_.isEmpty(alteredItems))
      return info("Nothing to Revert", { timeout: 2000 });
    _.map(alteredItems, (xmpObj) => {
      this.handleChange(_.cloneDeep(xmpObj.getOGValue()), xmpObj.id, xmpObj);
      // Empty these because we reverted to original state
      this.setState({ commitedItems: [] });
    });
    return success("Revert change(s)", { timeout: 2000 });
  };

  handlePendingDiscard = () => {
    this.setState({
      uncommitedItems: [],
      commitedItems: [],
      showPendingDialog: false,
      refreshData: true,
    });
  };

  handlePendingSave = () => {
    this.handleSave();
    this.setState({ showPendingDialog: false, pendingFilename: [] });
  };

  isPendingItemExist = () => {
    return this.isUncommittedItemExist();
  };

  isUncommittedItemExist = () => {
    return !_.isEmpty(this.state.uncommitedItems);
  };

  showRevertBtn = () => {
    return (
      !_.isEmpty(this.state.uncommitedItems) ||
      !_.isEmpty(this.state.commitedItems)
    );
  };

  getPendingDialogStatus = () => {
    return this.state.showPendingDialog;
  };

  getXMPObjById = (id) => {
    if (this.state.data) {
      return this.state.data.getByID(id);
    }
  };

  getFieldStatusById = (id) => {
    if (this.state.data) {
      const result = _.some(this.state.uncommitedItems, { id: id });
      if (result) return "pending";
    }
  };

  getFieldMultiValueById = (id) => {
    if (_.has(this.state.multiVal, id)) {
      return this.state.multiVal[id];
    }
  };

  getLinkEnabledList() {
    return this.state.linkEnabled;
  }

  refreshData = () => {
    this.getMeSomeData();
    this.setState({ refreshData: false });
  };

  render = () => {
    console.log("CHECK OUT THE CHANGES IN STATE - Provider >>>", this.state);
    return (
      <XMPContext.Provider
        value={{
          state: this.state,
          handleChange: this.handleChange,
          handleRevert: this.handleRevert,
          handleSave: this.handleSave,
          handlePendingSave: this.handlePendingSave,
          handlePendingDiscard: this.handlePendingDiscard,
          isPendingItemExist: this.isPendingItemExist,
          isUncommittedItemExist: this.isUncommittedItemExist,
          refreshDate: this.refreshData,
          getXMPObjById: this.getXMPObjById,
          getFieldStatusById: this.getFieldStatusById,
          getFieldMultiValueById: this.getFieldMultiValueById,
          showPendingDialog: this.getPendingDialogStatus(),
          getLinkEnabledList: this.getLinkEnabledList,
          updateLink: this.updateLink,
          linkEnabled: this.linkEnabled,
          showRevertBtn: this.showRevertBtn,
        }}
      >
        {this.props.children}
      </XMPContext.Provider>
    );
  };
}

export default XMPProvider;
