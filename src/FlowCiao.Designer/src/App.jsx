import { useState, useRef, useEffect } from "react";
import Flow from "./Components/Flow";
import { ExclamationCircleFilled, LoadingOutlined } from "@ant-design/icons";
import {
  ConfigProvider,
  Layout,
  Space,
  Input,
  Button,
  ColorPicker,
  Modal,
  Upload,
  Dropdown,
  message,
  Tooltip,
  Tour,
  Spin,
} from "antd";
import "./App.css";
import plusImg from "./Assets/plus.svg";
import importImg from "./Assets/import.svg";
import exportImg from "./Assets/export.svg";
import paintImg from "./Assets/paint.svg";
import publishImg from "./Assets/publish.svg";
import actionIconImg from "./Assets/action-icon.svg";
import uploadIconImg from "./Assets/upload-icon.svg";
import arrowDownIconImg from "./Assets/arrow-down-icon.svg";
import flowImg from "./Assets/flow-icon.svg";
import guideImg from "./Assets/help-icon.svg";
import headerActivitiesImg from "./Assets/header-activities-icon.svg"
import ApplicationContextProvider from "./Store/ApplicationContextProvider";
import useActivityData from "./apis/data/useActivityData";
import useFlowData from "./apis/data/useFlowData";
import useBuilderData from "./apis/data/useBuilderData";
const { Header, Content } = Layout;
const { confirm } = Modal;

function App() {
  const [messageApi, contextHolder] = message.useMessage();
  const flowDesignerRef = useRef();
  const [workflowName, setWorkflowName] = useState("My Flow");

  const handleExportFlowAsJSON = () => {
    if (flowDesignerRef.current) {
      var json = flowDesignerRef.current.exportFlowAsJSON();
      downloadJSON(json);
    }
  };

  const downloadJSON = (jsonString) => {
    const currentDateTime = new Date();
    const dateTime =
      currentDateTime.getFullYear().toString() +
      currentDateTime.getMonth().toString() +
      currentDateTime.getDay().toString() +
      "_" +
      currentDateTime.getHours().toString() +
      currentDateTime.getMinutes().toString() +
      currentDateTime.getSeconds().toString();
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = workflowName + `_jsonFlow_${dateTime}.json`; // Set the filename here
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleFileChange = (info) => {
    handleFileSelect(info.file);
  };
  const handleFileSelect = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const jsonData = JSON.parse(reader.result);
        if (flowDesignerRef.current) {
          var err = flowDesignerRef.current.importJson(jsonData);
          if (err != undefined && err != "") {
            messageApi.open({
              type: "error",
              content: err,
            });
          }
        }
      } catch (error) {
        console.error("Error parsing JSON file:", error);
      }
    };
    reader.readAsText(file);
  };

  const {
    isLoading: isBuilderLoading,
    error: builderError,
    sendBuildFlowRequest,
  } = useBuilderData();

  const onBuildClick = () => {
    if (flowDesignerRef.current) {
      var json = flowDesignerRef.current.exportFlowAsJSON();
      sendBuildFlowRequest(
        {
          params: { Content: json },
        },
        (response) => {
          if (response.status == 200 && response.data.status === "success") {
            messageApi.open({
              type: "success",
              content: "Building is successful",
            });
          } else {
            messageApi.open({
              type: "error",
              content: response.data.message,
            });
          }
        }
      );
    }
  };

  const {
    isLoading: isActivityListLoading,
    error,
    sendGetRequest: senGetActivitiesRequest,
    sendUploadDLLFileRequest: sendUploadActvitiesDllFileRequest,
  } = useActivityData();
  const [flowActivitiesList, setFlowActivitiesList] = useState([]);

  const [isUploadingDll, setIsUploadingDll] = useState(false);

  const handleActivityDllFileChange = (info) => {
    const fileReader = new FileReader();
    fileReader.onload = (e) => {
      const formDatas = new FormData();
      formDatas.append("file", info.file);
      setIsUploadingDll(true);
      sendUploadActvitiesDllFileRequest(
        {
          params: formDatas,
        },
        (response) => {
          setIsUploadingDll(false);

          if (response.success) {
            messageApi.open({
              type: "success",
              content: "Uploading is successful",
            });
            getActivities();
          } else {
            messageApi.open({
              type: "error",
              content: "Uploading is failed",
            });
          }
        }
      );
    };

    fileReader.readAsArrayBuffer(info.file);
  };

  const actionDropdownOnClick = (isOpen) => {
    if (isOpen) {
      getActivities();
    }
  };
  const getActivities = () => {
    senGetActivitiesRequest({}, (flowActivities) => {
      setFlowActivitiesList(flowActivities);
    });
  };

  var registerActivityDropDownItem = [
    {
      key: "headerRegisterActivity",
      label: (
        <Upload
          accept=".dll"
          onChange={handleActivityDllFileChange}
          showUploadList={false}
          beforeUpload={() => false} // Prevent auto-upload
        >
          <span className="activities-dropdown-item">
            <img src={uploadIconImg} />
            <span className="activity-name">Register or update Activity</span>
          </span>
        </Upload>
      ),
    },
  ];
  var activitiesDropDownItems = [];

  if (isActivityListLoading) {
    activitiesDropDownItems = [
      {
        key: 0,
        label: (
          <div className="dropdown-spin">
            <Spin
              indicator={
                <LoadingOutlined
                  style={{
                    fontSize: 24,
                  }}
                  spin
                />
              }
            />
          </div>
        ),
      },
    ];
  }
  if (flowActivitiesList.length > 0) {
    activitiesDropDownItems = [
      {
        key: "headerActivities",
        type: "group",
        label: "Custom Activities",
        overlayclassname: "activities-dropdown-items-container",
        children: flowActivitiesList.map((x, index) => ({
          key: index + 1,
          name: x.name,
          label: (
            <span className="activities-dropdown-item">
              <img src={actionIconImg} />
              <span className="activity-name">{x.name}</span>
            </span>
          ),
        })),
      },
      {
        type: "divider",
      },
    ];
  }

  activitiesDropDownItems = activitiesDropDownItems.concat(
    registerActivityDropDownItem
  );

  const [color, setColor] = useState("#1677ff");
  const onChangeColor = (selectedColor) => {
    setColor(selectedColor.toHexString());
    let element = document.getElementsByClassName("react-flow__node-idleNode");
    for (let i = 0; i < element.length; i++) {
      element[i].firstChild.style.setProperty(
        "border-top-color",
        selectedColor.toHexString(),
        "important"
      );
    }
  };

  const {
    isLoading: isFlowLoading,
    error: flowError,
    sendGetRequest: senGetFlowsRequest,
  } = useFlowData();
  const [previousFlows, setPreviousFlow] = useState([]);

  const getWorkflows = () => {
    senGetFlowsRequest({}, (data) => {
      var flowActivities = data.map((flow) => ({
        name: flow.name,
        json: flow.serializedJson,
      }));
      setPreviousFlow(flowActivities);
    });
  };

  const loadFlow = (serializedJson) => {
    try {
      const jsonData = JSON.parse(serializedJson);
      if (flowDesignerRef.current) {
        var err = flowDesignerRef.current.importJson(jsonData);
        if (err != undefined && err != "") {
          messageApi.open({
            type: "error",
            content: "Loading flow is failed",
          });
        }
      }
    } catch (error) {
      console.error("Error parsing JSON file:", error);
    }
  };

  var createNewFlowDropDownItem = [
    {
      key: "newFlow",
      overlayclassname: "header-activities-dropdown-new-flow",
      label: (
        <span className="activities-dropdown-item">
          <img
            src={plusImg}
            style={{
              filter:
                "brightness(0) saturate(100%) invert(37%) sepia(99%) saturate(695%) hue-rotate(189deg) brightness(91%) contrast(103%)",
            }}
          />
          <span className="activity-name">New Flow</span>
        </span>
      ),
    },
  ];
  var workflowItems = [];
  if (isFlowLoading) {
    workflowItems = [
      {
        key: 0,
        label: (
          <div className="dropdown-spin">
            <Spin
              indicator={
                <LoadingOutlined
                  style={{
                    fontSize: 24,
                  }}
                  spin
                />
              }
            />
          </div>
        ),
      },
    ];
  }
  if (previousFlows.length > 0) {
    workflowItems = [
      {
        key: "flows",
        type: "group",
        label: "Previous Flows",
        overlayclassname: "activities-dropdown-items-container",
        children: previousFlows.map((x, index) => ({
          key: index + 1,
          name: x.name,
          label: (
            <div
              className="activities-dropdown-item"
              onClick={() => {
                loadFlow(x.json);
              }}
            >
              <img src={flowImg} width={12} />
              <span className="activity-name">{x.name}</span>
            </div>
          ),
        })),
      },
      {
        type: "divider",
      },
    ];
  }

  workflowItems = workflowItems.concat(createNewFlowDropDownItem);

  const chooseWorkflowHandler = ({ key }) => {
    if (key == "newFlow") {
      resetFlowClick();
      getWorkflows();
    }
  };

  const [resetFlow, setResetFlow] = useState(false);
  const resetFlowClick = (isCleared = true) => {
    if (isCleared) {
      showConfirm();
    } else {
      setResetFlow(false);
    }
  };
  const showConfirm = () => {
    confirm({
      title: "Do you want to delete flow?",
      icon: <ExclamationCircleFilled />,
      // content: 'Some descriptions',
      okText: "Yes",
      onOk() {
        setWorkflowName("My Flow");
        setResetFlow(true);
      },
    });
  };

  const workflowNameOnChange = (event) => {
    setWorkflowName(event.target.value);
  };

  const [focused, setFocused] = useState(false);
  const workflowNameHandleBlur = () => {
    setFocused(false);
  };

  const workflowNameHandleFocus = () => {
    setFocused(true);
  };

  useEffect(() => {
    getActivities();
    getWorkflows();
  }, []);

  useEffect(() => {
    const errorHandler = (e) => {
      if (
        e.message.includes(
          "ResizeObserver loop completed with undelivered notifications" ||
            "ResizeObserver loop limit exceeded"
        )
      ) {
        const resizeObserverErr = document.getElementById(
          "webpack-dev-server-client-overlay"
        );
        if (resizeObserverErr) {
          resizeObserverErr.style.display = "none";
        }
      }
    };
    window.addEventListener("error", errorHandler);

    return () => {
      window.removeEventListener("error", errorHandler);
    };
  }, []);

  const publishBtnRef = useRef(null);
  const exportBtnRef = useRef(null);
  const importBtnRef = useRef(null);
  const activitiesBtnRef = useRef(null);
  const paintBtnRef = useRef(null);
  const flowNameRef = useRef(null);
  const flowContainerRef = useRef(null);
  const [istourOpen, setTourOpen] = useState(true);
  const tourSteps = [
    {
      title: "Save and Publish Your Workflow",
      description:
        'Once you\'re satisfied with your workflow design, click on the "Publish" button to save it to the database securely.',
      target: () => publishBtnRef.current,
    },
    {
      title: "Export Workflows",
      description:
        'Use the "Export" button to save your workflow as a JSON file',
      target: () => exportBtnRef.current,
    },
    {
      title: "Import Workflows",
      description:
        'the "Import" button allows you to import workflows from JSON files for collaboration or backup purposes',
      target: () => importBtnRef.current,
    },
    {
      title: "Register and Update Activities",
      description:
        'Utilize the "Activities" button to register or update activities from DLL files. These activities can be assigned as onEntry or onExit actions for each node in your workflow.',
      target: () => activitiesBtnRef.current,
    },
    {
      title: "Customize Node Colors",
      description:
        "Use the color picker in the header to customize the colors of your nodes, enhancing visual clarity and organization.",
      target: () => paintBtnRef.current,
    },
    {
      title: "Workflow Management",
      description:
        "Set a name for your workflow and Access a dropdown menu to view and select from your previously created workflows, facilitating easy navigation and management, and create new workflow",
      target: () => flowNameRef.current,
    },
    {
      title: "Design Your Flow",
      description: `Start with the Start Node, which is automatically placed on the canvas. This node signifies the beginning of your workflow.
      Click on the plus button on the Start Node to add other nodes connected to it. Each newly added node will also have a plus button, allowing you to expand your workflow as needed.
      Drag from one node to another to create transitions, defining the flow of your process.`,
      target: () => flowContainerRef.current,
    },
  ];

  const [isGuideModalOpen, setGuideModalOpen] = useState(false);

  return (
    <ApplicationContextProvider color={color}>
      <ConfigProvider
        theme={{
          components: {
            Layout: {
              headerBg: "#fff",
              headerHeight: "47px",
            },
          },
        }}
      >
        {contextHolder}
        <Layout className="main-layout">
          <Header className="main-header">
            <Space className="header-workflow-name-container" ref={flowNameRef}>
              <Input
                placeholder="Workflow Name"
                id="workflow-name"
                className={`${focused ? "focused" : ""}`}
                value={workflowName}
                onChange={workflowNameOnChange}
                onBlur={workflowNameHandleBlur}
                onFocus={workflowNameHandleFocus}
              />
              <Dropdown
                menu={{
                  items: workflowItems,
                  onClick: chooseWorkflowHandler,
                }}
                placement="bottomRight"
                trigger={["click"]}
                onOpenChange={(isOpen) => {
                  if (isOpen) {
                    getWorkflows();
                  }
                }}
              >
                <Button className="header-workflow-dropdown-btn">
                  <img src={arrowDownIconImg} width={12} />
                </Button>
              </Dropdown>
            </Space>
            <div className="header-botton-container">
              <Tooltip placement="bottom" title={"Build And Publish Flow"}>
                <Button
                  ref={publishBtnRef}
                  loading={isBuilderLoading}
                  className="header-btn"
                  style={{ background: "#0047FF" }}
                  icon={
                    <img
                      src={publishImg}
                      style={{ marginLeft: "2px" }}
                    />
                  }
                  onClick={onBuildClick}
                />
              </Tooltip>
              <Tooltip placement="bottom" title={"Export Flow"}>
                <Button
                  ref={exportBtnRef}
                  className="header-btn"
                  icon={<img src={exportImg} />}
                  onClick={handleExportFlowAsJSON}
                />
              </Tooltip>
              <Upload
                accept=".json"
                className="header-btn"
                onChange={handleFileChange}
                showUploadList={false}
                style={{ height: "100%" }}
                beforeUpload={() => false} // Prevent auto-upload
              >
                <Tooltip placement="bottom" title={"Import Flow"}>
                  <Button
                    ref={importBtnRef}
                    className="header-btn"
                    icon={<img src={importImg} />}
                  />
                </Tooltip>
              </Upload>
              <Dropdown
                menu={{
                  items: activitiesDropDownItems,
                }}
                placement="bottomRight"
                trigger={["click"]}
                onOpenChange={actionDropdownOnClick}
              >
                <Tooltip
                  placement="bottom"
                  title={"Register Or Update Activity"}
                >
                  <Button
                    ref={activitiesBtnRef}
                    loading={isUploadingDll}
                    className="header-btn header-activities-btn"
                  >
                    {/* <img className="activities-icon" src={actionIconImg} />
                    <img src={arrowDownIconImg} /> */}
                    <img src={headerActivitiesImg}/>
                  </Button>
                </Tooltip>
              </Dropdown>
              <ColorPicker defaultValue={color} onChange={onChangeColor}>
                <Tooltip placement="bottom" title={"Nodes Color Picker"}>
                  <Button
                    style={{ display: "relative" }}
                    ref={paintBtnRef}
                    className="header-btn"
                    icon={<img src={paintImg} />}
                  >
                    <div
                      className="selected-color"
                      style={{
                        background: `${color}`,
                      }}
                    ></div>
                  </Button>
                </Tooltip>
              </ColorPicker>
              <Dropdown
                menu={{
                  items: [
                    {
                      key: 1,
                      label: (
                        <span onClick={() => setGuideModalOpen(true)}>
                          Guide
                        </span>
                      ),
                    },
                    {
                      key: 2,
                      label: (
                        <span onClick={() => setTourOpen(true)}>Tour</span>
                      ),
                    },
                  ],
                }}
                placement="bottomRight"
                trigger={["click"]}
              >
                <Button className="header-btn">
                  <img src={guideImg} />
                </Button>
              </Dropdown>
            </div>
          </Header>
          <Content className="main-content" ref={flowContainerRef}>
            <div>
              <Flow
                ref={flowDesignerRef}
                resetFlowCalled={resetFlow}
                onResetFlowClick={resetFlowClick}
                workflowName={workflowName}
                onSetWorkflowName={(name) => {
                  setWorkflowName(name);
                }}
              />
            </div>
          </Content>
        </Layout>
      </ConfigProvider>
      <Tour
        open={istourOpen}
        onClose={() => setTourOpen(false)}
        steps={tourSteps}
      />
      <Modal
        title="FlowCiao Studio"
        centered
        open={isGuideModalOpen}
        
        style={{ overflow: "hidden" }}
        onCancel={() => setGuideModalOpen(false)}
        footer={[
          <Button
            key="ok"
            type="primary"
            onClick={() => setGuideModalOpen(false)}
          >
            OK
          </Button>,
        ]}
      >
        <div style={{ overflow: "auto", maxHeight: "70vh" }}>
          <h3>Getting Started</h3>
          <p>To start designing your workflow, follow these steps:</p>
          <ul>
            <li>
              <strong>Create a New Workflow:</strong>
              <span>
                {" "}
                Click on the "New Workflow" button to begin. Set a name for your
                workflow on the left side of the header.
              </span>
            </li>
            <li>
              <strong>Design Your Flow:</strong>
              <span>
                Start with the Start Node, which is automatically placed on the
                canvas. This node signifies the beginning of your workflow.
              </span>
            </li>
            <li>
              <strong>Add Nodes:</strong>
              <span>
                Click on the plus button on the Start Node to add other nodes
                connected to it. Each newly added node will also have a plus
                button, allowing you to expand your workflow as needed.
              </span>
            </li>
            <li>
              <strong>Connect Nodes: </strong>
              <span>
                Drag from one node to another to create transitions, defining
                the flow of your process.
              </span>
            </li>
            <li>
              <strong>Customize Node Colors:</strong>
              <span>
                Use the color picker in the header to customize the colors of
                your nodes, enhancing visual clarity and organization.
              </span>
            </li>
            <li>
              <strong>Register and Update Activities: </strong>
              <span>
                Utilize the "Activities" button to register or update activities
                from DLL files. These activities can be assigned as onEntry or
                onExit actions for each node in your workflow.
              </span>
            </li>
            <li>
              <strong>Save and Publish Your Workflow:</strong>
              <span>
                Once you're satisfied with your workflow design, click on the
                "Publish" button to save it to the database securely.
              </span>
            </li>
            <li>
              <strong>Export and Import Workflows:</strong>
              <span>
                Use the "Export" button to save your workflow as a JSON file.
                Conversely, the "Import" button allows you to import workflows
                from JSON files for collaboration or backup purposes.
              </span>
            </li>
          </ul>
          <strong>Additional Features</strong>
          <p>
            Access a dropdown menu to view and select from your previously
            created workflows, facilitating easy navigation and management.
          </p>
        </div>
      </Modal>
    </ApplicationContextProvider>
  );
}

export default App;
