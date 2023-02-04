// import "ag-grid-community/dist/styles/ag-grid.css";
// import "ag-grid-community/dist/styles/ag-theme-alpine.css";
// import "./index.css";
// import { Grid } from "./node_modules/ag-grid-community/dist/ag-grid-community.cjs.js";
const { Grid } = require("ag-grid-community")

const path = require("path")
const fs = require("fs")
// const fs = require("fs/promises");

const logger = require('tracer').colorConsole({
  format: '{{timestamp}} <{{title}}>{{file}}:{{line}}: {{message}}',
  dateformat: 'HH:MM:ss.L',
  level: process.env.TRACER_DEBUG || 'info' // 'debug'
})

logger.debug(" entry ")
logger.info(" entry ")
console.log(" entry ")

console.log("to turn log off: console.log = () => {}")
// console.log(" console.log turned off ")
// console.log = () => {}

const Store = require('electron-store')
const store = new Store()

// store.set('unicorn', '🦄')
// console.log(store, store.get('unicorn'))
console.log(store.get('unicorn'))

// this works with <script>require("./renderer.js")</script> in index.HTMLCollection
// and webPreferences nodeIntegration: true,

let rowData = [];

const columnDefs0 = [
  { field: "text1", editable: true, cellEditor: 'agLargeTextCellEditor', cellEditorPopup: true, textWrap: true, flex: 1 },
  {
    field: "text2",
    width: 120,
    cellRenderer(params) {
      const input = document.createElement("input");

      input.type = "checkbox";
      input.checked = params.value;
      input.classList.add("checkbox");
      input.addEventListener("change", (event) => {
        params.setValue(input.checked);
      });

      return input;
    },
  },
  {
    field: "metric",
    width: 100,
    cellRenderer(params) {
      const button = document.createElement("button");

      button.textContent = "✕";
      button.classList.add("btn", "remove-btn");
      button.addEventListener("click", () => { console.log("params: ", params, params.column.colId); removeTodo(params.rowIndex) });

      return button;
    },
  },
];

const headers = ['text1', 'text2', 'metric']
// const columnDefs = headers.map(el => { return { headerName: el, field: el } })
const columnDefs = [
  {
    headerName: 'text1',
    field: "text1",
    editable: true,
    flex: 1,
    resizable: true,
    autoHeight: true,
    wrapText: true,
    cellEditor: 'agLargeTextCellEditor',
    // cellEditorPopup: true,
  },
  {
    headerName: 'text2',
    field: "text2",
    editable: true,
    flex: 1,
    resizable: true,
    autoHeight: true,
    wrapText: true,
    cellEditor: 'agLargeTextCellEditor',
  },
  {
    headerName: 'metric',
    field: "metric",
    editable: true,
    width: 85
  },
]
const gridOptions = {
  columnDefs,
  rowData,
};
const saveBtn = document.getElementById("save-btn");
const restoreBtn = document.getElementById("restore-btn");
const addBtn = document.getElementById("add-btn");
const addTodo = () => {
  rowData = [...rowData, { task: "New Task", completed: false }];
  gridOptions.api.setRowData(rowData);
  console.log("addTodo ", rowData)
};
const removeTodo = (rowIndex) => {
  rowData = rowData.filter((value, index) => {
    return index !== rowIndex;
  });
  gridOptions.api.setRowData(rowData);
};

// https://stackoverflow.com/questions/32979630/how-can-i-display-a-save-as-dialog-in-an-electron-app
// const remote = require('electron').remote
// const dialog = remote.dialog
// const app = remote.app

// https://brainbell.com/javascript/show-save-dialog.html
// const {remote} = require('electron'),

const { ipcRenderer } = require("electron") // https://stackoverflow.com/questions/36637201/requiring-electron-dialog-from-render-process-is-undefined

const saveToFile = async () => {
  // window.electronAPI.saveToFile(JSON.stringify(rowData));
  console.log("renderer.js saveToFile() ")
  // let toLocalPath = path.resolve(app.getPath("desktop"), path.basename(remoteUrl))

  let res = ipcRenderer.invoke("save-to-file", JSON.stringify(rowData))
  // console.log(res)
  const v = await res
  console.log("v: ", v)
  // res.then((value)=>
  //   console.log('ipcRenderer.invoke returned: ' + value)
  // )
  return { success: true }
};

const restoreFromFile = async () => {
  // const result = await window.electronAPI.restoreFromFile();

  const result = await ipcRenderer.invoke("restore-from-file")

  console.log(" result: ", result)
  console.log("typeof result: ", typeof result)

  if (result.success) {
    let rowData
    if (typeof result.data === 'string') {
      rowData = JSON.parse(result.data);
    } else {
      rowData = result.data
    }
    // rowData = JSON.parse(result.data);
    console.log(" rowData: %o", rowData)
    console.log("typeof rowData: ", typeof rowData)

    console.log('gridOptions.api', gridOptions.api)
    console.log('typeof gridOptions.api', typeof gridOptions.api)

    gridOptions.api.setRowData(rowData);
  }
};

const restoreFromFile1 = (result) => {
  // const result = await window.electronAPI.restoreFromFile();

  // const result = await ipcRenderer.invoke("restore-from-file")

  console.log(" result: ", result)
  console.log("typeof result: ", typeof result)

  if (result.success) {
    let rowData
    if (typeof result.data === 'string') {
      rowData = JSON.parse(result.data);
    } else {
      rowData = result.data
    }
    // rowData = JSON.parse(result.data);
    console.log(" rowData: ", rowData)
    console.log("typeof rowData: ", typeof rowData)

    console.log('gridOptions.api', gridOptions.api)
    console.log('typeof gridOptions.api', typeof gridOptions.api)

    gridOptions.api.setRowData(rowData);
  }
};

ipcRenderer.on('file1-content',
  async (evt, result) => {
    console.log(' ipcRenderer.on("file1-content") ')
    console.log('%o', result)
    if (result.success) {
      if (typeof result.data === 'string') {
        rowData = JSON.parse(result.data);
      } else {
        rowData = result.data
      }
      // rowData = JSON.parse(result.data);

      console.log('%o', rowData)

      gridOptions.api.setRowData(rowData);
      // restoreFromFile1(result)

    }
  }
)

ipcRenderer.on('rowData',
  async (evt, rowData) => {
    console.log(' ipcRenderer.on("rowdata"): %o', rowData)
    gridOptions.api.setRowData(rowData);
    // restoreFromFile1(result)
  }
)

ipcRenderer.on('saveEdit',
  async evt => {
    let as_csv = gridOptions.api.getDataAsCsv()
    console.log(' as_csv[:100]: %o', as_csv.slice(0, 100))
    let rowData = []
    gridOptions.api.forEachNode(node => rowData.push(node.data))
    console.log('typeof rowData: %s, rowData[:10]: %s', typeof rowData, rowData.slice(0, 10))

    try {
      await ipcRenderer.invoke("update-rowdata", rowData)
    } catch (e) {
      console.log(e.message)
    }
  }
)


const gridDiv = document.getElementById("grid");
new Grid(gridDiv, gridOptions);

/* // from demo code

const setupGrid = () => {

  addBtn.addEventListener("click", addTodo);
  saveBtn.addEventListener("click", saveToFile);
  restoreBtn.addEventListener("click", restoreFromFile);
};

document.addEventListener("DOMContentLoaded", setupGrid);

*/