'use strict'

// const createDebug = require('debug')
// const fs = require("fs")

// to turn off: unset DEBUG=debug, e.g. set DEBUG= or process.env.DEBUG=''
// for colors: set DEBUG_COLORS=1

// const debug = createDebug('debug')
// const cl = require('get-current-line').default
// const fn = `${cl().file.match(/[\w.-]+$/)[0]} `

// const consola = require('consola')
// consola.level = process.env.CONSOLA_DEBUG || 4

// const assert = require('assert')

const logger = require('tracer').colorConsole({
  format: '{{timestamp}} <{{title}}>{{file}}:{{line}}: {{message}}',
  dateformat: 'HH:MM:ss.L',
  level: process.env.TRACER_DEBUG || 'info' // 'debug'
})
// const logger = {}
// logger.debug = () => {}

// fn + cl().line + ':'

if (process.env.IS_DEV) {
  const devtools = require('electron-debug')
  devtools()
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'
  console.log('1 debug')
  logger.debug('1 debug')
} else {
  logger.debug('0 debug')
  console.log('0 debug')
}
logger.info(' entry ... ')

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
logger.debug('IS_DEV: ', process.env.IS_DEV)
// console.log("debug: ", debug)
// debug('main.js: %s %s', fn, cl().line)

// const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const fs = require('fs/promises')
const path = require('path')
const { spawn } = require('node:child_process')
const file2lines = require('./file2lines')
const genRowdata = require('./genRowdata')
// const zmqAlign = require('./zmqAlign')
const restAlign = require('./restAlign')

const file1 = './data/test-en.txt'
const file2 = './data/test-zh.txt'

// const lines1 = file2lines(file1)
// const lines2 = file2lines(file2)
const lines1 = () => {
  try { return file2lines(file1) }
  catch (e) {return path.resolve(file1) + ': ' + e.name + ' ' + e.message}
}
const lines2 = () => {
  try { return file2lines(file2) }
  catch (e) {return path.resolve(file2) + ': ' + e.name + ' ' + e.message}}

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
  // debug('%o open file %o', fn + cl().line, file)
  const properties = ['openFile']
  if (file === 1) {
    properties.push('multiSelections')
  }

  try {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties,
      filters: [
        {
          name: 'textfile',
          extensions: ['txt', 'md']
        }
      ]
    })

    // debug('%o, %o', fn + cl().line, filePaths)
    logger.debug('loaded: %s', filePaths)

    if (!canceled) {
      // const [filePath] = filePaths

      // const data = await fs.readFile(filePath, 'utf8')

      // debug('%o filePath: %o', fn + cl().line, filePaths)
      try {
        logger.debug('executing file2lines(%s)... ', file)
        if (file === 1) {
          for (const [idx, filePath] of filePaths.slice(0, 22).entries()) {
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

      } catch (err) {
        throw new Error(err.message)
      }

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

      const rowData = genRowdata({ col1, col2, col3 })

      win.webContents.send('rowData', rowData)
      return { success: true, rowData }
    } else {
      logger.debug(' conceled')
      return { canceled }
    }
  } catch (error) {
    logger.debug('error: %s', error)
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

  logger.debug(' index.html loaded')

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
            // debug('%o open file2', fn + cl().line)
            logger.debug('open file2')
            let res = []
            try {
              res = await loadFile(mainWindow, 2)
            } catch (err) {
              dialog.showErrorBox('Error', err)
            }
            if (res.success) {
              dialog.showMessageBox(
                {
                  message: 'File 2 successfully loaded.',
                  title: 'Info',
                  buttons: ['OK'],
                  type: 'info' // none/info/error/question/warning https://newsn.net/say/electron-dialog-messagebox.html
                }
              )
            } else {
              dialog.showMessageBox(
                {
                  message: 'Loading File 2 canceled.',
                  title: 'Info',
                  buttons: ['OK'],
                  type: 'warning' // none/info/error/question/warning https://newsn.net/say/electron-dialog-messagebox.html
                }
              )
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Align',
          accelerator: 'CmdOrCtrl+L',
          click: async () => {
            logger.debug('Align clicked...')
            logger.debug("\n\n\t=== col1 ", typeof col1, Array.isArray(col1))
            logger.debug("\n\n\t===  col2 ", typeof col2, Array.isArray(col2))
            logger.debug("\n\n\t=== lines1 ", typeof lines1, Array.isArray(lines1))
            logger.debug("\n\n\t===  lines2 ", typeof lines2, Array.isArray(lines2))

            // /*
            let rowData
            try {
              // rowData = await zmqAlign(col1, col2)
              // rowData = await zmqAlign(lines1, lines2)
              // rowData = await restAlign(lines1, lines2)
              rowData = await restAlign(col1, col2)
            } catch (e) {
              logger.error(e)
              rowData = { text1: e.name, text2: e.message }
            }

            // /*
            // logger.debug(' rowData: %j', rowData)

            logger.debug(' rowData from col1 col2: %j',  rowData)

            // /*
            if (!rowData) {
              logger.error(' rowData is undefined ')
            }
            else {
              logger.debug(' send to  via rowData channel ')
              rowData.map((el, idx) => {if (idx < 5) logger.debug(' send to  via rowData channel ') })

              mainWindow.webContents.send('rowData', rowData)
            }
            // */
          }
        },
        { type: 'separator' },
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
              // { role: 'selectAll' },
              // { type: 'separator' },
              {
                label: 'Speech',
                submenu: [
                  { role: 'startSpeaking' },
                  { role: 'stopSpeaking' }
                ]
              }
            ]
          : [
              { role: 'delete' }
              // { type: 'separator' },
              // { role: 'selectAll' },
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
        },
        { label: `v.${require('../package.json').version}` }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
  createWindow()

  // console.log('process.cwd()：', process.cwd())
  // consola.log('process.cwd()：', process.cwd())

  // start zmq(zmq.REP) at default port 5555
  // python\install\python.exe -s -m dezmq
  // const python = spawn('python/install/python.exe', ['-s', '-m', 'dezmq']);

  logger.debug('process.cwd()：', process.cwd())
  const pythonExecPath = path.join(__dirname, '../python/install/python.exe')
  logger.debug('python_exc_path： %s', pythonExecPath)

  /*  comment this line to include python
  // const python = spawn(pythonExecPath, ['-s', '-m', 'dezmq'])
  const python = spawn(pythonExecPath, ['-s', '-m', 'dezrest'])

  python.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`)
  })

  python.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`)
  })

  python.on('close', (code) => {
    console.log(`child process exited with code ${code}`)
  })
  // */
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
