'use strict'
const path = require('path')
const createDebug = require('debug')
// const fs = require("fs")

// to turn off: unset DEBUG=debug, e.g. set DEBUG= or process.env.DEBUG=''
// for colors: set DEBUG_COLORS=1

const debug = createDebug('debug')

const cl = require('get-current-line').default
const fn = `${cl().file.match(/[\w.-]+$/)[0]} `

// fn + cl().line + ':'

if (process.env.IS_DEV) {
  const devtools = require('electron-debug')
  devtools()
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'
  console.log('1 debug: %o')
} else {
  console.log('0 debug')
}

/*
let debug = null, cl = null, fn = null
if (process.env.IS_DEV) {
  debug = createDebug('debug')
  const devtools = require('electron-debug')

  cl = require('get-current-line').default
  fn = () => {
    return `${cl().file.match(/[\w.-]+$/)[0]}`
  }
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'
  // devtools({ showDevTools: false }) // F12
  devtools()
  console.log("1 debug: %o", debug)
} else {
  debug = () => { }
  fn = () => { }
  cl = () => {
    return { line: '' }
  }
  // cl().line = () => {}
  console.log("0 debug: ", debug)
}
*/

console.log('IS_DEV: ', process.env.IS_DEV)
// console.log("debug: ", debug)
debug('main.js: %s %s', fn, cl().line)

// const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const fs = require('fs/promises')
const file2lines = require('./file2lines')
const genRowdata = require('./genRowdata')

// const zipLongest = (...args) => Array(Math.max(...args.map(a => a.length))).fill('').map((_, i) => args.map(a => a[i] === undefined ? '' : a[i]))
// const headers = ['text1', 'text2', 'metric']
// const columnDefs = headers.map(el => { return { headerName: el, field: el } })

let mainWindow
let col1 = []
let col2 = []
// eslint-disable-next-line prefer-const
let col3 = []

if (require('electron-squirrel-startup')) {
  app.quit()
}

const loadFile = async (win, file = 1) => {
  debug('%o open file1', fn + cl().line)
  const properties = ['openFile']
  if (file === 1) {
    properties.push('multiSelections')
  }

  try {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties,
      filters: [
        {
          name: 'json',
          extensions: ['json']
        }
      ]
    })

    debug('%o, %o', fn + cl().line, filePaths)

    if (!canceled) {
      // const [filePath] = filePaths

      // const data = await fs.readFile(filePath, 'utf8')

      debug('%o filePath: %o', fn + cl().line, filePaths)
      // col1 = (() => {
      try {
        debug('%o', 'executing file2lines...')
        if (file === 1) {
          for (const [idx, filePath] of filePaths.slice(0, 22).entries()) {
            debug('%o: %o, %o', fn + cl().line, idx, filePath)
            if (idx) {
              col2 = file2lines(filePath)
            } else {
              col1 = file2lines(filePath)
            }
          }
        } else {
          const [filePath] = filePaths
          col2 = file2lines(filePath)
        }

        debug('%o: %O', fn + cl().line, col1)
        // return _
      } catch (err) {
        debug('%o file2lines err: %o', cl().line, err.message)
        // throw new Error(err.message)
        // return []
      }
      // })()

      // debug('%o: %O', fn + cl().line, lines)

      // const data = { data: lines }
      // debug("%o: %o", fn + cl().line, data)
      // debug('%o: { success: true, data }: %o', fn + cl().line, { success: true, data })

      // const _ = { success: true, data: lines }
      /*
                [
                  {text1: 111, text2: 222, metric: 0},
                  {text1: 'aaa', text2: 'bbb', metric: 1},
                ]
                // */
      // const lines0 = [111, 'aaa']
      // const data = lines0.map(el => ({ text1: el }))

      // const _ = { success: true, data }
      // debug('%o %O', fn + cl().line, _)

      /*
       ipcMain.send('file1-content', (evt, data) =>{
        debug('%o, %O', fn + cl().line, _)
      })
      // */
      // mainWindow
      // win.webContents.send('file1-content', _)
      // return _

      const rowData = genRowdata(col1, col2, col3)

      // debug('%o, %o', fn + cl().line, rowData)
      win.webContents.send('rowData', rowData)
    } else {
      debug('%o, conceled', fn + cl().line)
      return { canceled }
    }
  } catch (error) {
    debug('%o, error: %o', fn + cl().line, error)
    return { error }
  }
}

const handleCommunication = () => {
  ipcMain.removeHandler('save-to-file')
  ipcMain.removeHandler('restore-from-file')
  ipcMain.handle('save-to-file', async (event, data) => {
    try {
      const { canceled, filePath } = await dialog.showSaveDialog({
        defaultPath: 'todo.json'
      })

      if (!canceled) {
        await fs.writeFile(filePath, data, 'utf8')

        return { success: true }
      }
      return {
        canceled
      }
    } catch (error) {
      return { error }
    }
  })
  ipcMain.handle('restore-from-file', async () => {
    try {
      const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
          {
            name: 'json',
            extensions: ['json']
          }
        ]
      })

      if (!canceled) {
        const [filePath] = filePaths
        const data = await fs.readFile(filePath, 'utf8')

        debug('%o: { success: true, data }: %o', fn + cl().line, { success: true, data })

        return { success: true, data }
      } else {
        return { canceled }
      }
    } catch (error) {
      return { error }
    }
  })
}
const createWindow = () => {
  // const mainWindow = new BrowserWindow({
  mainWindow = new BrowserWindow({
    webPreferences: {
      // preload1: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      preload: path.join(__dirname, 'preload.js'), // use a preload script
      nodeIntegration: true, // + contextIsolation: false to enable require
      contextIsolation: false,
      enableRemoteModule: true
    }
  })

  // mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
  // mainWindow.loadURL('index.html');
  mainWindow.loadFile(path.join(__dirname, 'index.html'))
  debug(fn + cl().line + ' loadFile index.html loaded')
  debug('%O: loadFile index.html loaded', fn + cl().line)

  // mainWindow.webContents.openDevTools();
  handleCommunication()
}

// app.on('ready', createWindow)
app.on('ready', () => {
  // do menu, from official docs
  const { app, Menu } = require('electron')

  const isMac = process.platform === 'darwin'

  const template = [
    // { role: 'appMenu' }
    ...(isMac
      ? [{
        label: app.name,
        submenu: [
          { role: 'about' },
          { type: 'separator' },
          { role: 'services' },
          { type: 'separator' },
          { role: 'hide' },
          { role: 'hideOthers' },
          { role: 'unhide' },
          { type: 'separator' },
          { role: 'quit' }
        ]
      }]
      : []),
    // { role: 'fileMenu' }
    {
      label: 'File',
      submenu: [
        {
          label: 'Open File1',
          accelerator: 'CmdOrCtrl+O',
          role: 'open',
          click: async () => { await loadFile(mainWindow) }
        },
        {
          label: 'Open File2',
          accelerator: 'CmdOrCtrl+P',
          role: 'open',
          click: async () => {
            debug('%o open file2', fn + cl().line)
          }
        },
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    // { role: 'editMenu' }
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        ...(isMac
          ? [
            { role: 'pasteAndMatchStyle' },
            { role: 'delete' },
            { role: 'selectAll' },
            { type: 'separator' },
            {
              label: 'Speech',
              submenu: [
                { role: 'startSpeaking' },
                { role: 'stopSpeaking' }
              ]
            }
          ]
          : [
            { role: 'delete' },
            { type: 'separator' },
            { role: 'selectAll' }
          ])
      ]
    },
    // { role: 'viewMenu' }
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    // { role: 'windowMenu' }
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        // { role: 'zoom' },
        ...(isMac
          ? [
            { type: 'separator' },
            { role: 'front' },
            { type: 'separator' },
            { role: 'window' }
          ]
          : [
            { role: 'close' }
          ])
      ]
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Goto repo',
          click: async () => {
            const { shell } = require('electron')
            // await shell.openExternal('https://electronjs.org')
            await shell.openExternal('https://github.com/ffreemt/ptextpad-electron')
          }
        },
        {
          label: 'Join qqgroup-316287378',
          click: async () => {
            const { shell } = require('electron')
            // await shell.openExternal('https://electronjs.org')
            // await shell.openExternal('https://github.com/ffreemt/ptextpad-electron')
            await shell.openExternal('https://jq.qq.com/?_wv=1027&k=9018eFSV')
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
  createWindow()
})
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

/*
ipcMain.handle("showDialog1", (e, message) => {
    debug(" ipcMain.handle 1")
    dialog.showMessageBox( { message });
    debug(" ipcMain.handle 2")
    return 'aaa'
})

ipcMain.handle("save-to-file-", async (event, data) => {
  try {
    const { canceled, filePath } = await dialog.showSaveDialog({
      defaultPath: "todo.json",
    });

    if (!canceled) {
      await fs.writeFile(filePath, data, "utf8");

      return { success: true };
    }
    return {
      canceled,
    };
  } catch (error) {
    return { error };
  }
});

// */
